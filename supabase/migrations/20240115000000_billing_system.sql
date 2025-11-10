-- Billing System Migration
-- This migration adds comprehensive billing and subscription management

-- Create additional types
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly', 'custom');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded');
CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed', 'trial');
CREATE TYPE usage_type AS ENUM ('messages', 'ai_requests', 'file_uploads', 'mcp_calls', 'storage', 'team_members', 'projects', 'api_requests');

-- Subscription Tiers Configuration Table
CREATE TABLE subscription_tiers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pricing
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  yearly_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'usd',

  -- Stripe Integration
  stripe_monthly_price_id VARCHAR(255),
  stripe_yearly_price_id VARCHAR(255),

  -- Features (stored as JSONB for flexibility)
  features JSONB DEFAULT '[]',

  -- Limits
  messages_per_month INTEGER, -- NULL means unlimited
  models_access TEXT[], -- NULL or empty means all
  mcp_servers INTEGER, -- NULL means unlimited
  storage_gb INTEGER DEFAULT 1,
  team_members INTEGER DEFAULT 1,
  projects INTEGER, -- NULL means unlimited
  api_requests INTEGER, -- NULL means unlimited

  -- Priority & Support
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'premium'
  support_level VARCHAR(20) DEFAULT 'community', -- 'community', 'email', 'chat', 'phone', 'dedicated'

  -- Visibility
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  target_audience TEXT[],

  -- Metadata
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe Customers Table
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe Info
  stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,

  -- Customer Details
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),

  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(100),
  address_postal_code VARCHAR(20),
  address_country VARCHAR(2),

  -- Tax
  tax_exempt BOOLEAN DEFAULT false,
  tax_ids JSONB DEFAULT '[]',

  -- Payment Methods
  default_payment_method VARCHAR(255),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_stripe_customers_user_id ON stripe_customers(user_id),
  INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id)
);

-- Subscriptions Table (detailed)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES stripe_customers(id) ON DELETE CASCADE,

  -- Subscription Details
  tier_id VARCHAR(50) REFERENCES subscription_tiers(id),
  billing_cycle billing_cycle DEFAULT 'monthly',

  -- Stripe Integration
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),

  -- Status
  status subscription_status DEFAULT 'active',

  -- Dates
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,

  -- Pricing
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',

  -- Discount
  discount_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_subscriptions_user_id ON subscriptions(user_id),
  INDEX idx_subscriptions_customer_id ON subscriptions(customer_id),
  INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id),
  INDEX idx_subscriptions_status ON subscriptions(status)
);

-- Payment Methods Table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES stripe_customers(id) ON DELETE CASCADE,

  -- Stripe Info
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,

  -- Type
  type VARCHAR(50) NOT NULL, -- 'card', 'bank_account', etc.

  -- Card Details (if applicable)
  card_brand VARCHAR(50),
  card_last4 VARCHAR(4),
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_fingerprint VARCHAR(255),

  -- Bank Details (if applicable)
  bank_name VARCHAR(255),
  bank_last4 VARCHAR(4),

  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Billing Details
  billing_email VARCHAR(255),
  billing_name VARCHAR(255),
  billing_address JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_payment_methods_customer_id ON payment_methods(customer_id),
  INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id)
);

-- Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES stripe_customers(id) ON DELETE CASCADE,

  -- Stripe Integration
  stripe_invoice_id VARCHAR(255) UNIQUE,

  -- Invoice Details
  invoice_number VARCHAR(100),
  status invoice_status DEFAULT 'draft',

  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  amount_due DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',

  -- Dates
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- PDF
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,

  -- Payment
  payment_intent_id VARCHAR(255),

  -- Line Items
  line_items JSONB DEFAULT '[]',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_invoices_subscription_id ON invoices(subscription_id),
  INDEX idx_invoices_customer_id ON invoices(customer_id),
  INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id),
  INDEX idx_invoices_status ON invoices(status)
);

-- Discount Codes Table
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Code Details
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Discount Type & Value
  type discount_type NOT NULL,
  value DECIMAL(10,2) NOT NULL, -- percentage or fixed amount

  -- Stripe Integration
  stripe_coupon_id VARCHAR(255) UNIQUE,
  stripe_promotion_code_id VARCHAR(255),

  -- Duration
  duration VARCHAR(20) DEFAULT 'once', -- 'once', 'repeating', 'forever'
  duration_months INTEGER, -- for 'repeating'

  -- Conditions
  min_amount DECIMAL(10,2), -- minimum purchase amount
  applicable_tiers TEXT[], -- NULL means all tiers
  new_customers_only BOOLEAN DEFAULT false,
  email_domains TEXT[], -- restrict to specific email domains

  -- Usage Limits
  max_redemptions INTEGER, -- NULL means unlimited
  max_per_user INTEGER DEFAULT 1,
  current_redemptions INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Dates
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_discount_codes_code ON discount_codes(code),
  INDEX idx_discount_codes_active ON discount_codes(is_active)
);

-- Discount Usage Tracking
CREATE TABLE discount_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Usage Details
  amount_saved DECIMAL(10,2),

  -- Timestamps
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_discount_usage_discount_id ON discount_usage(discount_id),
  INDEX idx_discount_usage_user_id ON discount_usage(user_id),

  UNIQUE(discount_id, user_id) -- Prevent duplicate usage by same user
);

-- Usage Tracking Table
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Usage Details
  usage_type usage_type NOT NULL,
  quantity INTEGER DEFAULT 1,

  -- Stripe Usage Record (for metered billing)
  stripe_usage_record_id VARCHAR(255),

  -- Context
  resource_id VARCHAR(255), -- ID of the resource used
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_usage_records_user_id ON usage_records(user_id),
  INDEX idx_usage_records_subscription_id ON usage_records(subscription_id),
  INDEX idx_usage_records_type ON usage_records(usage_type),
  INDEX idx_usage_records_recorded_at ON usage_records(recorded_at DESC)
);

-- Usage Aggregations (for quick lookups)
CREATE TABLE usage_aggregations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,

  -- Usage Counts
  messages_count INTEGER DEFAULT 0,
  ai_requests_count INTEGER DEFAULT 0,
  file_uploads_count INTEGER DEFAULT 0,
  mcp_calls_count INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  team_members_count INTEGER DEFAULT 0,
  projects_count INTEGER DEFAULT 0,
  api_requests_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, year, month),
  INDEX idx_usage_aggregations_user_id ON usage_aggregations(user_id),
  INDEX idx_usage_aggregations_period ON usage_aggregations(year, month)
);

-- Payment Transactions Table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES stripe_customers(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- Stripe Integration
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),

  -- Transaction Details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status payment_status DEFAULT 'pending',

  -- Payment Method
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,

  -- Error Details
  error_code VARCHAR(100),
  error_message TEXT,

  -- Receipt
  receipt_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_payment_transactions_customer_id ON payment_transactions(customer_id),
  INDEX idx_payment_transactions_status ON payment_transactions(status),
  INDEX idx_payment_transactions_stripe_payment_intent ON payment_transactions(stripe_payment_intent_id)
);

-- Webhook Events Log
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Event Details
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,

  -- Payload
  payload JSONB NOT NULL,

  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- Timestamps
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_webhook_events_type ON webhook_events(event_type),
  INDEX idx_webhook_events_processed ON webhook_events(processed)
);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (id, name, description, monthly_price, yearly_price, messages_per_month, models_access, mcp_servers, storage_gb, team_members, projects, api_requests, priority, support_level, is_public, display_order, features) VALUES
('free', 'Free', 'Perfect for trying out Nexus AI', 0, 0, 100, ARRAY['gemini-flash', 'gpt-4o-mini', 'claude-haiku'], 0, 1, 1, 3, 0, 'low', 'community', true, 1,
  '[
    {"id": "messages", "name": "100 messages/month", "type": "limit", "value": 100, "isHighlight": false},
    {"id": "models", "name": "5 basic models", "type": "limit", "value": 5, "isHighlight": false},
    {"id": "memory", "name": "7-day memory", "type": "limit", "value": 7, "isHighlight": false},
    {"id": "artifacts", "name": "Basic artifacts", "type": "boolean", "value": true, "isHighlight": false}
  ]'::jsonb
),
('pro', 'Pro', 'For individual power users', 20, 200, NULL, NULL, 3, 10, 1, NULL, 1000, 'normal', 'email', true, 2,
  '[
    {"id": "messages", "name": "Unlimited messages", "type": "boolean", "value": true, "isHighlight": true},
    {"id": "models", "name": "All 25+ AI models", "type": "boolean", "value": true, "isHighlight": true},
    {"id": "smart-router", "name": "Smart routing enabled", "type": "boolean", "value": true, "isHighlight": true},
    {"id": "artifacts", "name": "Full artifacts system", "type": "boolean", "value": true, "isHighlight": false},
    {"id": "mcp", "name": "3 MCP servers", "type": "limit", "value": 3, "isHighlight": false},
    {"id": "memory", "name": "Unlimited memory", "type": "boolean", "value": true, "isHighlight": false},
    {"id": "code-execution", "name": "Code execution", "type": "boolean", "value": true, "isHighlight": false}
  ]'::jsonb
),
('team', 'Team', 'For teams and organizations', 50, 500, NULL, NULL, NULL, 50, NULL, NULL, 10000, 'high', 'chat', true, 3,
  '[
    {"id": "everything-pro", "name": "Everything in Pro", "type": "boolean", "value": true, "isHighlight": false},
    {"id": "team-workspaces", "name": "Team workspaces", "type": "boolean", "value": true, "isHighlight": true},
    {"id": "mcp-unlimited", "name": "Unlimited MCP servers", "type": "boolean", "value": true, "isHighlight": true},
    {"id": "admin-dashboard", "name": "Admin dashboard", "type": "boolean", "value": true, "isHighlight": true},
    {"id": "usage-analytics", "name": "Usage analytics", "type": "boolean", "value": true, "isHighlight": false},
    {"id": "sso", "name": "SSO & advanced security", "type": "boolean", "value": true, "isHighlight": false},
    {"id": "api-access", "name": "API access", "type": "boolean", "value": true, "isHighlight": false}
  ]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Subscription Tiers: Everyone can read public tiers
CREATE POLICY "Public tiers are viewable by everyone" ON subscription_tiers
  FOR SELECT USING (is_public = true);

-- Stripe Customers: Users can only view their own customer data
CREATE POLICY "Users can view own customer data" ON stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions: Users can only view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Payment Methods: Users can only view their own payment methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (
    customer_id IN (SELECT id FROM stripe_customers WHERE user_id = auth.uid())
  );

-- Invoices: Users can only view their own invoices
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (
    customer_id IN (SELECT id FROM stripe_customers WHERE user_id = auth.uid())
  );

-- Discount Codes: Everyone can read active codes
CREATE POLICY "Active discount codes are viewable by everyone" ON discount_codes
  FOR SELECT USING (is_active = true);

-- Discount Usage: Users can view their own usage
CREATE POLICY "Users can view own discount usage" ON discount_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Usage Records: Users can view their own usage
CREATE POLICY "Users can view own usage records" ON usage_records
  FOR SELECT USING (auth.uid() = user_id);

-- Usage Aggregations: Users can view their own aggregations
CREATE POLICY "Users can view own usage aggregations" ON usage_aggregations
  FOR SELECT USING (auth.uid() = user_id);

-- Payment Transactions: Users can view their own transactions
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT USING (
    customer_id IN (SELECT id FROM stripe_customers WHERE user_id = auth.uid())
  );

-- Functions

-- Update updated_at trigger for billing tables
CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_aggregations_updated_at
  BEFORE UPDATE ON usage_aggregations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  tier_id VARCHAR,
  tier_name VARCHAR,
  status subscription_status,
  current_period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS subscription_id,
    s.tier_id,
    st.name AS tier_name,
    s.status,
    s.current_period_end
  FROM subscriptions s
  JOIN subscription_tiers st ON s.tier_id = st.id
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_usage_type usage_type
) RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_current_usage INTEGER;
  v_tier_id VARCHAR;
BEGIN
  -- Get user's subscription tier
  SELECT tier_id INTO v_tier_id
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no subscription, default to free tier
  IF v_tier_id IS NULL THEN
    v_tier_id := 'free';
  END IF;

  -- Get limit for usage type
  CASE p_usage_type
    WHEN 'messages' THEN
      SELECT messages_per_month INTO v_limit FROM subscription_tiers WHERE id = v_tier_id;
    WHEN 'api_requests' THEN
      SELECT api_requests INTO v_limit FROM subscription_tiers WHERE id = v_tier_id;
    WHEN 'mcp_calls' THEN
      SELECT mcp_servers INTO v_limit FROM subscription_tiers WHERE id = v_tier_id;
    WHEN 'projects' THEN
      SELECT projects INTO v_limit FROM subscription_tiers WHERE id = v_tier_id;
    ELSE
      v_limit := NULL; -- Unlimited
  END CASE;

  -- If limit is NULL, usage is unlimited
  IF v_limit IS NULL THEN
    RETURN true;
  END IF;

  -- Get current month usage
  SELECT COALESCE(
    CASE p_usage_type
      WHEN 'messages' THEN messages_count
      WHEN 'api_requests' THEN api_requests_count
      WHEN 'mcp_calls' THEN mcp_calls_count
      WHEN 'projects' THEN projects_count
      ELSE 0
    END, 0
  ) INTO v_current_usage
  FROM usage_aggregations
  WHERE user_id = p_user_id
    AND year = EXTRACT(YEAR FROM NOW())
    AND month = EXTRACT(MONTH FROM NOW());

  -- Check if within limit
  RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_usage_type usage_type,
  p_quantity INTEGER DEFAULT 1
) RETURNS VOID AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW());
  v_month := EXTRACT(MONTH FROM NOW());

  -- Insert or update aggregation
  INSERT INTO usage_aggregations (user_id, year, month)
  VALUES (p_user_id, v_year, v_month)
  ON CONFLICT (user_id, year, month) DO NOTHING;

  -- Update usage count
  CASE p_usage_type
    WHEN 'messages' THEN
      UPDATE usage_aggregations SET messages_count = messages_count + p_quantity
      WHERE user_id = p_user_id AND year = v_year AND month = v_month;
    WHEN 'ai_requests' THEN
      UPDATE usage_aggregations SET ai_requests_count = ai_requests_count + p_quantity
      WHERE user_id = p_user_id AND year = v_year AND month = v_month;
    WHEN 'file_uploads' THEN
      UPDATE usage_aggregations SET file_uploads_count = file_uploads_count + p_quantity
      WHERE user_id = p_user_id AND year = v_year AND month = v_month;
    WHEN 'mcp_calls' THEN
      UPDATE usage_aggregations SET mcp_calls_count = mcp_calls_count + p_quantity
      WHERE user_id = p_user_id AND year = v_year AND month = v_month;
    WHEN 'api_requests' THEN
      UPDATE usage_aggregations SET api_requests_count = api_requests_count + p_quantity
      WHERE user_id = p_user_id AND year = v_year AND month = v_month;
  END CASE;

  -- Also create detailed usage record
  INSERT INTO usage_records (user_id, usage_type, quantity)
  VALUES (p_user_id, p_usage_type, p_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
