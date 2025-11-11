// Feature Gating System
// Controls access to features based on subscription tier

import { createClient } from '@/lib/supabase/client';
import { usageTracker } from './usage-tracker';
import { getTierById } from './subscription-tiers';
import { UsageType } from '@/types/billing';

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentTier?: string;
  requiredTier?: string;
}

export class FeatureGate {
  private supabase = createClient();

  /**
   * Check if user has access to a specific feature
   */
  async checkFeatureAccess(
    userId: string,
    featureId: string
  ): Promise<FeatureGateResult> {
    try {
      // Get user's subscription
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select(
          `
          *,
          subscription_tiers (*)
        `
        )
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Default to free tier if no subscription
      const tierId = subscription?.tier_id || 'free';
      const tier = getTierById(tierId);

      if (!tier) {
        return {
          allowed: false,
          reason: 'Unable to determine subscription tier',
        };
      }

      // Check if feature exists in tier
      const feature = tier.features.find((f) => f.id === featureId);

      if (!feature) {
        return {
          allowed: false,
          reason: `Feature ${featureId} not available in ${tier.name} tier`,
          upgradeRequired: true,
          currentTier: tierId,
        };
      }

      // Check boolean features
      if (feature.type === 'boolean') {
        return {
          allowed: feature.value === true,
          reason: feature.value
            ? undefined
            : `Feature not available in ${tier.name} tier`,
          upgradeRequired: !feature.value,
          currentTier: tierId,
        };
      }

      // Check limit features
      if (feature.type === 'limit') {
        // For limit features, check usage
        const usage = await usageTracker.getCurrentUsage(userId);
        const usageType = this.mapFeatureToUsageType(featureId);

        if (usageType) {
          const currentUsage = usage[usageType] || 0;
          const limit = feature.value;

          if (currentUsage >= limit) {
            return {
              allowed: false,
              reason: `You have reached your ${featureId} limit (${limit})`,
              upgradeRequired: true,
              currentTier: tierId,
            };
          }
        }
      }

      return {
        allowed: true,
        currentTier: tierId,
      };
    } catch (error: any) {
      console.error('Error checking feature access:', error);
      // Fail open to not block users on errors
      return {
        allowed: true,
        reason: 'Unable to verify access',
      };
    }
  }

  /**
   * Check if user can use a specific model
   */
  async canAccessModel(
    userId: string,
    modelId: string
  ): Promise<FeatureGateResult> {
    try {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('tier_id, subscription_tiers(*)')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const tierId = subscription?.tier_id || 'free';
      const tier = getTierById(tierId);

      if (!tier) {
        return { allowed: false, reason: 'Unable to determine tier' };
      }

      // Check if tier has access to all models
      if (tier.limits.modelsAccess === null) {
        return { allowed: true, currentTier: tierId };
      }

      // Check if model is in allowed list
      if (
        Array.isArray(tier.limits.modelsAccess) &&
        tier.limits.modelsAccess.includes(modelId)
      ) {
        return { allowed: true, currentTier: tierId };
      }

      return {
        allowed: false,
        reason: `Model ${modelId} not available in ${tier.name} tier`,
        upgradeRequired: true,
        currentTier: tierId,
        requiredTier: 'pro',
      };
    } catch (error) {
      return { allowed: true };
    }
  }

  /**
   * Check if user can create a team
   */
  async canCreateTeam(userId: string): Promise<FeatureGateResult> {
    return this.checkFeatureAccess(userId, 'team-workspaces');
  }

  /**
   * Check if user can use MCP servers
   */
  async canUseMCPServers(userId: string): Promise<FeatureGateResult> {
    try {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('tier_id')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const tierId = subscription?.tier_id || 'free';
      const tier = getTierById(tierId);

      if (!tier) {
        return { allowed: false };
      }

      // Free tier has no MCP servers
      if (tier.limits.mcpServers === 0) {
        return {
          allowed: false,
          reason: 'MCP servers not available in Free tier',
          upgradeRequired: true,
          currentTier: tierId,
          requiredTier: 'pro',
        };
      }

      // Check if unlimited
      if (tier.limits.mcpServers === null) {
        return { allowed: true, currentTier: tierId };
      }

      // Check current usage
      const usage = await usageTracker.getCurrentUsage(userId);
      const currentUsage = usage.mcp_calls || 0;

      if (currentUsage >= tier.limits.mcpServers) {
        return {
          allowed: false,
          reason: `You have reached your MCP server limit (${tier.limits.mcpServers})`,
          upgradeRequired: true,
          currentTier: tierId,
        };
      }

      return { allowed: true, currentTier: tierId };
    } catch (error) {
      return { allowed: true };
    }
  }

  /**
   * Check if user can use API
   */
  async canUseAPI(userId: string): Promise<FeatureGateResult> {
    try {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('tier_id')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const tierId = subscription?.tier_id || 'free';
      const tier = getTierById(tierId);

      if (!tier || tier.limits.apiRequests === 0) {
        return {
          allowed: false,
          reason: 'API access not available in your tier',
          upgradeRequired: true,
          currentTier: tierId,
          requiredTier: 'pro',
        };
      }

      // Check if unlimited
      if (tier.limits.apiRequests === null) {
        return { allowed: true, currentTier: tierId };
      }

      // Check current usage
      const usage = await usageTracker.getCurrentUsage(userId);
      const currentUsage = usage.api_requests || 0;

      if (currentUsage >= tier.limits.apiRequests) {
        return {
          allowed: false,
          reason: `You have reached your API request limit (${tier.limits.apiRequests})`,
          upgradeRequired: true,
          currentTier: tierId,
        };
      }

      return { allowed: true, currentTier: tierId };
    } catch (error) {
      return { allowed: true };
    }
  }

  /**
   * Check if user has reached message limit
   */
  async canSendMessage(userId: string): Promise<FeatureGateResult> {
    try {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('tier_id')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const tierId = subscription?.tier_id || 'free';
      const tier = getTierById(tierId);

      if (!tier) {
        return { allowed: false };
      }

      // Check if unlimited
      if (tier.limits.messagesPerMonth === null) {
        return { allowed: true, currentTier: tierId };
      }

      // Check current usage
      const usage = await usageTracker.getCurrentUsage(userId);
      const currentUsage = usage.messages || 0;

      if (currentUsage >= tier.limits.messagesPerMonth) {
        return {
          allowed: false,
          reason: `You have reached your message limit (${tier.limits.messagesPerMonth})`,
          upgradeRequired: true,
          currentTier: tierId,
          requiredTier: 'pro',
        };
      }

      return { allowed: true, currentTier: tierId };
    } catch (error) {
      return { allowed: true };
    }
  }

  /**
   * Get user's current tier info
   */
  async getUserTier(userId: string): Promise<any> {
    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('tier_id')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const tierId = subscription?.tier_id || 'free';
    return getTierById(tierId);
  }

  // Helper method to map feature IDs to usage types
  private mapFeatureToUsageType(featureId: string): UsageType | null {
    const mapping: Record<string, UsageType> = {
      messages: 'messages',
      'api-access': 'api_requests',
      mcp: 'mcp_calls',
      projects: 'projects',
      'file-uploads': 'file_uploads',
    };

    return mapping[featureId] || null;
  }
}

// Export singleton instance
export const featureGate = new FeatureGate();

/**
 * Middleware helper to check feature access
 */
export async function requireFeature(
  userId: string,
  featureId: string
): Promise<{ allowed: boolean; error?: string }> {
  const result = await featureGate.checkFeatureAccess(userId, featureId);

  if (!result.allowed) {
    return {
      allowed: false,
      error: result.reason || 'Access denied',
    };
  }

  return { allowed: true };
}

/**
 * React hook helper (to be used in components)
 */
export function useFeatureGate() {
  return {
    checkFeature: async (featureId: string) => {
      // This will be called from client components
      const response = await fetch('/api/billing/features/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId }),
      });
      return response.json();
    },
    canAccessModel: async (modelId: string) => {
      const response = await fetch('/api/billing/features/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      return response.json();
    },
  };
}
