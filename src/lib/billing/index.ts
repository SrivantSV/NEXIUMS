// Billing System - Main Export Module
// Centralized exports for easy importing

// Core Modules
export { PaymentProcessor, paymentProcessor } from './payment-processor';
export { DiscountManager, discountManager } from './discount-manager';
export { UsageTracker, usageTracker } from './usage-tracker';
export { FeatureGate, featureGate, requireFeature, useFeatureGate } from './feature-gate';

// Configuration
export {
  SUBSCRIPTION_TIERS,
  SPECIAL_OFFERS,
  getTierById,
  getTierPrice,
  getYearlySavings,
  getYearlySavingsPercentage,
  canAccessFeature,
  getFeatureLimit,
} from './subscription-tiers';

// Re-export types
export type {
  SubscriptionTier,
  BillingCycle,
  SubscriptionStatus,
  DiscountCode,
  CreateDiscountData,
  DiscountValidation,
  UsageType,
  UsageSnapshot,
  UsageLimitCheck,
  UsageLimitViolation,
  PaymentResult,
  Subscription,
  StripeCustomer,
  CustomerData,
  Invoice,
  PaymentMethod,
  BillingError,
} from '@/types/billing';

export type { FeatureGateResult } from './feature-gate';
