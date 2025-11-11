// Usage Tracker - Real-time Usage Monitoring
// Tracks user usage against subscription limits

import Redis from 'ioredis';
import { createClient } from '@/lib/supabase/client';
import {
  UsageType,
  UsageLimitCheck,
  UsageLimitViolation,
  UsageSnapshot,
  SubscriptionTier,
  BillingError,
} from '@/types/billing';

export class UsageTracker {
  private redis: Redis;
  private supabase = createClient();

  constructor() {
    // Initialize Redis client
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  // ===== Track Usage =====

  async trackUsage(
    userId: string,
    usageType: UsageType,
    quantity: number = 1,
    metadata: any = {}
  ): Promise<void> {
    try {
      const timestamp = new Date();
      const month = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      // Update Redis counters for real-time tracking
      const keys = [
        `usage:${userId}:${usageType}:${month}`,
        `usage:${userId}:${usageType}:total`,
        `usage:global:${usageType}:${month}`,
      ];

      // Use pipeline for atomic operations
      const pipeline = this.redis.pipeline();

      for (const key of keys) {
        pipeline.incrby(key, quantity);
        pipeline.expire(key, 60 * 60 * 24 * 32); // 32 days
      }

      await pipeline.exec();

      // Store detailed usage record in database
      await this.storeUsageRecord(userId, usageType, quantity, timestamp, metadata);

      // Check limits and send alerts if needed
      await this.checkUsageLimits(userId);
    } catch (error: any) {
      throw new BillingError(
        `Failed to track usage: ${error.message}`,
        'USAGE_TRACK_ERROR',
        500
      );
    }
  }

  // ===== Check Usage Limits =====

  async checkUsageLimits(userId: string): Promise<UsageLimitCheck> {
    try {
      // Get user's subscription
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return { withinLimits: true };
      }

      // Get subscription tier
      const tier = await this.getSubscriptionTier(subscription.tier_id);

      if (!tier) {
        return { withinLimits: true };
      }

      // Get current usage
      const currentUsage = await this.getCurrentUsage(userId);

      const violations: UsageLimitViolation[] = [];

      // Check each limit
      const limitChecks: Array<{
        type: UsageType;
        limit: number | null;
        usage: number;
      }> = [
        {
          type: 'messages',
          limit: tier.limits.messagesPerMonth,
          usage: currentUsage.messages,
        },
        {
          type: 'api_requests',
          limit: tier.limits.apiRequests,
          usage: currentUsage.api_requests,
        },
        {
          type: 'mcp_calls',
          limit: tier.limits.mcpServers,
          usage: currentUsage.mcp_calls,
        },
        {
          type: 'projects',
          limit: tier.limits.projects,
          usage: currentUsage.projects,
        },
      ];

      for (const check of limitChecks) {
        if (check.limit === null) continue; // Unlimited

        // Hard limit violation
        if (check.usage >= check.limit) {
          violations.push({
            type: check.type,
            usage: check.usage,
            limit: check.limit,
            severity: 'hard',
          });
        }
        // Warning threshold (80%)
        else if (check.usage >= check.limit * 0.8) {
          violations.push({
            type: check.type,
            usage: check.usage,
            limit: check.limit,
            severity: 'warning',
          });
        }
      }

      // Send notifications for violations
      if (violations.length > 0) {
        await this.sendUsageLimitNotifications(userId, violations);
      }

      return {
        withinLimits: violations.filter((v) => v.severity === 'hard').length === 0,
        violations,
      };
    } catch (error: any) {
      console.error('Error checking usage limits:', error);
      return { withinLimits: true };
    }
  }

  // ===== Get Current Usage =====

  async getCurrentUsage(userId: string): Promise<UsageSnapshot> {
    try {
      const timestamp = new Date();
      const month = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      const usageTypes: UsageType[] = [
        'messages',
        'ai_requests',
        'file_uploads',
        'mcp_calls',
        'storage',
        'team_members',
        'projects',
        'api_requests',
      ];

      const usage: UsageSnapshot = {
        messages: 0,
        ai_requests: 0,
        file_uploads: 0,
        mcp_calls: 0,
        storage: 0,
        team_members: 0,
        projects: 0,
        api_requests: 0,
      };

      // Get usage from Redis
      const pipeline = this.redis.pipeline();

      for (const type of usageTypes) {
        const key = `usage:${userId}:${type}:${month}`;
        pipeline.get(key);
      }

      const results = await pipeline.exec();

      if (results) {
        usageTypes.forEach((type, index) => {
          const result = results[index];
          if (result && result[1]) {
            usage[type] = parseInt(result[1] as string) || 0;
          }
        });
      }

      return usage;
    } catch (error: any) {
      console.error('Error getting current usage:', error);
      return {
        messages: 0,
        ai_requests: 0,
        file_uploads: 0,
        mcp_calls: 0,
        storage: 0,
        team_members: 0,
        projects: 0,
        api_requests: 0,
      };
    }
  }

  // ===== Get Usage History =====

  async getUsageHistory(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('usage_records')
      .select('*')
      .eq('user_id', userId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: false });

    if (error) return [];

    return data;
  }

  // ===== Get Monthly Aggregation =====

  async getMonthlyAggregation(userId: string, year: number, month: number): Promise<any> {
    const { data, error } = await this.supabase
      .from('usage_aggregations')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      year: data.year,
      month: data.month,
      messagesCount: data.messages_count,
      aiRequestsCount: data.ai_requests_count,
      fileUploadsCount: data.file_uploads_count,
      mcpCallsCount: data.mcp_calls_count,
      storageBytes: data.storage_bytes,
      teamMembersCount: data.team_members_count,
      projectsCount: data.projects_count,
      apiRequestsCount: data.api_requests_count,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // ===== Check Single Limit =====

  async canUseFeature(userId: string, usageType: UsageType): Promise<boolean> {
    try {
      const limitCheck = await this.checkUsageLimits(userId);

      if (!limitCheck.violations) return true;

      // Check if there's a hard violation for this specific usage type
      const hardViolation = limitCheck.violations.find(
        (v) => v.type === usageType && v.severity === 'hard'
      );

      return !hardViolation;
    } catch (error) {
      console.error('Error checking feature usage:', error);
      return true; // Fail open to not block users on errors
    }
  }

  // ===== Reset Usage =====

  async resetMonthlyUsage(userId: string): Promise<void> {
    try {
      const timestamp = new Date();
      const month = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      const usageTypes: UsageType[] = [
        'messages',
        'ai_requests',
        'file_uploads',
        'mcp_calls',
        'storage',
        'team_members',
        'projects',
        'api_requests',
      ];

      // Reset Redis counters
      const pipeline = this.redis.pipeline();

      for (const type of usageTypes) {
        const key = `usage:${userId}:${type}:${month}`;
        pipeline.del(key);
      }

      await pipeline.exec();
    } catch (error: any) {
      console.error('Error resetting usage:', error);
    }
  }

  // ===== Helper Methods =====

  private async storeUsageRecord(
    userId: string,
    usageType: UsageType,
    quantity: number,
    timestamp: Date,
    metadata: any
  ): Promise<void> {
    try {
      // Store in database
      await this.supabase.from('usage_records').insert({
        user_id: userId,
        usage_type: usageType,
        quantity,
        recorded_at: timestamp,
        metadata,
      });

      // Also update aggregation table using database function
      await this.supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_usage_type: usageType,
        p_quantity: quantity,
      });
    } catch (error: any) {
      console.error('Error storing usage record:', error);
    }
  }

  private async getUserSubscription(userId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return data;
  }

  private async getSubscriptionTier(tierId: string): Promise<SubscriptionTier | null> {
    const { data, error } = await this.supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      monthlyPrice: parseFloat(data.monthly_price),
      yearlyPrice: parseFloat(data.yearly_price),
      currency: data.currency,
      stripeMonthlyPriceId: data.stripe_monthly_price_id,
      stripeYearlyPriceId: data.stripe_yearly_price_id,
      features: data.features || [],
      limits: {
        messagesPerMonth: data.messages_per_month,
        modelsAccess: data.models_access,
        mcpServers: data.mcp_servers,
        storageGb: data.storage_gb,
        teamMembers: data.team_members,
        projects: data.projects,
        apiRequests: data.api_requests,
        priority: data.priority,
        supportLevel: data.support_level,
      },
      priority: data.priority,
      supportLevel: data.support_level,
      isActive: data.is_active,
      isPublic: data.is_public,
      targetAudience: data.target_audience || [],
      displayOrder: data.display_order,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private async sendUsageLimitNotifications(
    userId: string,
    violations: UsageLimitViolation[]
  ): Promise<void> {
    try {
      // Send notifications for each violation
      for (const violation of violations) {
        const message =
          violation.severity === 'hard'
            ? `You have reached your ${violation.type} limit (${violation.limit}). Please upgrade your plan to continue.`
            : `You have used ${Math.round(
                (violation.usage / violation.limit) * 100
              )}% of your ${violation.type} limit.`;

        // Queue notification
        await this.supabase.from('notification_queue').insert({
          user_id: userId,
          type: 'email',
          subject: `Usage Limit ${violation.severity === 'hard' ? 'Reached' : 'Warning'}`,
          content: message,
          status: 'pending',
          metadata: {
            violation_type: violation.type,
            severity: violation.severity,
            usage: violation.usage,
            limit: violation.limit,
          },
        });
      }
    } catch (error) {
      console.error('Error sending usage notifications:', error);
    }
  }

  // ===== Batch Operations =====

  async batchTrackUsage(
    records: Array<{
      userId: string;
      usageType: UsageType;
      quantity: number;
      metadata?: any;
    }>
  ): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      const timestamp = new Date();
      const month = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;

      for (const record of records) {
        const keys = [
          `usage:${record.userId}:${record.usageType}:${month}`,
          `usage:${record.userId}:${record.usageType}:total`,
        ];

        for (const key of keys) {
          pipeline.incrby(key, record.quantity);
          pipeline.expire(key, 60 * 60 * 24 * 32);
        }
      }

      await pipeline.exec();

      // Store in database
      const usageRecords = records.map((record) => ({
        user_id: record.userId,
        usage_type: record.usageType,
        quantity: record.quantity,
        recorded_at: timestamp,
        metadata: record.metadata || {},
      }));

      await this.supabase.from('usage_records').insert(usageRecords);
    } catch (error: any) {
      console.error('Error batch tracking usage:', error);
    }
  }

  // ===== Cleanup =====

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

// Export singleton instance
export const usageTracker = new UsageTracker();
