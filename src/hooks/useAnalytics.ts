// React Hook for Analytics
'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  AnalyticsMetrics,
  AnalyticsInsights,
  TimePeriod,
  Timeframe
} from '@/types/analytics';

interface UseAnalyticsOptions {
  userId?: string;
  workspaceId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseAnalyticsReturn {
  metrics: AnalyticsMetrics | null;
  insights: AnalyticsInsights | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  exportData: (format?: 'json' | 'csv') => Promise<void>;
}

export function useAnalytics(
  period: TimePeriod = '7d',
  options: UseAnalyticsOptions = {}
): UseAnalyticsReturn {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        period
      });

      if (options.userId) {
        params.append('userId', options.userId);
      }

      const response = await fetch(`/api/analytics?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();

      setMetrics(data.data.metrics);
      setInsights(data.data.insights);
    } catch (err) {
      setError(err as Error);
      console.error('Analytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period, options.userId]);

  const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format,
          period,
          includeInsights: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export error:', err);
      throw err;
    }
  }, [period]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh
  useEffect(() => {
    if (!options.autoRefresh) return;

    const interval = setInterval(
      fetchAnalytics,
      options.refreshInterval || 60000 // Default: 1 minute
    );

    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval, fetchAnalytics]);

  return {
    metrics,
    insights,
    isLoading,
    error,
    refetch: fetchAnalytics,
    exportData
  };
}

// Hook for cost analytics
export function useCostAnalytics(period: TimePeriod = '7d') {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCostAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/costs?period=${period}`);

      if (!response.ok) {
        throw new Error('Failed to fetch cost analytics');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err as Error);
      console.error('Cost analytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchCostAnalytics();
  }, [fetchCostAnalytics]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCostAnalytics
  };
}

// Hook for model analytics
export function useModelAnalytics(period: TimePeriod = '7d') {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModelAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/models?period=${period}`);

      if (!response.ok) {
        throw new Error('Failed to fetch model analytics');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err as Error);
      console.error('Model analytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchModelAnalytics();
  }, [fetchModelAnalytics]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchModelAnalytics
  };
}
