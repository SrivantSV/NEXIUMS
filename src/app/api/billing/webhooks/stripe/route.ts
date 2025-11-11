// API Route: /api/billing/webhooks/stripe
// Handles Stripe webhook events

import { NextRequest, NextResponse } from 'next/server';
import { paymentProcessor } from '@/lib/billing/payment-processor';

// Disable body parsing for webhook signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Process webhook
    await paymentProcessor.handleWebhook(body, signature);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }
}
