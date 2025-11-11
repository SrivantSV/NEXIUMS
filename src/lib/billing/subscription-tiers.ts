// Subscription Tiers Configuration
// Defines all subscription tiers and their features

import { SubscriptionTier } from '@/types/billing';

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out Nexus AI',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'usd',
    stripeMonthlyPriceId: undefined,
    stripeYearlyPriceId: undefined,
    features: [
      {
        id: 'messages',
        name: '100 messages per month',
        type: 'limit',
        value: 100,
        isHighlight: false,
      },
      {
        id: 'models',
        name: '5 basic AI models',
        description: 'Access to Gemini Flash, GPT-4o Mini, Claude Haiku',
        type: 'limit',
        value: 5,
        isHighlight: false,
      },
      {
        id: 'memory',
        name: '7-day conversation memory',
        type: 'limit',
        value: 7,
        isHighlight: false,
      },
      {
        id: 'artifacts',
        name: 'Basic artifacts',
        description: 'Create and edit basic code artifacts',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
      {
        id: 'storage',
        name: '1 GB storage',
        type: 'limit',
        value: 1,
        isHighlight: false,
      },
      {
        id: 'support',
        name: 'Community support',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
    ],
    limits: {
      messagesPerMonth: 100,
      modelsAccess: ['gemini-flash', 'gpt-4o-mini', 'claude-haiku'],
      mcpServers: 0,
      storageGb: 1,
      teamMembers: 1,
      projects: 3,
      apiRequests: 0,
      priority: 'low',
      supportLevel: 'community',
    },
    priority: 'low',
    supportLevel: 'community',
    isActive: true,
    isPublic: true,
    targetAudience: ['hobbyist', 'student', 'curious'],
    displayOrder: 1,
    metadata: {
      popular: false,
      recommended: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For individual power users',
    monthlyPrice: 20,
    yearlyPrice: 200,
    currency: 'usd',
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
    features: [
      {
        id: 'messages',
        name: 'Unlimited messages',
        type: 'boolean',
        value: true,
        isHighlight: true,
      },
      {
        id: 'models',
        name: 'All 25+ AI models',
        description: 'GPT-4, Claude 3.5, Gemini Pro, and more',
        type: 'boolean',
        value: true,
        isHighlight: true,
      },
      {
        id: 'smart-router',
        name: 'Smart routing enabled',
        description: 'Automatic best model selection',
        type: 'boolean',
        value: true,
        isHighlight: true,
      },
      {
        id: 'artifacts',
        name: 'Full artifacts system',
        description: 'Advanced code and content generation',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
      {
        id: 'mcp',
        name: '3 MCP servers',
        description: 'Connect custom tools and integrations',
        type: 'limit',
        value: 3,
        isHighlight: false,
      },
      {
        id: 'memory',
        name: 'Unlimited memory',
        description: 'Persistent conversation context',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
      {
        id: 'code-execution',
        name: 'Code execution',
        description: 'Run Python, JavaScript, and more',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
      {
        id: 'storage',
        name: '10 GB storage',
        type: 'limit',
        value: 10,
        isHighlight: false,
      },
      {
        id: 'api',
        name: '1,000 API requests/month',
        type: 'limit',
        value: 1000,
        isHighlight: false,
      },
      {
        id: 'support',
        name: 'Email support',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
    ],
    limits: {
      messagesPerMonth: null, // unlimited
      modelsAccess: null, // all models
      mcpServers: 3,
      storageGb: 10,
      teamMembers: 1,
      projects: null, // unlimited
      apiRequests: 1000,
      priority: 'normal',
      supportLevel: 'email',
    },
    priority: 'normal',
    supportLevel: 'email',
    isActive: true,
    isPublic: true,
    targetAudience: ['developer', 'professional', 'creator'],
    displayOrder: 2,
    metadata: {
      popular: true,
      recommended: true,
      savings: 'Save 17% with yearly',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For teams and organizations',
    monthlyPrice: 50,
    yearlyPrice: 500,
    currency: 'usd',
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID,
    features: [
      {
        id: 'everything-pro',
        name: 'Everything in Pro',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
      {
        id: 'team-workspaces',
        name: 'Team workspaces',
        description: 'Collaborate with unlimited team members',
        type: 'boolean',
        value: true,
        isHighlight: true,
      },
      {
        id: 'mcp-unlimited',
        name: 'Unlimited MCP servers',
        description: 'Connect any custom tools',
        type: 'boolean',
        value: true,
        isHighlight: true,
      },
      {
        id: 'admin-dashboard',
        name: 'Admin dashboard',
        description: 'Team management and analytics',
        type: 'boolean',
        value: true,
        isHighlight: true,
      },
      {
        id: 'usage-analytics',
        name: 'Usage analytics',
        description: 'Detailed team usage insights',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
      {
        id: 'sso',
        name: 'SSO & advanced security',
        description: 'Single sign-on and enterprise security',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
      {
        id: 'api-access',
        name: 'API access',
        description: '10,000 requests/month',
        type: 'limit',
        value: 10000,
        isHighlight: false,
      },
      {
        id: 'storage',
        name: '50 GB storage',
        type: 'limit',
        value: 50,
        isHighlight: false,
      },
      {
        id: 'priority-support',
        name: 'Priority support',
        description: 'Live chat support with fast response',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
      {
        id: 'custom-models',
        name: 'Custom model training',
        description: 'Train models on your data',
        type: 'boolean',
        value: true,
        isHighlight: false,
      },
    ],
    limits: {
      messagesPerMonth: null, // unlimited
      modelsAccess: null, // all models
      mcpServers: null, // unlimited
      storageGb: 50,
      teamMembers: null, // unlimited
      projects: null, // unlimited
      apiRequests: 10000,
      priority: 'high',
      supportLevel: 'chat',
    },
    priority: 'high',
    supportLevel: 'chat',
    isActive: true,
    isPublic: true,
    targetAudience: ['team', 'organization', 'enterprise'],
    displayOrder: 3,
    metadata: {
      popular: false,
      recommended: false,
      savings: 'Save 17% with yearly',
      enterprise: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Helper functions
export function getTierById(tierId: string): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find((tier) => tier.id === tierId);
}

export function getTierPrice(
  tierId: string,
  billingCycle: 'monthly' | 'yearly'
): number {
  const tier = getTierById(tierId);
  if (!tier) return 0;
  return billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
}

export function getYearlySavings(tierId: string): number {
  const tier = getTierById(tierId);
  if (!tier) return 0;
  const monthlyCost = tier.monthlyPrice * 12;
  const yearlyCost = tier.yearlyPrice;
  return monthlyCost - yearlyCost;
}

export function getYearlySavingsPercentage(tierId: string): number {
  const tier = getTierById(tierId);
  if (!tier || tier.monthlyPrice === 0) return 0;
  const monthlyCost = tier.monthlyPrice * 12;
  const yearlyCost = tier.yearlyPrice;
  return Math.round(((monthlyCost - yearlyCost) / monthlyCost) * 100);
}

export function canAccessFeature(
  tierId: string,
  featureId: string
): boolean {
  const tier = getTierById(tierId);
  if (!tier) return false;

  const feature = tier.features.find((f) => f.id === featureId);
  if (!feature) return false;

  if (feature.type === 'boolean') {
    return feature.value === true;
  }

  return true; // If feature exists, user can access it
}

export function getFeatureLimit(
  tierId: string,
  featureId: string
): number | null {
  const tier = getTierById(tierId);
  if (!tier) return null;

  const feature = tier.features.find((f) => f.id === featureId);
  if (!feature) return null;

  if (feature.type === 'limit' && typeof feature.value === 'number') {
    return feature.value;
  }

  return null; // unlimited
}

// Special discount pricing
export const SPECIAL_OFFERS = {
  PROPELIX2025: {
    code: 'PROPELIX2025',
    name: 'Propelix Student Discount',
    description: '80% off Pro tier for Propelix students',
    applicableTiers: ['pro'],
    discount: 0.8,
    finalPrice: {
      monthly: 4, // $20 * 0.2
      yearly: 40, // $200 * 0.2
    },
    validUntil: new Date('2025-12-31'),
    conditions: [
      'Valid for Propelix students only',
      'Requires @student.propelix.com email',
      'First-time customers only',
      'Valid for 6 months',
    ],
  },
  'SRIVANT-INTERNAL': {
    code: 'SRIVANT-INTERNAL',
    name: 'Srivant Company Discount',
    description: '70% off Team tier for Srivant employees',
    applicableTiers: ['team'],
    discount: 0.7,
    finalPrice: {
      monthly: 15, // $50 * 0.3
      yearly: 150, // $500 * 0.3
    },
    conditions: [
      'Valid for Srivant employees only',
      'Requires @surviant.ai or @srivant.com email',
      'Lifetime discount',
    ],
  },
  FOUNDER50: {
    code: 'FOUNDER50',
    name: 'Founder Early Access',
    description: '50% off any tier for early adopters',
    applicableTiers: ['pro', 'team'],
    discount: 0.5,
    validUntil: new Date('2025-06-30'),
    conditions: [
      'First 100 customers only',
      'Lifetime discount',
      'First-time customers only',
    ],
  },
};
