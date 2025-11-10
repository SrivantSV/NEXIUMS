// API Route: /api/billing/subscriptions
// Handles subscription creation, updates, and cancellation

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { paymentProcessor } from '@/lib/billing/payment-processor';
import { discountManager } from '@/lib/billing/discount-manager';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        subscription_tiers (*),
        stripe_customers (*)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: subscriptions });
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
    const { tierId, billingCycle, discountCode, paymentMethodId } = body;

    // Validate required fields
    if (!tierId || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create customer
    const { data: authUser } = await supabase.auth.getUser();
    const email = authUser.user?.email || '';
    const name = authUser.user?.user_metadata?.display_name || '';

    const customer = await paymentProcessor.getOrCreateCustomer(user.id, {
      email,
      name,
    });

    // Validate discount code if provided
    if (discountCode) {
      const validation = await discountManager.validateDiscountCode(
        discountCode,
        user.id,
        tierId
      );

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    // Create subscription
    const subscription = await paymentProcessor.createSubscription({
      customerId: customer.id,
      tierId,
      billingCycle,
      discountCode,
    });

    return NextResponse.json({ success: true, data: subscription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, action, newTierId } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify subscription belongs to user
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case 'upgrade':
        if (!newTierId) {
          return NextResponse.json(
            { error: 'newTierId is required for upgrade' },
            { status: 400 }
          );
        }
        result = await paymentProcessor.upgradeSubscription(
          subscriptionId,
          newTierId
        );
        break;

      case 'cancel':
        result = await paymentProcessor.cancelSubscription(subscriptionId, false);
        break;

      case 'cancel_immediately':
        result = await paymentProcessor.cancelSubscription(subscriptionId, true);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
