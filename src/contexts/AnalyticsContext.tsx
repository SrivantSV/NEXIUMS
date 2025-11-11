'use client';

/**
 * Analytics Context
 * Tracks user events and provides analytics data across the platform
 */

import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useUser } from './UserContext';

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface AnalyticsContextType {
  // Event tracking
  trackEvent: (event: string, properties?: Record<string, any>) => void;
  trackPageView: (page: string, properties?: Record<string, any>) => void;

  // Feature usage tracking
  trackFeatureUsage: (feature: string, action: string, properties?: Record<string, any>) => void;

  // AI usage tracking
  trackAIUsage: (model: string, tokens: number, cost: number, properties?: Record<string, any>) => void;

  // File tracking
  trackFileOperation: (operation: string, fileType: string, properties?: Record<string, any>) => void;

  // Artifact tracking
  trackArtifactOperation: (operation: string, artifactType: string, properties?: Record<string, any>) => void;

  // MCP tracking
  trackMCPOperation: (server: string, action: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const flushTimeout = useRef<NodeJS.Timeout | null>(null);

  // Flush events to server
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events on failure
      eventQueue.current = [...events, ...eventQueue.current];
    }
  }, []);

  // Queue event and schedule flush
  const queueEvent = useCallback((event: AnalyticsEvent) => {
    eventQueue.current.push({
      ...event,
      timestamp: event.timestamp || Date.now(),
    });

    // Schedule flush (debounced)
    if (flushTimeout.current) {
      clearTimeout(flushTimeout.current);
    }
    flushTimeout.current = setTimeout(flushEvents, 1000);
  }, [flushEvents]);

  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    if (!user) return;

    queueEvent({
      event,
      properties: {
        ...properties,
        userId: user.id,
        userEmail: user.email,
      },
    });
  }, [user, queueEvent]);

  const trackPageView = useCallback((page: string, properties?: Record<string, any>) => {
    trackEvent('page_view', {
      page,
      ...properties,
    });
  }, [trackEvent]);

  const trackFeatureUsage = useCallback((feature: string, action: string, properties?: Record<string, any>) => {
    trackEvent('feature_usage', {
      feature,
      action,
      ...properties,
    });
  }, [trackEvent]);

  const trackAIUsage = useCallback((model: string, tokens: number, cost: number, properties?: Record<string, any>) => {
    trackEvent('ai_usage', {
      model,
      tokens,
      cost,
      ...properties,
    });
  }, [trackEvent]);

  const trackFileOperation = useCallback((operation: string, fileType: string, properties?: Record<string, any>) => {
    trackEvent('file_operation', {
      operation,
      fileType,
      ...properties,
    });
  }, [trackEvent]);

  const trackArtifactOperation = useCallback((operation: string, artifactType: string, properties?: Record<string, any>) => {
    trackEvent('artifact_operation', {
      operation,
      artifactType,
      ...properties,
    });
  }, [trackEvent]);

  const trackMCPOperation = useCallback((server: string, action: string, properties?: Record<string, any>) => {
    trackEvent('mcp_operation', {
      server,
      action,
      ...properties,
    });
  }, [trackEvent]);

  const value: AnalyticsContextType = {
    trackEvent,
    trackPageView,
    trackFeatureUsage,
    trackAIUsage,
    trackFileOperation,
    trackArtifactOperation,
    trackMCPOperation,
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
