'use client';

/**
 * Billing Context
 * Manages subscriptions, payments, and usage-based billing
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export interface UsageQuota {
  apiQuotaLimit: number;
  apiQuotaUsed: number;
  apiQuotaRemaining: number;
  storageQuotaLimit: number;
  storageQuotaUsed: number;
  teamMembersLimit: number;
  teamMembersUsed: number;
  resetDate: string;
}

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  createdAt: string;
  dueDate: string | null;
  paidAt: string | null;
  invoiceUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PricingPlan {
  tier: 'free' | 'pro' | 'team' | 'enterprise';
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    apiQuota: number;
    storageQuota: number;
    teamMembers: number;
    maxCostPerRequest: number;
  };
}

interface BillingContextType {
  // Subscription
  subscription: Subscription | null;
  loadingSubscription: boolean;
  refreshSubscription: () => Promise<void>;

  // Quotas
  quotas: UsageQuota | null;
  loadingQuotas: boolean;
  refreshQuotas: () => Promise<void>;
  quotaPercentageUsed: number;
  isNearQuotaLimit: boolean;
  isOverQuota: boolean;

  // Subscription actions
  upgradePlan: (tier: 'pro' | 'team' | 'enterprise') => Promise<{ success: boolean; checkoutUrl?: string }>;
  downgradePlan: (tier: 'free' | 'pro') => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  resumeSubscription: () => Promise<boolean>;

  // Invoices
  invoices: Invoice[];
  loadingInvoices: boolean;
  loadInvoices: () => Promise<void>;

  // Payment methods
  paymentMethods: PaymentMethod[];
  loadingPaymentMethods: boolean;
  loadPaymentMethods: () => Promise<void>;
  addPaymentMethod: () => Promise<{ success: boolean; setupUrl?: string }>;
  removePaymentMethod: (id: string) => Promise<boolean>;
  setDefaultPaymentMethod: (id: string) => Promise<boolean>;

  // Pricing
  pricingPlans: PricingPlan[];
  getCurrentPlan: () => PricingPlan | null;
}

const defaultPricingPlans: PricingPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: ['Basic AI access', 'Limited API calls', 'Community support'],
    limits: {
      apiQuota: 100,
      storageQuota: 100 * 1024 * 1024, // 100 MB
      teamMembers: 1,
      maxCostPerRequest: 0.01,
    },
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 20,
    currency: 'USD',
    interval: 'month',
    features: ['Full AI model access', '10,000 requests/month', 'Priority support', 'Advanced features'],
    limits: {
      apiQuota: 10000,
      storageQuota: 10 * 1024 * 1024 * 1024, // 10 GB
      teamMembers: 1,
      maxCostPerRequest: 0.10,
    },
  },
  {
    tier: 'team',
    name: 'Team',
    price: 100,
    currency: 'USD',
    interval: 'month',
    features: ['Everything in Pro', 'Team collaboration', '100,000 requests/month', 'Dedicated support'],
    limits: {
      apiQuota: 100000,
      storageQuota: 100 * 1024 * 1024 * 1024, // 100 GB
      teamMembers: 10,
      maxCostPerRequest: 1.00,
    },
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 500,
    currency: 'USD',
    interval: 'month',
    features: ['Unlimited requests', 'Custom integrations', 'SLA guarantee', '24/7 support'],
    limits: {
      apiQuota: -1, // Unlimited
      storageQuota: -1, // Unlimited
      teamMembers: -1, // Unlimited
      maxCostPerRequest: -1, // Unlimited
    },
  },
];

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [quotas, setQuotas] = useState<UsageQuota | null>(null);
  const [loadingQuotas, setLoadingQuotas] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  const supabase = createClient();

  // Refresh subscription
  const refreshSubscription = useCallback(async () => {
    try {
      setLoadingSubscription(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription(null);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading subscription:', error);
        return;
      }

      if (data) {
        setSubscription({
          id: data.id,
          userId: data.user_id,
          tier: data.tier,
          status: data.status,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end || false,
          stripeSubscriptionId: data.stripe_subscription_id,
          stripeCustomerId: data.stripe_customer_id,
        });
      }
    } catch (error) {
      console.error('Error in refreshSubscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  }, [supabase]);

  // Refresh quotas
  const refreshQuotas = useCallback(async () => {
    try {
      setLoadingQuotas(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setQuotas(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading quotas:', error);
        return;
      }

      if (profile) {
        const resetDate = new Date();
        resetDate.setMonth(resetDate.getMonth() + 1, 1);
        resetDate.setHours(0, 0, 0, 0);

        setQuotas({
          apiQuotaLimit: profile.api_quota_limit || 100,
          apiQuotaUsed: profile.monthly_requests || 0,
          apiQuotaRemaining: Math.max(0, (profile.api_quota_limit || 100) - (profile.monthly_requests || 0)),
          storageQuotaLimit: profile.storage_quota_limit || 100 * 1024 * 1024,
          storageQuotaUsed: profile.storage_used || 0,
          teamMembersLimit: profile.team_members_limit || 1,
          teamMembersUsed: 0, // TODO: Calculate from team_members table
          resetDate: resetDate.toISOString(),
        });
      }
    } catch (error) {
      console.error('Error in refreshQuotas:', error);
    } finally {
      setLoadingQuotas(false);
    }
  }, [supabase]);

  // Upgrade plan
  const upgradePlan = useCallback(async (tier: 'pro' | 'team' | 'enterprise') => {
    try {
      const response = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const result = await response.json();

      if (result.success) {
        await refreshSubscription();
        await refreshQuotas();
      }

      return result;
    } catch (error) {
      console.error('Error upgrading plan:', error);
      return { success: false };
    }
  }, [refreshSubscription, refreshQuotas]);

  // Downgrade plan
  const downgradePlan = useCallback(async (tier: 'free' | 'pro') => {
    try {
      const response = await fetch('/api/billing/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const { success } = await response.json();

      if (success) {
        await refreshSubscription();
        await refreshQuotas();
      }

      return success;
    } catch (error) {
      console.error('Error downgrading plan:', error);
      return false;
    }
  }, [refreshSubscription, refreshQuotas]);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
      });

      const { success } = await response.json();

      if (success) {
        await refreshSubscription();
      }

      return success;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }, [refreshSubscription]);

  // Resume subscription
  const resumeSubscription = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/resume', {
        method: 'POST',
      });

      const { success } = await response.json();

      if (success) {
        await refreshSubscription();
      }

      return success;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      return false;
    }
  }, [refreshSubscription]);

  // Load invoices
  const loadInvoices = useCallback(async () => {
    try {
      setLoadingInvoices(true);
      const response = await fetch('/api/billing/invoices');

      if (!response.ok) return;

      const { data } = await response.json();
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  // Load payment methods
  const loadPaymentMethods = useCallback(async () => {
    try {
      setLoadingPaymentMethods(true);
      const response = await fetch('/api/billing/payment-methods');

      if (!response.ok) return;

      const { data } = await response.json();
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  }, []);

  // Add payment method
  const addPaymentMethod = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/payment-methods', {
        method: 'POST',
      });

      return await response.json();
    } catch (error) {
      console.error('Error adding payment method:', error);
      return { success: false };
    }
  }, []);

  // Remove payment method
  const removePaymentMethod = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/billing/payment-methods/${id}`, {
        method: 'DELETE',
      });

      const { success } = await response.json();

      if (success) {
        await loadPaymentMethods();
      }

      return success;
    } catch (error) {
      console.error('Error removing payment method:', error);
      return false;
    }
  }, [loadPaymentMethods]);

  // Set default payment method
  const setDefaultPaymentMethod = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/billing/payment-methods/${id}/default`, {
        method: 'POST',
      });

      const { success } = await response.json();

      if (success) {
        await loadPaymentMethods();
      }

      return success;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return false;
    }
  }, [loadPaymentMethods]);

  // Get current plan
  const getCurrentPlan = useCallback(() => {
    if (!subscription) return null;
    return defaultPricingPlans.find(p => p.tier === subscription.tier) || null;
  }, [subscription]);

  // Calculate quota metrics
  const quotaPercentageUsed = quotas
    ? (quotas.apiQuotaUsed / quotas.apiQuotaLimit) * 100
    : 0;
  const isNearQuotaLimit = quotaPercentageUsed >= 80;
  const isOverQuota = quotaPercentageUsed >= 100;

  // Load initial data
  useEffect(() => {
    refreshSubscription();
    refreshQuotas();
  }, [refreshSubscription, refreshQuotas]);

  const value: BillingContextType = {
    subscription,
    loadingSubscription,
    refreshSubscription,
    quotas,
    loadingQuotas,
    refreshQuotas,
    quotaPercentageUsed,
    isNearQuotaLimit,
    isOverQuota,
    upgradePlan,
    downgradePlan,
    cancelSubscription,
    resumeSubscription,
    invoices,
    loadingInvoices,
    loadInvoices,
    paymentMethods,
    loadingPaymentMethods,
    loadPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    pricingPlans: defaultPricingPlans,
    getCurrentPlan,
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
