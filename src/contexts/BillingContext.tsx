'use client';

/**
 * Billing Context
 * Manages subscription, billing, and usage tracking
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';

export interface Subscription {
  id: string;
  userId: string;
  tierId: string;
  tier: {
    id: string;
    name: string;
    displayName: string;
    features: Record<string, any>;
    limits: {
      monthlyRequests?: number;
      maxFileSize?: number;
      maxStorage?: number;
      maxTeamMembers?: number;
    };
  };
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface UsageStats {
  aiRequests: number;
  aiCost: number;
  storageUsed: number;
  executionMinutes: number;
  mcpOperations: number;
  totalCost: number;
}

interface BillingContextType {
  subscription: Subscription | null;
  usage: UsageStats | null;
  loading: boolean;
  error: string | null;

  // Subscription operations
  createSubscription: (tierId: string, billingCycle: 'monthly' | 'annual', discountCode?: string) => Promise<boolean>;
  upgradeSubscription: (newTierId: string) => Promise<boolean>;
  cancelSubscription: (immediately?: boolean) => Promise<boolean>;
  refreshSubscription: () => Promise<void>;

  // Usage operations
  getUsage: (period?: string) => Promise<UsageStats | null>;
  checkQuota: (feature: string) => boolean;
  getRemainingQuota: (feature: string) => number;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
      loadUsage();
    } else {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/billing/subscriptions');

      if (!response.ok) {
        throw new Error('Failed to load subscription');
      }

      const data = await response.json();
      const subscriptions = data.data || [];

      // Get active subscription
      const activeSubscription = subscriptions.find((s: Subscription) => s.status === 'active');
      setSubscription(activeSubscription || null);
    } catch (err: any) {
      console.error('Error loading subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsage = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/billing/usage');

      if (!response.ok) {
        throw new Error('Failed to load usage');
      }

      const data = await response.json();
      setUsage(data.data || null);
    } catch (err: any) {
      console.error('Error loading usage:', err);
    }
  };

  const createSubscription = async (tierId: string, billingCycle: 'monthly' | 'annual', discountCode?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch('/api/billing/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId,
          billingCycle,
          discountCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      await loadSubscription();
      return true;
    } catch (err: any) {
      console.error('Error creating subscription:', err);
      setError(err.message);
      return false;
    }
  };

  const upgradeSubscription = async (newTierId: string): Promise<boolean> => {
    if (!subscription) return false;

    try {
      const response = await fetch('/api/billing/subscriptions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          action: 'upgrade',
          newTierId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade subscription');
      }

      await loadSubscription();
      return true;
    } catch (err: any) {
      console.error('Error upgrading subscription:', err);
      setError(err.message);
      return false;
    }
  };

  const cancelSubscription = async (immediately = false): Promise<boolean> => {
    if (!subscription) return false;

    try {
      const response = await fetch('/api/billing/subscriptions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          action: immediately ? 'cancel_immediately' : 'cancel',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await loadSubscription();
      return true;
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      setError(err.message);
      return false;
    }
  };

  const refreshSubscription = async () => {
    await loadSubscription();
    await loadUsage();
  };

  const getUsage = async (period = 'current'): Promise<UsageStats | null> => {
    try {
      const response = await fetch(`/api/billing/usage?period=${period}`);

      if (!response.ok) {
        throw new Error('Failed to get usage');
      }

      const data = await response.json();
      return data.data || null;
    } catch (err: any) {
      console.error('Error getting usage:', err);
      return null;
    }
  };

  const checkQuota = useCallback((feature: string): boolean => {
    if (!subscription || !usage) return false;

    const limits = subscription.tier.limits;

    switch (feature) {
      case 'ai_requests':
        return limits.monthlyRequests ? usage.aiRequests < limits.monthlyRequests : true;
      case 'storage':
        return limits.maxStorage ? usage.storageUsed < limits.maxStorage : true;
      default:
        return true;
    }
  }, [subscription, usage]);

  const getRemainingQuota = useCallback((feature: string): number => {
    if (!subscription || !usage) return 0;

    const limits = subscription.tier.limits;

    switch (feature) {
      case 'ai_requests':
        return limits.monthlyRequests ? Math.max(0, limits.monthlyRequests - usage.aiRequests) : Infinity;
      case 'storage':
        return limits.maxStorage ? Math.max(0, limits.maxStorage - usage.storageUsed) : Infinity;
      default:
        return Infinity;
    }
  }, [subscription, usage]);

  const value: BillingContextType = {
    subscription,
    usage,
    loading,
    error,
    createSubscription,
    upgradeSubscription,
    cancelSubscription,
    refreshSubscription,
    getUsage,
    checkQuota,
    getRemainingQuota,
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
