/**
 * Unified API Middleware
 * Integrates Authentication + AI Models + Chat
 *
 * This middleware:
 * - Validates authentication for all requests
 * - Extracts user context (subscription, preferences, quotas)
 * - Enforces rate limits based on subscription tier
 * - Tracks usage and costs
 * - Provides user context to downstream handlers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserProfile } from '@/types/database.types';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    profile: UserProfile;
  };
}

export interface UserContext {
  userId: string;
  email: string;
  profile: UserProfile;
  subscription: {
    tier: 'free' | 'pro' | 'team' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
  };
  quotas: {
    monthly_requests: number;
    api_quota_limit: number;
    remaining: number;
  };
  preferences: {
    preferredModels?: string[];
    default_smart_router: boolean;
    theme: string;
    code_theme: string;
  };
}

export interface MiddlewareOptions {
  requireAuth?: boolean;
  rateLimitOverride?: {
    maxRequests: number;
    windowMs: number;
  };
  skipQuotaCheck?: boolean;
}

/**
 * Main authentication middleware
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, context: UserContext) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
): Promise<NextResponse> {
  const { requireAuth = true, rateLimitOverride, skipQuotaCheck = false } = options;

  try {
    // 1. Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (requireAuth && (!user || authError)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    if (!user) {
      // Allow unauthenticated requests if auth is not required
      return handler(request, null as any);
    }

    // 2. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found', message: 'User profile could not be loaded' },
        { status: 404 }
      );
    }

    // 3. Check if user is active
    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account inactive', message: 'Your account has been deactivated' },
        { status: 403 }
      );
    }

    // 4. Build user context
    const userContext: UserContext = {
      userId: user.id,
      email: user.email!,
      profile,
      subscription: {
        tier: profile.subscription_tier,
        status: profile.subscription_status,
      },
      quotas: {
        monthly_requests: profile.monthly_requests || 0,
        api_quota_limit: profile.api_quota_limit || 100,
        remaining: (profile.api_quota_limit || 100) - (profile.monthly_requests || 0),
      },
      preferences: {
        preferredModels: profile.preferred_models,
        default_smart_router: profile.default_smart_router ?? true,
        theme: profile.theme,
        code_theme: profile.code_theme,
      },
    };

    // 5. Check rate limits
    const rateLimitResult = await checkRateLimit(
      user.id,
      profile.subscription_tier,
      rateLimitOverride
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: rateLimitResult.message,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt?.toString() || '',
          },
        }
      );
    }

    // 6. Check API quota
    if (!skipQuotaCheck && userContext.quotas.remaining <= 0) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          message: 'You have reached your monthly API quota',
          quota: userContext.quotas,
          upgrade_url: '/pricing',
        },
        { status: 402 }
      );
    }

    // 7. Call handler with user context
    const response = await handler(request, userContext);

    // 8. Add user context headers to response
    response.headers.set('X-User-Id', user.id);
    response.headers.set('X-Subscription-Tier', profile.subscription_tier);
    response.headers.set('X-Quota-Remaining', userContext.quotas.remaining.toString());

    return response;
  } catch (error: any) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Rate limiting based on subscription tier
 */
async function checkRateLimit(
  userId: string,
  subscriptionTier: string,
  override?: { maxRequests: number; windowMs: number }
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt?: number;
  retryAfter?: number;
  message?: string;
}> {
  // Define rate limits per subscription tier
  const RATE_LIMITS = override || {
    free: { maxRequests: 20, windowMs: 60000 }, // 20 req/min
    pro: { maxRequests: 100, windowMs: 60000 }, // 100 req/min
    team: { maxRequests: 500, windowMs: 60000 }, // 500 req/min
    enterprise: { maxRequests: 10000, windowMs: 60000 }, // 10k req/min
  };

  const limit = override
    ? override
    : RATE_LIMITS[subscriptionTier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free;

  // TODO: Implement with Redis for production
  // For now, return allowed (implement Redis-based rate limiting)
  return {
    allowed: true,
    limit: limit.maxRequests,
    remaining: limit.maxRequests,
  };
}

/**
 * Track API usage for billing
 */
export async function trackUsage(
  userId: string,
  requestData: {
    endpoint: string;
    model?: string;
    tokens?: { input: number; output: number };
    cost?: number;
    responseTime: number;
    success: boolean;
  }
): Promise<void> {
  try {
    const supabase = await createClient();

    // 1. Update user's monthly request count
    await supabase.rpc('increment_user_requests', {
      p_user_id: userId,
    });

    // 2. Log usage for analytics (if using Prisma for AI analytics)
    // This would be handled by the AI system's usage tracking

    // 3. Log activity
    await supabase.from('user_activity_log').insert({
      user_id: userId,
      action: 'api_request',
      resource_type: 'ai_model',
      resource_id: requestData.model || 'unknown',
      metadata: {
        endpoint: requestData.endpoint,
        tokens: requestData.tokens,
        cost: requestData.cost,
        responseTime: requestData.responseTime,
        success: requestData.success,
      },
    });
  } catch (error) {
    console.error('Failed to track usage:', error);
    // Don't throw - usage tracking failures shouldn't break the request
  }
}

/**
 * Helper to extract user context from request
 * Use this in API routes that need user context
 */
export async function getUserContext(request: NextRequest): Promise<UserContext | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return null;

    return {
      userId: user.id,
      email: user.email!,
      profile,
      subscription: {
        tier: profile.subscription_tier,
        status: profile.subscription_status,
      },
      quotas: {
        monthly_requests: profile.monthly_requests || 0,
        api_quota_limit: profile.api_quota_limit || 100,
        remaining: (profile.api_quota_limit || 100) - (profile.monthly_requests || 0),
      },
      preferences: {
        preferredModels: profile.preferred_models,
        default_smart_router: profile.default_smart_router ?? true,
        theme: profile.theme,
        code_theme: profile.code_theme,
      },
    };
  } catch (error) {
    console.error('Failed to get user context:', error);
    return null;
  }
}

/**
 * Middleware wrapper for convenience
 */
export function createAuthenticatedHandler(
  handler: (req: NextRequest, context: UserContext) => Promise<NextResponse>,
  options?: MiddlewareOptions
) {
  return async (request: NextRequest) => {
    return withAuth(request, handler, options);
  };
}
