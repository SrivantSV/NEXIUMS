'use client';

/**
 * Analytics Context
 * Tracks usage, performance, and insights across the platform
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  requestsByModel: Record<string, number>;
  costsByModel: Record<string, number>;
  requestsByDate: Array<{ date: string; count: number; cost: number }>;
}

export interface PerformanceMetrics {
  averageLatency: number;
  successRate: number;
  errorRate: number;
  p95Latency: number;
  p99Latency: number;
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  lastUsed: string;
  totalTimeSpent: number;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: string;
  userId: string;
}

interface AnalyticsContextType {
  // Usage stats
  usageStats: UsageStats | null;
  loadingStats: boolean;
  refreshStats: (timeRange?: 'day' | 'week' | 'month' | 'year') => Promise<void>;

  // Performance
  performance: PerformanceMetrics | null;
  loadingPerformance: boolean;

  // Feature usage
  featureUsage: FeatureUsage[];
  loadingFeatureUsage: boolean;

  // Event tracking
  trackEvent: (eventType: string, eventData?: Record<string, any>) => Promise<void>;
  trackPageView: (pageName: string, metadata?: Record<string, any>) => Promise<void>;
  trackFeatureUse: (featureName: string, metadata?: Record<string, any>) => Promise<void>;
  trackError: (error: Error, context?: Record<string, any>) => Promise<void>;

  // Analytics queries
  getEventsByType: (eventType: string, limit?: number) => Promise<AnalyticsEvent[]>;
  getCustomMetric: (metricName: string, params?: Record<string, any>) => Promise<any>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [loadingFeatureUsage, setLoadingFeatureUsage] = useState(false);

  // Refresh usage stats
  const refreshStats = useCallback(async (timeRange: 'day' | 'week' | 'month' | 'year' = 'month') => {
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/analytics/usage?timeRange=${timeRange}`);

      if (!response.ok) {
        console.error('Failed to fetch usage stats');
        return;
      }

      const { data } = await response.json();
      setUsageStats(data);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Load performance metrics
  const loadPerformance = useCallback(async () => {
    try {
      setLoadingPerformance(true);
      const response = await fetch('/api/analytics/performance');

      if (!response.ok) {
        console.error('Failed to fetch performance metrics');
        return;
      }

      const { data } = await response.json();
      setPerformance(data);
    } catch (error) {
      console.error('Error loading performance:', error);
    } finally {
      setLoadingPerformance(false);
    }
  }, []);

  // Load feature usage
  const loadFeatureUsage = useCallback(async () => {
    try {
      setLoadingFeatureUsage(true);
      const response = await fetch('/api/analytics/features');

      if (!response.ok) {
        console.error('Failed to fetch feature usage');
        return;
      }

      const { data } = await response.json();
      setFeatureUsage(data || []);
    } catch (error) {
      console.error('Error loading feature usage:', error);
    } finally {
      setLoadingFeatureUsage(false);
    }
  }, []);

  // Track generic event
  const trackEvent = useCallback(async (eventType: string, eventData: Record<string, any> = {}) => {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          eventData,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, []);

  // Track page view
  const trackPageView = useCallback(async (pageName: string, metadata: Record<string, any> = {}) => {
    await trackEvent('page_view', {
      pageName,
      ...metadata,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    });
  }, [trackEvent]);

  // Track feature use
  const trackFeatureUse = useCallback(async (featureName: string, metadata: Record<string, any> = {}) => {
    await trackEvent('feature_use', {
      featureName,
      ...metadata,
    });
  }, [trackEvent]);

  // Track error
  const trackError = useCallback(async (error: Error, context: Record<string, any> = {}) => {
    await trackEvent('error', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      ...context,
    });
  }, [trackEvent]);

  // Get events by type
  const getEventsByType = useCallback(async (eventType: string, limit = 100): Promise<AnalyticsEvent[]> => {
    try {
      const response = await fetch(`/api/analytics/events?type=${eventType}&limit=${limit}`);

      if (!response.ok) return [];

      const { data } = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }, []);

  // Get custom metric
  const getCustomMetric = useCallback(async (metricName: string, params: Record<string, any> = {}): Promise<any> => {
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const response = await fetch(`/api/analytics/metrics/${metricName}?${queryParams}`);

      if (!response.ok) return null;

      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting custom metric:', error);
      return null;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    refreshStats();
    loadPerformance();
    loadFeatureUsage();
  }, [refreshStats, loadPerformance, loadFeatureUsage]);

  const value: AnalyticsContextType = {
    usageStats,
    loadingStats,
    refreshStats,
    performance,
    loadingPerformance,
    featureUsage,
    loadingFeatureUsage,
    trackEvent,
    trackPageView,
    trackFeatureUse,
    trackError,
    getEventsByType,
    getCustomMetric,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
