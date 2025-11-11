// Payment Processor - Stripe Integration
// Handles all payment processing, subscriptions, and billing operations

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/client';
import {
  StripeCustomer,
  CustomerData,
  Subscription,
  CreateSubscriptionParams,
  PaymentResult,
  UsageData,
  WebhookHandler,
  BillingError,
  SubscriptionTier,
  Invoice,
} from '@/types/billing';

export class PaymentProcessor {
  private stripe: Stripe;
  private webhookHandlers: Map<string, WebhookHandler> = new Map();
  private supabase = createClient();

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });

    this.setupWebhookHandlers();
  }

  // ===== Customer Management =====

  async createCustomer(
    userId: string,
    customerData: CustomerData
  ): Promise<StripeCustomer> {
    try {
      // Create customer in Stripe
      const stripeCustomer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: {
          userId,
          source: 'nexus-ai',
        },
        tax_exempt: customerData.taxExempt ? 'exempt' : 'none',
        address: customerData.address,
      });

      // Store customer in database
      const { data: customer, error } = await this.supabase
        .from('stripe_customers')
        .insert({
          user_id: userId,
          stripe_customer_id: stripeCustomer.id,
          email: customerData.email,
          name: customerData.name,
          address_line1: customerData.address?.line1,
          address_line2: customerData.address?.line2,
          address_city: customerData.address?.city,
          address_state: customerData.address?.state,
          address_postal_code: customerData.address?.postal_code,
          address_country: customerData.address?.country,
          tax_exempt: customerData.taxExempt || false,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: customer.id,
        userId: customer.user_id,
        stripeCustomerId: customer.stripe_customer_id,
        email: customer.email,
        name: customer.name,
        addressLine1: customer.address_line1,
        addressLine2: customer.address_line2,
        addressCity: customer.address_city,
        addressState: customer.address_state,
        addressPostalCode: customer.address_postal_code,
        addressCountry: customer.address_country,
        taxExempt: customer.tax_exempt,
        taxIds: customer.tax_ids || [],
        defaultPaymentMethod: customer.default_payment_method,
        metadata: customer.metadata || {},
        createdAt: new Date(customer.created_at),
        updatedAt: new Date(customer.updated_at),
      };
    } catch (error: any) {
      throw new BillingError(
        `Failed to create customer: ${error.message}`,
        'CUSTOMER_CREATE_ERROR',
        500
      );
    }
  }

  async getCustomer(userId: string): Promise<StripeCustomer | null> {
    const { data, error } = await this.supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      stripeCustomerId: data.stripe_customer_id,
      email: data.email,
      name: data.name,
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      addressCity: data.address_city,
      addressState: data.address_state,
      addressPostalCode: data.address_postal_code,
      addressCountry: data.address_country,
      taxExempt: data.tax_exempt,
      taxIds: data.tax_ids || [],
      defaultPaymentMethod: data.default_payment_method,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async getOrCreateCustomer(
    userId: string,
    customerData: CustomerData
  ): Promise<StripeCustomer> {
    const existing = await this.getCustomer(userId);
    if (existing) return existing;
    return this.createCustomer(userId, customerData);
  }

  // ===== Subscription Management =====

  async createSubscription(
    params: CreateSubscriptionParams
  ): Promise<Subscription> {
    try {
      const { customerId, tierId, billingCycle, discountCode, trialDays } = params;

      // Get customer from database
      const { data: customerData } = await this.supabase
        .from('stripe_customers')
        .select('stripe_customer_id, user_id')
        .eq('id', customerId)
        .single();

      if (!customerData) {
        throw new BillingError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
      }

      // Get subscription tier
      const tier = await this.getSubscriptionTier(tierId);
      if (!tier) {
        throw new BillingError('Subscription tier not found', 'TIER_NOT_FOUND', 404);
      }

      // Get price ID based on billing cycle
      const priceId =
        billingCycle === 'monthly'
          ? tier.stripeMonthlyPriceId
          : tier.stripeYearlyPriceId;

      if (!priceId) {
        throw new BillingError(
          'Price ID not configured for this tier',
          'PRICE_NOT_CONFIGURED',
          400
        );
      }

      // Validate and apply discount code
      let couponId: string | undefined;
      if (discountCode) {
        const discount = await this.validateDiscountCode(
          discountCode,
          customerData.user_id,
          tierId
        );
        if (discount.valid && discount.discount) {
          couponId = discount.discount.stripeCouponId;
        }
      }

      // Calculate amount
      const amount =
        billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;

      // Create subscription in Stripe
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerData.stripe_customer_id,
        items: [{ price: priceId }],
        metadata: {
          tierId,
          userId: customerData.user_id,
          source: 'nexus-ai',
        },
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      };

      // Add discount if applicable
      if (couponId) {
        subscriptionParams.discounts = [{ coupon: couponId }];
      }

      // Add trial if specified
      if (trialDays && trialDays > 0) {
        subscriptionParams.trial_period_days = trialDays;
      }

      const stripeSubscription = await this.stripe.subscriptions.create(
        subscriptionParams
      );

      // Store subscription in database
      const { data: subscription, error } = await this.supabase
        .from('subscriptions')
        .insert({
          user_id: customerData.user_id,
          customer_id: customerId,
          tier_id: tierId,
          billing_cycle: billingCycle,
          stripe_subscription_id: stripeSubscription.id,
          stripe_price_id: priceId,
          status: stripeSubscription.status as any,
          current_period_start: new Date(
            stripeSubscription.current_period_start * 1000
          ),
          current_period_end: new Date(
            stripeSubscription.current_period_end * 1000
          ),
          trial_start: stripeSubscription.trial_start
            ? new Date(stripeSubscription.trial_start * 1000)
            : null,
          trial_end: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000)
            : null,
          amount,
          currency: tier.currency,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user profile with subscription info
      await this.supabase
        .from('user_profiles')
        .update({
          subscription_tier: tierId,
          subscription_status: stripeSubscription.status,
          subscription_id: stripeSubscription.id,
          subscription_start_date: new Date(
            stripeSubscription.current_period_start * 1000
          ),
          subscription_end_date: new Date(
            stripeSubscription.current_period_end * 1000
          ),
        })
        .eq('id', customerData.user_id);

      return this.mapSubscription(subscription);
    } catch (error: any) {
      throw new BillingError(
        `Failed to create subscription: ${error.message}`,
        'SUBSCRIPTION_CREATE_ERROR',
        500
      );
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    immediate: boolean = false
  ): Promise<Subscription> {
    try {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('stripe_subscription_id, user_id')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        throw new BillingError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND', 404);
      }

      // Cancel in Stripe
      const canceled = await this.stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: !immediate,
        }
      );

      if (immediate) {
        await this.stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      }

      // Update database
      const { data: updated } = await this.supabase
        .from('subscriptions')
        .update({
          status: immediate ? 'canceled' : 'active',
          cancel_at: immediate ? new Date() : new Date(canceled.current_period_end * 1000),
          canceled_at: new Date(),
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      return this.mapSubscription(updated);
    } catch (error: any) {
      throw new BillingError(
        `Failed to cancel subscription: ${error.message}`,
        'SUBSCRIPTION_CANCEL_ERROR',
        500
      );
    }
  }

  async upgradeSubscription(
    subscriptionId: string,
    newTierId: string
  ): Promise<Subscription> {
    try {
      // Get current subscription
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*, subscriptions!inner(billing_cycle)')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        throw new BillingError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND', 404);
      }

      // Get new tier
      const newTier = await this.getSubscriptionTier(newTierId);
      if (!newTier) {
        throw new BillingError('New tier not found', 'TIER_NOT_FOUND', 404);
      }

      const billingCycle = subscription.billing_cycle;
      const newPriceId =
        billingCycle === 'monthly'
          ? newTier.stripeMonthlyPriceId
          : newTier.stripeYearlyPriceId;

      // Update subscription in Stripe
      const updated = await this.stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          items: [
            {
              id: subscription.stripe_price_id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'create_prorations',
        }
      );

      // Update database
      const { data: updatedSub } = await this.supabase
        .from('subscriptions')
        .update({
          tier_id: newTierId,
          stripe_price_id: newPriceId,
          amount: billingCycle === 'monthly' ? newTier.monthlyPrice : newTier.yearlyPrice,
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      return this.mapSubscription(updatedSub);
    } catch (error: any) {
      throw new BillingError(
        `Failed to upgrade subscription: ${error.message}`,
        'SUBSCRIPTION_UPGRADE_ERROR',
        500
      );
    }
  }

  // ===== Payment Processing =====

  async processPayment(
    customerId: string,
    amount: number,
    currency: string = 'usd',
    metadata: any = {}
  ): Promise<PaymentResult> {
    try {
      const { data: customer } = await this.supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('id', customerId)
        .single();

      if (!customer) {
        return {
          success: false,
          error: 'Customer not found',
        };
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        customer: customer.stripe_customer_id,
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: { enabled: true },
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        amount,
        currency,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ===== Usage-Based Billing =====

  async handleUsageBasedBilling(
    subscriptionId: string,
    usageData: UsageData[]
  ): Promise<void> {
    try {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('stripe_subscription_id, user_id')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        throw new BillingError('Subscription not found', 'SUBSCRIPTION_NOT_FOUND', 404);
      }

      for (const usage of usageData) {
        // Create usage record in Stripe
        await this.stripe.subscriptionItems.createUsageRecord(
          usage.subscriptionItemId,
          {
            quantity: usage.quantity,
            timestamp: Math.floor(usage.timestamp.getTime() / 1000),
            action: 'set',
          }
        );

        // Store usage record locally
        await this.supabase.from('usage_records').insert({
          user_id: subscription.user_id,
          subscription_id: subscriptionId,
          usage_type: usage.type,
          quantity: usage.quantity,
          recorded_at: usage.timestamp,
          metadata: usage.metadata || {},
        });
      }
    } catch (error: any) {
      throw new BillingError(
        `Failed to record usage: ${error.message}`,
        'USAGE_RECORD_ERROR',
        500
      );
    }
  }

  // ===== Webhook Handling =====

  private setupWebhookHandlers(): void {
    this.webhookHandlers.set('invoice.payment_succeeded', async (event) => {
      await this.handlePaymentSucceeded(event);
    });

    this.webhookHandlers.set('invoice.payment_failed', async (event) => {
      await this.handlePaymentFailed(event);
    });

    this.webhookHandlers.set('customer.subscription.updated', async (event) => {
      await this.handleSubscriptionUpdated(event);
    });

    this.webhookHandlers.set('customer.subscription.deleted', async (event) => {
      await this.handleSubscriptionCancelled(event);
    });

    this.webhookHandlers.set('customer.subscription.trial_will_end', async (event) => {
      await this.handleTrialWillEnd(event);
    });
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      // Log webhook event
      await this.logWebhookEvent(event);

      // Handle event
      const handler = this.webhookHandlers.get(event.type);
      if (handler) {
        await handler(event);
      }
    } catch (error: any) {
      throw new BillingError(
        `Webhook processing failed: ${error.message}`,
        'WEBHOOK_ERROR',
        400
      );
    }
  }

  private async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;

    // Update subscription status
    if (invoice.subscription) {
      await this.supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('stripe_subscription_id', invoice.subscription);
    }

    // Store invoice
    await this.storeInvoice(invoice);

    // Send notification to user
    // TODO: Integrate with notification system
  }

  private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;

    // Update subscription status
    if (invoice.subscription) {
      await this.supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', invoice.subscription);
    }

    // Send notification to user
    // TODO: Integrate with notification system
  }

  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;

    await this.supabase
      .from('subscriptions')
      .update({
        status: subscription.status as any,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  private async handleSubscriptionCancelled(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;

    await this.supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        ended_at: new Date(),
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  private async handleTrialWillEnd(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;

    // Send notification to user about trial ending
    // TODO: Integrate with notification system
  }

  private async logWebhookEvent(event: Stripe.Event): Promise<void> {
    await this.supabase.from('webhook_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as any,
      processed: false,
    });
  }

  private async storeInvoice(invoice: Stripe.Invoice): Promise<void> {
    // Store invoice in database
    await this.supabase.from('invoices').insert({
      stripe_invoice_id: invoice.id,
      invoice_number: invoice.number,
      status: invoice.status as any,
      subtotal: invoice.subtotal / 100,
      tax: (invoice.tax || 0) / 100,
      discount: (invoice.discount?.coupon?.amount_off || 0) / 100,
      total: invoice.total / 100,
      amount_paid: invoice.amount_paid / 100,
      amount_due: invoice.amount_due / 100,
      currency: invoice.currency,
      invoice_date: new Date(invoice.created * 1000),
      due_date: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      paid_at: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : null,
      invoice_pdf_url: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
      payment_intent_id:
        typeof invoice.payment_intent === 'string'
          ? invoice.payment_intent
          : invoice.payment_intent?.id,
    });
  }

  // ===== Helper Methods =====

  private async getSubscriptionTier(tierId: string): Promise<SubscriptionTier | null> {
    const { data, error } = await this.supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      monthlyPrice: parseFloat(data.monthly_price),
      yearlyPrice: parseFloat(data.yearly_price),
      currency: data.currency,
      stripeMonthlyPriceId: data.stripe_monthly_price_id,
      stripeYearlyPriceId: data.stripe_yearly_price_id,
      features: data.features || [],
      limits: {
        messagesPerMonth: data.messages_per_month,
        modelsAccess: data.models_access,
        mcpServers: data.mcp_servers,
        storageGb: data.storage_gb,
        teamMembers: data.team_members,
        projects: data.projects,
        apiRequests: data.api_requests,
        priority: data.priority as Priority,
        supportLevel: data.support_level as SupportLevel,
      },
      priority: data.priority as Priority,
      supportLevel: data.support_level as SupportLevel,
      isActive: data.is_active,
      isPublic: data.is_public,
      targetAudience: data.target_audience || [],
      displayOrder: data.display_order,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private async validateDiscountCode(
    code: string,
    userId: string,
    tierId?: string
  ): Promise<any> {
    // This will be implemented in DiscountManager
    // For now, return invalid
    return { valid: false };
  }

  private mapSubscription(data: any): Subscription {
    return {
      id: data.id,
      userId: data.user_id,
      customerId: data.customer_id,
      tierId: data.tier_id,
      billingCycle: data.billing_cycle,
      stripeSubscriptionId: data.stripe_subscription_id,
      stripePriceId: data.stripe_price_id,
      status: data.status,
      currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : undefined,
      currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
      trialStart: data.trial_start ? new Date(data.trial_start) : undefined,
      trialEnd: data.trial_end ? new Date(data.trial_end) : undefined,
      cancelAt: data.cancel_at ? new Date(data.cancel_at) : undefined,
      canceledAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
      endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
      amount: parseFloat(data.amount),
      currency: data.currency,
      discountId: data.discount_id,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Export singleton instance
export const paymentProcessor = new PaymentProcessor();
