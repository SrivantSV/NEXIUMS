// Analytics Event Collector
// Responsible for collecting and tracking events across the platform

import { createClient } from '@/lib/supabase/client';
import type {
  AnalyticsEvent,
  EnrichedAnalyticsEvent,
  AIRequestEvent,
  EventType
} from '@/types/analytics';

interface EventContext {
  sessionId: string;
  userAgent: string;
  ipAddress?: string;
  platform: string;
  version: string;
}

export class EventCollector {
  private supabase = createClient();
  private eventQueue: EnrichedAnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private batchSize = 50;
  private flushIntervalMs = 5000; // 5 seconds

  constructor() {
    this.startBatchProcessing();
  }

  /**
   * Track a generic analytics event
   */
  async trackEvent(
    eventType: EventType,
    userId: string,
    properties: Record<string, any> = {},
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const enrichedEvent = await this.enrichEvent({
        id: crypto.randomUUID(),
        type: eventType,
        userId,
        timestamp: new Date(),
        properties,
        metadata
      }, userId);

      // Add to queue for batch processing
      this.eventQueue.push(enrichedEvent);

      // Flush if batch size reached
      if (this.eventQueue.length >= this.batchSize) {
        await this.flush();
      }
    } catch (error) {
      console.error('Failed to track event:', error);
      this.handleTrackingError(eventType, error);
    }
  }

  /**
   * Track an AI model request
   */
  async trackAIRequest(
    userId: string,
    modelId: string,
    modelName: string,
    provider: string,
    options: {
      inputTokens: number;
      outputTokens: number;
      responseTime: number;
      cost: number;
      wasRouted?: boolean;
      routerConfidence?: number;
      status?: 'success' | 'error' | 'timeout';
      errorType?: string;
      sessionId?: string;
      projectId?: string;
    }
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('model_requests')
        .insert({
          user_id: userId,
          session_id: options.sessionId || this.getSessionId(),
          project_id: options.projectId,
          model_id: modelId,
          model_name: modelName,
          provider,
          input_tokens: options.inputTokens,
          output_tokens: options.outputTokens,
          total_tokens: options.inputTokens + options.outputTokens,
          cost: options.cost,
          response_time: options.responseTime,
          was_routed: options.wasRouted || false,
          router_confidence: options.routerConfidence,
          status: options.status || 'success',
          error_type: options.errorType
        })
        .select('id')
        .single();

      if (error) throw error;

      // Also track as generic event
      await this.trackEvent('ai_request', userId, {
        modelId,
        modelName,
        provider,
        tokens: options.inputTokens + options.outputTokens,
        cost: options.cost,
        responseTime: options.responseTime
      });

      return data.id;
    } catch (error) {
      console.error('Failed to track AI request:', error);
      throw error;
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(
    userId: string,
    featureId: string,
    featureName: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Upsert feature usage
      const { error } = await this.supabase
        .from('feature_usage')
        .upsert({
          user_id: userId,
          feature_id: featureId,
          feature_name: featureName,
          usage_count: 1,
          last_used_at: new Date().toISOString(),
          metadata
        }, {
          onConflict: 'user_id,feature_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      // Track as event
      await this.trackEvent('feature_usage', userId, {
        featureId,
        featureName,
        ...metadata
      });
    } catch (error) {
      console.error('Failed to track feature usage:', error);
    }
  }

  /**
   * Track cost
   */
  async trackCost(
    userId: string,
    amount: number,
    costType: string,
    options: {
      teamId?: string;
      projectId?: string;
      modelId?: string;
      featureId?: string;
      potentialCost?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    try {
      const savings = options.potentialCost
        ? options.potentialCost - amount
        : 0;

      const { error } = await this.supabase
        .from('cost_tracking')
        .insert({
          user_id: userId,
          team_id: options.teamId,
          project_id: options.projectId,
          cost_type: costType,
          amount,
          model_id: options.modelId,
          feature_id: options.featureId,
          potential_cost: options.potentialCost,
          savings,
          billing_period: new Date().toISOString().split('T')[0],
          metadata: options.metadata || {}
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to track cost:', error);
    }
  }

  /**
   * Track session start
   */
  async trackSessionStart(
    userId: string,
    sessionId: string,
    deviceInfo: {
      deviceType?: string;
      browser?: string;
      os?: string;
      screenResolution?: string;
    } = {}
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('session_analytics')
        .insert({
          user_id: userId,
          session_id: sessionId,
          started_at: new Date().toISOString(),
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          screen_resolution: deviceInfo.screenResolution,
          entry_page: window?.location?.pathname || '/'
        });

      if (error) throw error;

      await this.trackEvent('user_login', userId, { sessionId });
    } catch (error) {
      console.error('Failed to track session start:', error);
    }
  }

  /**
   * Track session end
   */
  async trackSessionEnd(
    userId: string,
    sessionId: string,
    duration: number
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('session_analytics')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
          exit_page: window?.location?.pathname || '/'
        })
        .eq('session_id', sessionId);

      if (error) throw error;

      await this.trackEvent('user_logout', userId, { sessionId, duration });
    } catch (error) {
      console.error('Failed to track session end:', error);
    }
  }

  /**
   * Track user feedback on AI request
   */
  async trackUserFeedback(
    requestId: string,
    rating: number,
    comment?: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('model_requests')
        .update({
          user_feedback_rating: rating,
          user_feedback_comment: comment,
          user_feedback_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to track user feedback:', error);
    }
  }

  /**
   * Enrich event with context
   */
  private async enrichEvent(
    event: AnalyticsEvent,
    userId: string
  ): Promise<EnrichedAnalyticsEvent> {
    const context = await this.getEventContext(userId);

    return {
      ...event,
      sessionId: context.sessionId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress || '',
      userTier: await this.getUserTier(userId),
      userSegment: await this.getUserSegment(userId),
      platform: context.platform,
      version: context.version
    };
  }

  /**
   * Get event context
   */
  private async getEventContext(userId: string): Promise<EventContext> {
    return {
      sessionId: this.getSessionId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      platform: typeof window !== 'undefined' ? 'web' : 'server',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    };
  }

  /**
   * Get user tier
   */
  private async getUserTier(userId: string): Promise<string> {
    try {
      const { data } = await this.supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      return data?.subscription_tier || 'free';
    } catch {
      return 'free';
    }
  }

  /**
   * Get user segment
   */
  private async getUserSegment(userId: string): Promise<string> {
    try {
      const { data } = await this.supabase
        .from('user_analytics_summary')
        .select('engagement_score')
        .eq('user_id', userId)
        .single();

      const score = data?.engagement_score || 0;

      if (score >= 80) return 'power_user';
      if (score >= 50) return 'active_user';
      if (score >= 20) return 'casual_user';
      return 'new_user';
    } catch {
      return 'new_user';
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Start batch processing
   */
  private startBatchProcessing(): void {
    this.flushInterval = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.flushIntervalMs);
  }

  /**
   * Flush event queue to database
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { error } = await this.supabase
        .from('analytics_events')
        .insert(
          eventsToFlush.map(event => ({
            event_type: event.type,
            user_id: event.userId,
            session_id: event.sessionId,
            timestamp: event.timestamp.toISOString(),
            properties: event.properties,
            metadata: event.metadata,
            user_tier: event.userTier,
            user_segment: event.userSegment,
            user_agent: event.userAgent,
            platform: event.platform,
            version: event.version
          }))
        );

      if (error) {
        console.error('Failed to flush events:', error);
        // Re-queue failed events
        this.eventQueue.push(...eventsToFlush);
      }
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Re-queue failed events
      this.eventQueue.push(...eventsToFlush);
    }
  }

  /**
   * Handle tracking errors
   */
  private handleTrackingError(eventType: EventType, error: any): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Analytics tracking error for ${eventType}:`, error);
    }

    // In production, could send to error tracking service
    // For now, just fail silently to not disrupt user experience
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(); // Final flush
  }
}

// Singleton instance
let eventCollectorInstance: EventCollector | null = null;

export function getEventCollector(): EventCollector {
  if (!eventCollectorInstance) {
    eventCollectorInstance = new EventCollector();
  }
  return eventCollectorInstance;
}

// Convenience functions for common events
export const analytics = {
  track: (eventType: EventType, userId: string, properties?: Record<string, any>) => {
    return getEventCollector().trackEvent(eventType, userId, properties);
  },

  trackAIRequest: (
    userId: string,
    modelId: string,
    modelName: string,
    provider: string,
    options: Parameters<EventCollector['trackAIRequest']>[4]
  ) => {
    return getEventCollector().trackAIRequest(userId, modelId, modelName, provider, options);
  },

  trackFeature: (userId: string, featureId: string, featureName: string) => {
    return getEventCollector().trackFeatureUsage(userId, featureId, featureName);
  },

  trackCost: (userId: string, amount: number, costType: string, options?: any) => {
    return getEventCollector().trackCost(userId, amount, costType, options);
  },

  trackFeedback: (requestId: string, rating: number, comment?: string) => {
    return getEventCollector().trackUserFeedback(requestId, rating, comment);
  }
};
