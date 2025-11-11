/**
 * Feature Gates System
 * Controls access to features based on subscription tier
 */

import type { SubscriptionTier } from '@/types/billing';

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: SubscriptionTier;
  upgradeUrl?: string;
}

export interface FeatureLimits {
  // AI Model Access
  models: {
    total: number | 'unlimited';
    allowed: string[];
    smartRouter: boolean;
  };

  // API Usage
  api: {
    requestsPerMonth: number | 'unlimited';
    requestsPerMinute: number;
  };

  // Content Features
  artifacts: {
    total: number | 'unlimited';
    execution: boolean;
    sharing: boolean;
  };

  // File Handling
  files: {
    storageGB: number;
    uploadsPerMonth: number | 'unlimited';
    maxFileSize: number; // in MB
  };

  // MCP Integration
  mcp: {
    maxServers: number | 'unlimited';
    workflows: boolean;
  };

  // Projects & Memory
  projects: {
    max: number | 'unlimited';
    memory: boolean;
    crossModelContext: boolean;
  };

  // Team Features
  team: {
    enabled: boolean;
    maxMembers: number | 'unlimited';
    workspaces: boolean;
    sharedConversations: boolean;
  };

  // Analytics
  analytics: {
    basic: boolean;
    advanced: boolean;
    export: boolean;
    customReports: boolean;
  };

  // Support
  support: {
    level: 'community' | 'email' | 'chat' | 'phone' | 'dedicated';
    priority: 'low' | 'normal' | 'high' | 'premium';
  };
}

// Define limits for each tier
export const TIER_LIMITS: Record<SubscriptionTier, FeatureLimits> = {
  free: {
    models: {
      total: 5,
      allowed: ['gemini-flash', 'gpt-4o-mini', 'claude-haiku', 'llama-3.1-8b', 'qwen-7b'],
      smartRouter: false,
    },
    api: {
      requestsPerMonth: 100,
      requestsPerMinute: 20,
    },
    artifacts: {
      total: 10,
      execution: false,
      sharing: false,
    },
    files: {
      storageGB: 1,
      uploadsPerMonth: 10,
      maxFileSize: 5,
    },
    mcp: {
      maxServers: 0,
      workflows: false,
    },
    projects: {
      max: 3,
      memory: false,
      crossModelContext: false,
    },
    team: {
      enabled: false,
      maxMembers: 1,
      workspaces: false,
      sharedConversations: false,
    },
    analytics: {
      basic: true,
      advanced: false,
      export: false,
      customReports: false,
    },
    support: {
      level: 'community',
      priority: 'low',
    },
  },

  pro: {
    models: {
      total: 'unlimited',
      allowed: [], // Empty array means all models
      smartRouter: true,
    },
    api: {
      requestsPerMonth: 'unlimited',
      requestsPerMinute: 100,
    },
    artifacts: {
      total: 'unlimited',
      execution: true,
      sharing: true,
    },
    files: {
      storageGB: 100,
      uploadsPerMonth: 'unlimited',
      maxFileSize: 100,
    },
    mcp: {
      maxServers: 3,
      workflows: true,
    },
    projects: {
      max: 'unlimited',
      memory: true,
      crossModelContext: true,
    },
    team: {
      enabled: false,
      maxMembers: 1,
      workspaces: false,
      sharedConversations: false,
    },
    analytics: {
      basic: true,
      advanced: true,
      export: true,
      customReports: false,
    },
    support: {
      level: 'email',
      priority: 'normal',
    },
  },

  team: {
    models: {
      total: 'unlimited',
      allowed: [],
      smartRouter: true,
    },
    api: {
      requestsPerMonth: 'unlimited',
      requestsPerMinute: 500,
    },
    artifacts: {
      total: 'unlimited',
      execution: true,
      sharing: true,
    },
    files: {
      storageGB: 1000,
      uploadsPerMonth: 'unlimited',
      maxFileSize: 500,
    },
    mcp: {
      maxServers: 'unlimited',
      workflows: true,
    },
    projects: {
      max: 'unlimited',
      memory: true,
      crossModelContext: true,
    },
    team: {
      enabled: true,
      maxMembers: 'unlimited',
      workspaces: true,
      sharedConversations: true,
    },
    analytics: {
      basic: true,
      advanced: true,
      export: true,
      customReports: true,
    },
    support: {
      level: 'chat',
      priority: 'high',
    },
  },

  enterprise: {
    models: {
      total: 'unlimited',
      allowed: [],
      smartRouter: true,
    },
    api: {
      requestsPerMonth: 'unlimited',
      requestsPerMinute: 10000,
    },
    artifacts: {
      total: 'unlimited',
      execution: true,
      sharing: true,
    },
    files: {
      storageGB: 10000,
      uploadsPerMonth: 'unlimited',
      maxFileSize: 5000,
    },
    mcp: {
      maxServers: 'unlimited',
      workflows: true,
    },
    projects: {
      max: 'unlimited',
      memory: true,
      crossModelContext: true,
    },
    team: {
      enabled: true,
      maxMembers: 'unlimited',
      workspaces: true,
      sharedConversations: true,
    },
    analytics: {
      basic: true,
      advanced: true,
      export: true,
      customReports: true,
    },
    support: {
      level: 'dedicated',
      priority: 'premium',
    },
  },
};

/**
 * Get feature limits for a tier
 */
export function getTierLimits(tier: SubscriptionTier): FeatureLimits {
  return TIER_LIMITS[tier];
}

/**
 * Check if a feature is allowed for a tier
 */
export function checkFeatureAccess(
  tier: SubscriptionTier,
  feature: string
): FeatureGateResult {
  const limits = getTierLimits(tier);

  // Check specific features
  switch (feature) {
    case 'smart-router':
      if (!limits.models.smartRouter) {
        return {
          allowed: false,
          reason: 'Smart routing is only available in Pro tier and above',
          upgradeRequired: 'pro',
          upgradeUrl: '/pricing',
        };
      }
      break;

    case 'code-execution':
      if (!limits.artifacts.execution) {
        return {
          allowed: false,
          reason: 'Code execution is only available in Pro tier and above',
          upgradeRequired: 'pro',
          upgradeUrl: '/pricing',
        };
      }
      break;

    case 'mcp-integration':
      if (limits.mcp.maxServers === 0) {
        return {
          allowed: false,
          reason: 'MCP integrations are only available in Pro tier and above',
          upgradeRequired: 'pro',
          upgradeUrl: '/pricing',
        };
      }
      break;

    case 'team-workspaces':
      if (!limits.team.enabled) {
        return {
          allowed: false,
          reason: 'Team workspaces are only available in Team tier and above',
          upgradeRequired: 'team',
          upgradeUrl: '/pricing',
        };
      }
      break;

    case 'advanced-analytics':
      if (!limits.analytics.advanced) {
        return {
          allowed: false,
          reason: 'Advanced analytics are only available in Pro tier and above',
          upgradeRequired: 'pro',
          upgradeUrl: '/pricing',
        };
      }
      break;

    case 'custom-reports':
      if (!limits.analytics.customReports) {
        return {
          allowed: false,
          reason: 'Custom reports are only available in Team tier and above',
          upgradeRequired: 'team',
          upgradeUrl: '/pricing',
        };
      }
      break;
  }

  return { allowed: true };
}

/**
 * Check if a model is accessible
 */
export function checkModelAccess(
  tier: SubscriptionTier,
  modelId: string
): FeatureGateResult {
  const limits = getTierLimits(tier);

  // If allowed list is empty, all models are allowed
  if (limits.models.allowed.length === 0) {
    return { allowed: true };
  }

  // Check if model is in allowed list
  if (!limits.models.allowed.includes(modelId)) {
    return {
      allowed: false,
      reason: `Model ${modelId} is only available in Pro tier and above`,
      upgradeRequired: 'pro',
      upgradeUrl: '/pricing',
    };
  }

  return { allowed: true };
}

/**
 * Check if user can make more requests this month
 */
export function checkQuotaLimit(
  tier: SubscriptionTier,
  currentUsage: number
): FeatureGateResult {
  const limits = getTierLimits(tier);

  if (limits.api.requestsPerMonth === 'unlimited') {
    return { allowed: true };
  }

  if (currentUsage >= limits.api.requestsPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${limits.api.requestsPerMonth} requests`,
      upgradeRequired: tier === 'free' ? 'pro' : undefined,
      upgradeUrl: '/pricing',
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create more artifacts
 */
export function checkArtifactLimit(
  tier: SubscriptionTier,
  currentCount: number
): FeatureGateResult {
  const limits = getTierLimits(tier);

  if (limits.artifacts.total === 'unlimited') {
    return { allowed: true };
  }

  if (currentCount >= limits.artifacts.total) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limits.artifacts.total} artifacts`,
      upgradeRequired: 'pro',
      upgradeUrl: '/pricing',
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create more MCP connections
 */
export function checkMCPServerLimit(
  tier: SubscriptionTier,
  currentCount: number
): FeatureGateResult {
  const limits = getTierLimits(tier);

  if (limits.mcp.maxServers === 'unlimited') {
    return { allowed: true };
  }

  if (currentCount >= limits.mcp.maxServers) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limits.mcp.maxServers} MCP servers`,
      upgradeRequired: tier === 'free' ? 'pro' : 'team',
      upgradeUrl: '/pricing',
    };
  }

  return { allowed: true };
}

/**
 * Check if user has storage capacity
 */
export function checkStorageLimit(
  tier: SubscriptionTier,
  currentUsageGB: number
): FeatureGateResult {
  const limits = getTierLimits(tier);

  if (currentUsageGB >= limits.files.storageGB) {
    return {
      allowed: false,
      reason: `You've reached your storage limit of ${limits.files.storageGB}GB`,
      upgradeRequired: tier === 'free' ? 'pro' : tier === 'pro' ? 'team' : undefined,
      upgradeUrl: '/pricing',
    };
  }

  return { allowed: true };
}

/**
 * Check if file size is within limit
 */
export function checkFileSizeLimit(
  tier: SubscriptionTier,
  fileSizeMB: number
): FeatureGateResult {
  const limits = getTierLimits(tier);

  if (fileSizeMB > limits.files.maxFileSize) {
    return {
      allowed: false,
      reason: `File size exceeds your limit of ${limits.files.maxFileSize}MB`,
      upgradeRequired: tier === 'free' ? 'pro' : tier === 'pro' ? 'team' : undefined,
      upgradeUrl: '/pricing',
    };
  }

  return { allowed: true };
}

/**
 * Check if user can create more projects
 */
export function checkProjectLimit(
  tier: SubscriptionTier,
  currentCount: number
): FeatureGateResult {
  const limits = getTierLimits(tier);

  if (limits.projects.max === 'unlimited') {
    return { allowed: true };
  }

  if (currentCount >= limits.projects.max) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limits.projects.max} projects`,
      upgradeRequired: 'pro',
      upgradeUrl: '/pricing',
    };
  }

  return { allowed: true };
}

/**
 * Get all available models for a tier
 */
export function getAvailableModels(tier: SubscriptionTier): string[] | 'all' {
  const limits = getTierLimits(tier);
  return limits.models.allowed.length === 0 ? 'all' : limits.models.allowed;
}

/**
 * Get upgrade suggestion for a feature
 */
export function getUpgradeSuggestion(
  currentTier: SubscriptionTier,
  feature: string
): {
  requiredTier: SubscriptionTier;
  benefits: string[];
  cta: string;
} | null {
  // Determine required tier
  let requiredTier: SubscriptionTier;
  const benefits: string[] = [];

  if (currentTier === 'free') {
    requiredTier = 'pro';
    benefits.push('Unlimited messages');
    benefits.push('Access to all 27+ AI models');
    benefits.push('Smart routing enabled');
    benefits.push('Code execution');
    benefits.push('Up to 3 MCP servers');
    benefits.push('100GB storage');
  } else if (currentTier === 'pro') {
    requiredTier = 'team';
    benefits.push('Team workspaces');
    benefits.push('Unlimited MCP servers');
    benefits.push('Admin dashboard');
    benefits.push('Usage analytics');
    benefits.push('SSO & advanced security');
    benefits.push('Custom reports');
  } else {
    return null; // Already at highest tier
  }

  return {
    requiredTier,
    benefits,
    cta: `Upgrade to ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} to unlock ${feature}`,
  };
}
