# Billing & Subscription System Documentation

## Overview

The Nexus AI billing system is a comprehensive payment processing and subscription management platform built with Stripe integration. It handles subscriptions, usage tracking, discount codes, and feature gating across three tiers: Free, Pro, and Team.

## Architecture

### Core Components

1. **PaymentProcessor** (`src/lib/billing/payment-processor.ts`)
   - Stripe customer management
   - Subscription creation and management
   - Payment processing
   - Webhook handling

2. **DiscountManager** (`src/lib/billing/discount-manager.ts`)
   - Promotional code management
   - Discount validation and application
   - Special offers (Propelix, Srivant, Founder)

3. **UsageTracker** (`src/lib/billing/usage-tracker.ts`)
   - Real-time usage monitoring with Redis
   - Limit enforcement
   - Usage alerts and notifications

4. **FeatureGate** (`src/lib/billing/feature-gate.ts`)
   - Feature access control
   - Model access restrictions
   - Tier-based permissions

### Database Schema

The billing system uses the following PostgreSQL tables:

- **subscription_tiers**: Tier configuration (Free, Pro, Team)
- **stripe_customers**: Customer records linked to Stripe
- **subscriptions**: Active subscriptions with Stripe sync
- **payment_methods**: Saved payment methods
- **invoices**: Invoice records from Stripe
- **discount_codes**: Promotional codes
- **discount_usage**: Track discount redemptions
- **usage_records**: Detailed usage logs
- **usage_aggregations**: Monthly usage summaries
- **payment_transactions**: Payment history
- **webhook_events**: Stripe webhook logs

## Subscription Tiers

### Free Tier
- **Price**: $0
- **Messages**: 100/month
- **Models**: 5 basic models (Gemini Flash, GPT-4o Mini, Claude Haiku)
- **Storage**: 1 GB
- **Projects**: 3
- **Support**: Community

### Pro Tier
- **Price**: $20/month or $200/year (save 17%)
- **Messages**: Unlimited
- **Models**: All 25+ AI models
- **Smart Routing**: Enabled
- **MCP Servers**: 3
- **Storage**: 10 GB
- **API**: 1,000 requests/month
- **Support**: Email

### Team Tier
- **Price**: $50/month or $500/year (save 17%)
- **Everything in Pro** plus:
- **Team Workspaces**: Unlimited members
- **MCP Servers**: Unlimited
- **Admin Dashboard**: Full analytics
- **SSO**: Enterprise security
- **Storage**: 50 GB
- **API**: 10,000 requests/month
- **Support**: Priority chat

## Special Discount Codes

### PROPELIX2025
- **Discount**: 80% off Pro tier
- **Target**: Propelix students
- **Price**: $4/month instead of $20
- **Duration**: 6 months
- **Requirements**: @student.propelix.com email
- **Limit**: 200 redemptions
- **Expires**: December 31, 2025

### SRIVANT-INTERNAL
- **Discount**: 70% off Team tier
- **Target**: Srivant employees
- **Price**: $15/month instead of $50
- **Duration**: Lifetime
- **Requirements**: @surviant.ai or @srivant.com email
- **Limit**: 50 redemptions

### FOUNDER50
- **Discount**: 50% off any tier
- **Target**: Early adopters
- **Duration**: Lifetime
- **Requirements**: First-time customers only
- **Limit**: First 100 customers
- **Expires**: June 30, 2025

## Setup Instructions

### 1. Install Dependencies

The billing system requires these packages:
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js ioredis
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in the following:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_TEAM_YEARLY_PRICE_ID=price_...

# Redis
REDIS_URL=redis://localhost:6379
```

### 3. Set Up Stripe

#### Create Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create products for each tier:
   - **Nexus AI Pro**
     - Monthly: $20
     - Yearly: $200
   - **Nexus AI Team**
     - Monthly: $50
     - Yearly: $500

3. Copy the Price IDs and add them to your `.env.local`

#### Create Discount Codes

Run the initialization script to create special discount codes:

```typescript
import { discountManager } from '@/lib/billing/discount-manager';

await discountManager.initializeDefaultDiscounts();
```

#### Set Up Webhooks

1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/billing/webhooks/stripe`
3. Select events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 4. Run Database Migrations

Apply the billing system migration:

```bash
npm run db:push
```

This creates all necessary tables and inserts default subscription tiers.

### 5. Set Up Redis

For local development:
```bash
docker run -d -p 6379:6379 redis:alpine
```

For production, use a managed service like:
- [Upstash](https://upstash.com/) (serverless Redis)
- [Redis Cloud](https://redis.com/try-free/)
- AWS ElastiCache
- Google Cloud Memorystore

## API Endpoints

### Subscriptions

**GET /api/billing/subscriptions**
- Get user's subscriptions
- Auth required

**POST /api/billing/subscriptions**
- Create new subscription
- Body: `{ tierId, billingCycle, discountCode? }`
- Auth required

**PATCH /api/billing/subscriptions**
- Update subscription (upgrade, cancel)
- Body: `{ subscriptionId, action, newTierId? }`
- Actions: `upgrade`, `cancel`, `cancel_immediately`
- Auth required

### Discounts

**POST /api/billing/discounts/validate**
- Validate discount code
- Body: `{ code, tierId? }`
- Auth required
- Returns: `{ valid, discount, appliedValue, error? }`

### Usage

**GET /api/billing/usage**
- Get current usage and limits
- Auth required

**POST /api/billing/usage**
- Track usage
- Body: `{ usageType, quantity?, metadata? }`
- Auth required

### Webhooks

**POST /api/billing/webhooks/stripe**
- Stripe webhook handler
- No auth (verified with signature)

## Usage Examples

### Create a Subscription

```typescript
const response = await fetch('/api/billing/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tierId: 'pro',
    billingCycle: 'monthly',
    discountCode: 'PROPELIX2025', // optional
  }),
});

const { data: subscription } = await response.json();
```

### Validate Discount Code

```typescript
const response = await fetch('/api/billing/discounts/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'PROPELIX2025',
    tierId: 'pro',
  }),
});

const { data } = await response.json();
if (data.valid) {
  console.log('Discount applies!', data.appliedValue);
}
```

### Check Feature Access

```typescript
import { featureGate } from '@/lib/billing/feature-gate';

const result = await featureGate.checkFeatureAccess(userId, 'mcp');
if (!result.allowed) {
  console.log('Upgrade required:', result.reason);
}
```

### Track Usage

```typescript
import { usageTracker } from '@/lib/billing/usage-tracker';

// Track a message
await usageTracker.trackUsage(userId, 'messages', 1);

// Check if user can still send messages
const canSend = await usageTracker.canUseFeature(userId, 'messages');
if (!canSend) {
  // Show upgrade prompt
}
```

## Feature Gating

The system automatically enforces limits based on subscription tier:

```typescript
import { featureGate } from '@/lib/billing/feature-gate';

// Check if user can access a model
const result = await featureGate.canAccessModel(userId, 'gpt-4');
if (!result.allowed) {
  return { error: result.reason };
}

// Check if user can send a message
const canSend = await featureGate.canSendMessage(userId);
if (!canSend.allowed) {
  return { error: 'Message limit reached. Upgrade to Pro for unlimited.' };
}
```

## Testing

### Test Mode

Always use Stripe test keys during development:
- Test keys start with `sk_test_` and `pk_test_`
- Use test cards: `4242 4242 4242 4242` (Visa)

### Test Webhooks Locally

Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/billing/webhooks/stripe
```

### Test Discount Codes

```bash
curl -X POST http://localhost:3000/api/billing/discounts/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"PROPELIX2025","tierId":"pro"}'
```

## Monitoring & Analytics

### Usage Dashboard

Track key metrics:
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Churn rate
- Customer Lifetime Value (LTV)
- Conversion rate by tier

### Alerts

The system sends automatic alerts for:
- Payment failures
- Trial ending soon
- Usage limits approaching (80%)
- Usage limits reached (100%)
- Subscription cancellations

## Security Best Practices

1. **Never expose secret keys**
   - Keep `STRIPE_SECRET_KEY` server-side only
   - Use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for client

2. **Verify webhook signatures**
   - Always verify Stripe webhook signatures
   - Already implemented in webhook handler

3. **Validate user access**
   - Always check authentication
   - Verify subscription ownership

4. **Secure Redis**
   - Use TLS for production Redis
   - Set password authentication

5. **Rate limiting**
   - Implement rate limits on API endpoints
   - Already configured in auth system

## Troubleshooting

### Common Issues

**Webhook not receiving events**
- Check webhook URL is publicly accessible
- Verify webhook secret matches Stripe dashboard
- Check Stripe dashboard webhook logs

**Discount code not working**
- Verify code is active in database
- Check expiration date
- Verify user meets requirements (email domain, new customer, etc.)

**Usage not tracking**
- Verify Redis connection
- Check `REDIS_URL` environment variable
- Ensure `increment_usage` database function exists

**Subscription creation fails**
- Verify Stripe Price IDs are correct
- Check customer has valid payment method
- Review Stripe dashboard for error details

## Production Deployment

### Checklist

- [ ] Switch to live Stripe keys
- [ ] Configure production Redis instance
- [ ] Set up webhook endpoint with HTTPS
- [ ] Test all payment flows end-to-end
- [ ] Enable monitoring and alerts
- [ ] Set up backup for billing data
- [ ] Configure tax calculation (if needed)
- [ ] Review and test discount codes
- [ ] Test subscription upgrades/downgrades
- [ ] Verify webhook signature verification

### Environment Variables (Production)

Ensure these are set in production:
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_URL=rediss://... # Use TLS
ENABLE_BILLING=true
```

## Support & Maintenance

### Regular Tasks

- Monitor webhook events for failures
- Review discount code usage
- Analyze usage patterns
- Update tier limits as needed
- Review and respond to payment failures
- Generate monthly billing reports

### Updates

When updating prices or tiers:
1. Create new Price in Stripe
2. Update `STRIPE_PRICE_ID` environment variables
3. Run database migration if needed
4. Update `subscription-tiers.ts` configuration
5. Test with test customers before going live

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Documentation](https://supabase.com/docs)
- [Redis Commands](https://redis.io/commands)

## Contact

For billing system questions or issues:
- Email: billing@nexus.ai
- Slack: #billing-support
