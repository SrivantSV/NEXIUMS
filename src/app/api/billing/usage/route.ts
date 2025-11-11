// API Route: /api/billing/usage
// Tracks and retrieves usage data

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usageTracker } from '@/lib/billing/usage-tracker';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current usage
    const usage = await usageTracker.getCurrentUsage(user.id);

    // Get subscription limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        subscription_tiers (*)
      `
      )
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Check usage limits
    const limitCheck = await usageTracker.checkUsageLimits(user.id);

    return NextResponse.json({
      success: true,
      data: {
        usage,
        limits: subscription?.subscription_tiers?.limits || {},
        withinLimits: limitCheck.withinLimits,
        violations: limitCheck.violations || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { usageType, quantity = 1, metadata = {} } = body;

    if (!usageType) {
      return NextResponse.json(
        { error: 'usageType is required' },
        { status: 400 }
      );
    }

    // Check if user can use this feature
    const canUse = await usageTracker.canUseFeature(user.id, usageType);

    if (!canUse) {
      return NextResponse.json(
        {
          error: `You have reached your ${usageType} limit. Please upgrade your plan.`,
          limitReached: true,
        },
        { status: 403 }
      );
    }

    // Track usage
    await usageTracker.trackUsage(user.id, usageType, quantity, metadata);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
