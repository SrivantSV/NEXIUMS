// Discount Manager - Promotional Code Management
// Handles discount codes, validation, and application

import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/client';
import {
  DiscountCode,
  CreateDiscountData,
  DiscountValidation,
  BillingError,
} from '@/types/billing';
import { nanoid } from 'nanoid';

export class DiscountManager {
  private stripe: Stripe;
  private supabase = createClient();

  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }

  // ===== Create Discount Codes =====

  async createDiscountCode(discountData: CreateDiscountData): Promise<DiscountCode> {
    try {
      // Create coupon in Stripe
      const couponParams: Stripe.CouponCreateParams = {
        id: discountData.code.toUpperCase(),
        name: discountData.name,
        ...(discountData.type === 'percentage' && {
          percent_off: discountData.value,
        }),
        ...(discountData.type === 'fixed' && {
          amount_off: discountData.value * 100, // Convert to cents
          currency: 'usd',
        }),
        duration: discountData.duration,
        ...(discountData.durationMonths && {
          duration_in_months: discountData.durationMonths,
        }),
        ...(discountData.maxRedemptions && {
          max_redemptions: discountData.maxRedemptions,
        }),
        ...(discountData.expiresAt && {
          redeem_by: Math.floor(discountData.expiresAt.getTime() / 1000),
        }),
        metadata: {
          source: 'nexus-ai',
          restrictions: JSON.stringify(discountData.restrictions),
        },
      };

      const stripeCoupon = await this.stripe.coupons.create(couponParams);

      // Store in database
      const applicableTiers = discountData.restrictions[0]?.tiers;
      const emailDomains = discountData.conditions
        .filter((c) => c.type === 'email_domain')
        .map((c) => c.value as string);

      const { data: discount, error } = await this.supabase
        .from('discount_codes')
        .insert({
          code: discountData.code.toUpperCase(),
          name: discountData.name,
          description: discountData.description,
          type: discountData.type,
          value: discountData.value,
          stripe_coupon_id: stripeCoupon.id,
          duration: discountData.duration,
          duration_months: discountData.durationMonths,
          applicable_tiers: applicableTiers,
          new_customers_only: discountData.restrictions[0]?.newCustomersOnly || false,
          email_domains: emailDomains.length > 0 ? emailDomains : null,
          max_redemptions: discountData.maxRedemptions,
          max_per_user: discountData.restrictions[0]?.maxPerUser || 1,
          current_redemptions: 0,
          is_active: true,
          valid_from: new Date(),
          valid_until: discountData.expiresAt,
          metadata: {},
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDiscountCode(discount);
    } catch (error: any) {
      throw new BillingError(
        `Failed to create discount code: ${error.message}`,
        'DISCOUNT_CREATE_ERROR',
        500
      );
    }
  }

  // ===== Special Discount Codes =====

  async createProplexDiscount(): Promise<DiscountCode> {
    return this.createDiscountCode({
      code: 'PROPELIX2025',
      name: 'Propelix Student Discount',
      description: '80% off Pro tier for Propelix students',
      type: 'percentage',
      value: 80,
      duration: 'repeating',
      durationMonths: 6,
      conditions: [
        { type: 'email_domain', value: '@student.propelix.com' },
        { type: 'tier', value: 'pro' },
      ],
      restrictions: [
        {
          tiers: ['pro'],
          newCustomersOnly: true,
          maxPerUser: 1,
          maxTotal: 200,
        },
      ],
      maxRedemptions: 200,
      expiresAt: new Date('2025-12-31'),
    });
  }

  async createSrivantCompanyDiscount(): Promise<DiscountCode> {
    return this.createDiscountCode({
      code: 'SRIVANT-INTERNAL',
      name: 'Srivant Company Discount',
      description: '70% off Team tier for Srivant employees',
      type: 'percentage',
      value: 70,
      duration: 'forever',
      conditions: [
        { type: 'email_domain', value: '@surviant.ai' },
        { type: 'tier', value: 'team' },
      ],
      restrictions: [
        {
          tiers: ['team'],
          emailDomains: ['surviant.ai', 'srivant.com'],
        },
      ],
      maxRedemptions: 50,
    });
  }

  async createFounderDiscount(): Promise<DiscountCode> {
    return this.createDiscountCode({
      code: 'FOUNDER50',
      name: 'Founder Early Access',
      description: '50% off any tier for early adopters',
      type: 'percentage',
      value: 50,
      duration: 'forever',
      conditions: [{ type: 'new_customer', value: true }],
      restrictions: [
        {
          newCustomersOnly: true,
          maxPerUser: 1,
          maxTotal: 100,
        },
      ],
      maxRedemptions: 100,
      expiresAt: new Date('2025-06-30'),
    });
  }

  // ===== Validate Discount Code =====

  async validateDiscountCode(
    code: string,
    userId: string,
    tierId?: string
  ): Promise<DiscountValidation> {
    try {
      // Get discount code from database
      const { data: discount, error } = await this.supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !discount) {
        return { valid: false, error: 'Invalid discount code' };
      }

      // Check if active
      if (!discount.is_active) {
        return { valid: false, error: 'Discount code is no longer active' };
      }

      // Check if expired
      if (discount.valid_until && new Date(discount.valid_until) < new Date()) {
        return { valid: false, error: 'Discount code has expired' };
      }

      // Check usage limits
      if (
        discount.max_redemptions &&
        discount.current_redemptions >= discount.max_redemptions
      ) {
        return {
          valid: false,
          error: 'Discount code has reached its usage limit',
        };
      }

      // Check user-specific limits
      const { data: userUsage } = await this.supabase
        .from('discount_usage')
        .select('*')
        .eq('discount_id', discount.id)
        .eq('user_id', userId);

      const userUsageCount = userUsage?.length || 0;
      if (discount.max_per_user && userUsageCount >= discount.max_per_user) {
        return {
          valid: false,
          error: 'You have already used this discount code',
        };
      }

      // Check tier restrictions
      if (
        discount.applicable_tiers &&
        discount.applicable_tiers.length > 0 &&
        tierId &&
        !discount.applicable_tiers.includes(tierId)
      ) {
        return {
          valid: false,
          error: 'Discount code not valid for this subscription tier',
        };
      }

      // Check first-time customer restriction
      if (discount.new_customers_only) {
        const { data: existingSubscriptions } = await this.supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId);

        if (existingSubscriptions && existingSubscriptions.length > 0) {
          return {
            valid: false,
            error: 'Discount code is only valid for new customers',
          };
        }
      }

      // Check email domain restrictions
      if (discount.email_domains && discount.email_domains.length > 0) {
        const { data: user } = await this.supabase
          .from('user_profiles')
          .select('id')
          .eq('id', userId)
          .single();

        if (user) {
          // Get user's email from auth.users
          const { data: authUser } = await this.supabase.auth.getUser();
          const userEmail = authUser.user?.email || '';

          const emailDomain = userEmail.split('@')[1];
          const allowedDomains = discount.email_domains.map((d) =>
            d.replace('@', '')
          );

          if (!allowedDomains.includes(emailDomain)) {
            return {
              valid: false,
              error: 'Discount code not valid for your email domain',
            };
          }
        }
      }

      // Calculate applied value
      const appliedValue = await this.calculateDiscountValue(discount, tierId);

      return {
        valid: true,
        discount: this.mapDiscountCode(discount),
        appliedValue,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: `Error validating discount code: ${error.message}`,
      };
    }
  }

  // ===== Apply Discount =====

  async applyDiscount(
    userId: string,
    discountCode: string,
    subscriptionId: string
  ): Promise<void> {
    try {
      // Validate discount
      const validation = await this.validateDiscountCode(discountCode, userId);

      if (!validation.valid) {
        throw new BillingError(
          validation.error!,
          'INVALID_DISCOUNT',
          400
        );
      }

      if (!validation.discount) {
        throw new BillingError(
          'Discount not found',
          'DISCOUNT_NOT_FOUND',
          404
        );
      }

      // Get subscription
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        throw new BillingError(
          'Subscription not found',
          'SUBSCRIPTION_NOT_FOUND',
          404
        );
      }

      // Apply discount to subscription in Stripe
      await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
        discounts: [{ coupon: validation.discount.stripeCouponId }],
      });

      // Update subscription in database
      await this.supabase
        .from('subscriptions')
        .update({ discount_id: validation.discount.id })
        .eq('id', subscriptionId);

      // Update usage tracking
      await this.updateDiscountUsage(
        validation.discount.id,
        userId,
        subscriptionId,
        validation.appliedValue || 0
      );

      // Increment current redemptions
      await this.supabase
        .from('discount_codes')
        .update({
          current_redemptions: validation.discount.currentRedemptions + 1,
        })
        .eq('id', validation.discount.id);
    } catch (error: any) {
      throw new BillingError(
        `Failed to apply discount: ${error.message}`,
        'DISCOUNT_APPLY_ERROR',
        500
      );
    }
  }

  // ===== Remove Discount =====

  async removeDiscount(subscriptionId: string): Promise<void> {
    try {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        throw new BillingError(
          'Subscription not found',
          'SUBSCRIPTION_NOT_FOUND',
          404
        );
      }

      // Remove discount from Stripe
      await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
        discounts: [],
      });

      // Update database
      await this.supabase
        .from('subscriptions')
        .update({ discount_id: null })
        .eq('id', subscriptionId);
    } catch (error: any) {
      throw new BillingError(
        `Failed to remove discount: ${error.message}`,
        'DISCOUNT_REMOVE_ERROR',
        500
      );
    }
  }

  // ===== List Discount Codes =====

  async listActiveCodes(): Promise<DiscountCode[]> {
    const { data, error } = await this.supabase
      .from('discount_codes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return [];

    return data.map(this.mapDiscountCode);
  }

  async getDiscountCode(code: string): Promise<DiscountCode | null> {
    const { data, error } = await this.supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !data) return null;

    return this.mapDiscountCode(data);
  }

  // ===== Helper Methods =====

  private async calculateDiscountValue(
    discount: any,
    tierId?: string
  ): Promise<number> {
    if (!tierId) return 0;

    // Get tier pricing
    const { data: tier } = await this.supabase
      .from('subscription_tiers')
      .select('monthly_price, yearly_price')
      .eq('id', tierId)
      .single();

    if (!tier) return 0;

    const basePrice = parseFloat(tier.monthly_price);

    if (discount.type === 'percentage') {
      return basePrice * (discount.value / 100);
    } else if (discount.type === 'fixed') {
      return Math.min(discount.value, basePrice);
    }

    return 0;
  }

  private async updateDiscountUsage(
    discountId: string,
    userId: string,
    subscriptionId: string,
    amountSaved: number
  ): Promise<void> {
    await this.supabase.from('discount_usage').insert({
      discount_id: discountId,
      user_id: userId,
      subscription_id: subscriptionId,
      amount_saved: amountSaved,
    });
  }

  private mapDiscountCode(data: any): DiscountCode {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      type: data.type,
      value: parseFloat(data.value),
      stripeCouponId: data.stripe_coupon_id,
      stripePromotionCodeId: data.stripe_promotion_code_id,
      duration: data.duration,
      durationMonths: data.duration_months,
      minAmount: data.min_amount ? parseFloat(data.min_amount) : undefined,
      applicableTiers: data.applicable_tiers,
      newCustomersOnly: data.new_customers_only,
      emailDomains: data.email_domains,
      maxRedemptions: data.max_redemptions,
      maxPerUser: data.max_per_user,
      currentRedemptions: data.current_redemptions,
      isActive: data.is_active,
      validFrom: new Date(data.valid_from),
      validUntil: data.valid_until ? new Date(data.valid_until) : undefined,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // ===== Initialize Default Discounts =====

  async initializeDefaultDiscounts(): Promise<void> {
    try {
      // Check if discounts already exist
      const { data: existing } = await this.supabase
        .from('discount_codes')
        .select('code')
        .in('code', ['PROPELIX2025', 'SRIVANT-INTERNAL', 'FOUNDER50']);

      const existingCodes = existing?.map((d) => d.code) || [];

      // Create discounts that don't exist
      if (!existingCodes.includes('PROPELIX2025')) {
        await this.createProplexDiscount();
      }

      if (!existingCodes.includes('SRIVANT-INTERNAL')) {
        await this.createSrivantCompanyDiscount();
      }

      if (!existingCodes.includes('FOUNDER50')) {
        await this.createFounderDiscount();
      }
    } catch (error) {
      console.error('Failed to initialize default discounts:', error);
    }
  }
}

// Export singleton instance
export const discountManager = new DiscountManager();
