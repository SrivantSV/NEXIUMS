// Billing System Types
// Comprehensive type definitions for payment processing and subscription management

import { Database } from './database.types';

// Enums
export type BillingCycle = 'monthly' | 'yearly' | 'custom';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
export type DiscountType = 'percentage' | 'fixed' | 'trial';
export type UsageType = 'messages' | 'ai_requests' | 'file_uploads' | 'mcp_calls' | 'storage' | 'team_members' | 'projects' | 'api_requests';
export type SupportLevel = 'community' | 'email' | 'chat' | 'phone' | 'dedicated';
export type Priority = 'low' | 'normal' | 'high' | 'premium';

// Subscription Tier
export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  stripeMonthlyPriceId?: string;
  stripeYearlyPriceId?: string;
  features: TierFeature[];
  limits: TierLimits;
  priority: Priority;
  supportLevel: SupportLevel;
  isActive: boolean;
  isPublic: boolean;
  targetAudience: string[];
  displayOrder: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TierFeature {
  id: string;
  name: string;
  description?: string;
  type: 'boolean' | 'limit' | 'usage';
  value: any;
  isHighlight: boolean;
}

export interface TierLimits {
  messagesPerMonth: number | null; // null = unlimited
  modelsAccess: string[] | null; // null = all models
  mcpServers: number | null; // null = unlimited
  storageGb: number;
  teamMembers: number | null; // null = unlimited
  projects: number | null; // null = unlimited
  apiRequests: number | null; // null = unlimited
  priority: Priority;
  supportLevel: SupportLevel;
}

// Price Configuration
export interface PriceConfig {
  amount: number;
  currency: string;
  stripePrice: string;
  discountEligible: boolean;
  taxInclusive: boolean;
}

export interface TierPricing {
  monthly: PriceConfig;
  yearly: PriceConfig;
  custom?: CustomPricing;
}

export interface CustomPricing {
  minimumSeats: number;
  pricePerSeat: number;
  contactSales: boolean;
}

// Stripe Customer
export interface StripeCustomer {
  id: string;
  userId: string;
  stripeCustomerId: string;
  email: string;
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  taxExempt: boolean;
  taxIds: TaxId[];
  defaultPaymentMethod?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxId {
  type: string;
  value: string;
}

export interface CustomerData {
  email: string;
  name?: string;
  taxExempt?: boolean;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

// Subscription
export interface Subscription {
  id: string;
  userId: string;
  customerId: string;
  tierId: string;
  billingCycle: BillingCycle;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAt?: Date;
  canceledAt?: Date;
  endedAt?: Date;
  amount: number;
  currency: string;
  discountId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionParams {
  customerId: string;
  tierId: string;
  billingCycle: BillingCycle;
  discountCode?: string;
  trialDays?: number;
}

// Payment Method
export interface PaymentMethod {
  id: string;
  customerId: string;
  stripePaymentMethodId: string;
  type: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardFingerprint?: string;
  bankName?: string;
  bankLast4?: string;
  isDefault: boolean;
  isActive: boolean;
  billingEmail?: string;
  billingName?: string;
  billingAddress?: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice
export interface Invoice {
  id: string;
  subscriptionId?: string;
  customerId: string;
  stripeInvoiceId?: string;
  invoiceNumber?: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  invoiceDate: Date;
  dueDate?: Date;
  paidAt?: Date;
  invoicePdfUrl?: string;
  hostedInvoiceUrl?: string;
  paymentIntentId?: string;
  lineItems: InvoiceLineItem[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  currency: string;
  period?: {
    start: Date;
    end: Date;
  };
}

// Discount Code
export interface DiscountCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  stripeCouponId?: string;
  stripePromotionCodeId?: string;
  duration: 'once' | 'repeating' | 'forever';
  durationMonths?: number;
  minAmount?: number;
  applicableTiers?: string[];
  newCustomersOnly: boolean;
  emailDomains?: string[];
  maxRedemptions?: number;
  maxPerUser: number;
  currentRedemptions: number;
  isActive: boolean;
  validFrom: Date;
  validUntil?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDiscountData {
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  duration: 'once' | 'repeating' | 'forever';
  durationMonths?: number;
  conditions: DiscountCondition[];
  restrictions: DiscountRestriction[];
  maxRedemptions?: number;
  expiresAt?: Date;
}

export interface DiscountCondition {
  type: 'email_domain' | 'tier' | 'min_amount' | 'new_customer';
  value: string | number;
}

export interface DiscountRestriction {
  tiers?: string[];
  newCustomersOnly?: boolean;
  maxPerUser?: number;
  maxTotal?: number;
  emailDomains?: string[];
}

export interface DiscountValidation {
  valid: boolean;
  error?: string;
  discount?: DiscountCode;
  appliedValue?: number;
}

export interface DiscountUsage {
  id: string;
  discountId: string;
  userId: string;
  subscriptionId?: string;
  amountSaved: number;
  appliedAt: Date;
}

// Usage Tracking
export interface UsageRecord {
  id: string;
  userId: string;
  subscriptionId?: string;
  usageType: UsageType;
  quantity: number;
  stripeUsageRecordId?: string;
  resourceId?: string;
  metadata: Record<string, any>;
  recordedAt: Date;
}

export interface UsageAggregation {
  id: string;
  userId: string;
  year: number;
  month: number;
  messagesCount: number;
  aiRequestsCount: number;
  fileUploadsCount: number;
  mcpCallsCount: number;
  storageBytes: number;
  teamMembersCount: number;
  projectsCount: number;
  apiRequestsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageSnapshot {
  messages: number;
  ai_requests: number;
  file_uploads: number;
  mcp_calls: number;
  storage: number;
  team_members: number;
  projects: number;
  api_requests: number;
}

export interface UsageData {
  subscriptionItemId: string;
  quantity: number;
  timestamp: Date;
  type: UsageType;
  metadata?: Record<string, any>;
}

export interface UsageLimitCheck {
  withinLimits: boolean;
  violations?: UsageLimitViolation[];
}

export interface UsageLimitViolation {
  type: UsageType;
  usage: number;
  limit: number;
  severity: 'warning' | 'hard';
}

// Payment Transaction
export interface PaymentTransaction {
  id: string;
  customerId: string;
  invoiceId?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethodId?: string;
  errorCode?: string;
  errorMessage?: string;
  receiptUrl?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

// Webhook Event
export interface WebhookEvent {
  id: string;
  stripeEventId: string;
  eventType: string;
  payload: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  errorMessage?: string;
  receivedAt: Date;
}

export type WebhookHandler = (event: any) => Promise<void>;

// Enterprise Features
export interface EnterpriseFeatures {
  customPricing: boolean;
  dedicatedSupport: boolean;
  sla: SLAConfig;
  whiteLabel: boolean;
  sso: boolean;
  advancedSecurity: boolean;
  customIntegrations: boolean;
  onPremise: boolean;
  customModels: boolean;
  priorityRouting: boolean;
}

export interface SLAConfig {
  uptime: number; // percentage
  responseTime: number; // in minutes
  dedicatedManager: boolean;
}

// Billing Analytics
export interface BillingAnalytics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  lifetimeValue: number;
  customerAcquisitionCost: number;
}

// Compliance
export interface ComplianceSystem {
  pciCompliant: boolean;
  gdprCompliant: boolean;
  soc2Compliant: boolean;
  taxCalculation: boolean;
  invoiceGeneration: boolean;
  dataRetention: DataRetentionPolicy;
}

export interface DataRetentionPolicy {
  paymentData: number; // in days
  invoices: number; // in days
  usageRecords: number; // in days
}

// Complete Subscription System
export interface SubscriptionSystem {
  tiers: SubscriptionTier[];
  payments: PaymentSystem;
  discounts: DiscountSystem;
  usage: UsageTrackingSystem;
  enterprise: EnterpriseSystem;
  analytics: BillingAnalytics;
  compliance: ComplianceSystem;
}

export interface PaymentSystem {
  processor: 'stripe';
  publicKey: string;
  webhookSecret: string;
  supportedMethods: string[];
  currencies: string[];
}

export interface DiscountSystem {
  codes: DiscountCode[];
  automaticDiscounts: boolean;
  bulkDiscounts: boolean;
}

export interface UsageTrackingSystem {
  realTime: boolean;
  alertThresholds: number[];
  reportingFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface EnterpriseSystem {
  features: EnterpriseFeatures;
  customContracts: boolean;
  dedicatedInfrastructure: boolean;
}

// Billing Error
export class BillingError extends Error {
  constructor(message: string, public code?: string, public statusCode?: number) {
    super(message);
    this.name = 'BillingError';
  }
}

// Helper Types for API Responses
export interface BillingAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}
