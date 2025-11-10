-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE profile_visibility AS ENUM ('public', 'private', 'team');
CREATE TYPE user_role AS ENUM ('developer', 'designer', 'product_manager', 'student', 'researcher', 'content_creator', 'business_analyst', 'other');
CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');
CREATE TYPE code_theme AS ENUM ('vs-dark', 'github', 'monokai', 'solarized', 'dracula', 'nord');

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  username VARCHAR(30) UNIQUE,
  display_name VARCHAR(100),
  bio TEXT CHECK (char_length(bio) <= 500),
  avatar_url TEXT,
  cover_image_url TEXT,
  location VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',

  -- Professional Info
  title VARCHAR(100),
  company VARCHAR(100),
  website TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,

  -- User Role & Interests
  user_role user_role,
  skills TEXT[],
  interests TEXT[],

  -- Preferences
  theme theme_preference DEFAULT 'system',
  code_theme code_theme DEFAULT 'vs-dark',
  preferred_models TEXT[],
  default_smart_router BOOLEAN DEFAULT true,

  -- Notification Settings
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  slack_notifications BOOLEAN DEFAULT false,
  discord_notifications BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  billing_alerts BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,

  -- Privacy Settings
  profile_visibility profile_visibility DEFAULT 'public',
  activity_visibility profile_visibility DEFAULT 'team',
  allow_indexing BOOLEAN DEFAULT true,
  allow_analytics BOOLEAN DEFAULT true,
  allow_mentions BOOLEAN DEFAULT true,
  show_email BOOLEAN DEFAULT false,

  -- Subscription & Billing
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  subscription_id VARCHAR(255),
  customer_id VARCHAR(255),
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,

  -- Usage Tracking
  monthly_requests INTEGER DEFAULT 0,
  total_requests BIGINT DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE,
  api_quota_limit INTEGER DEFAULT 100,

  -- Security
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  backup_codes TEXT[],
  security_key_ids TEXT[],
  last_password_change TIMESTAMP WITH TIME ZONE,
  password_change_required BOOLEAN DEFAULT false,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  privacy_accepted_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_requested_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT username_format CHECK (username ~* '^[a-z0-9_-]+$'),
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Security Logs Table
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event Details
  event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'password_change', 'failed_login', '2fa_enabled', etc.
  event_status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'blocked'

  -- Request Info
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  location_country VARCHAR(2),
  location_city VARCHAR(100),

  -- Additional Context
  metadata JSONB,
  risk_score INTEGER DEFAULT 0, -- 0-100 risk assessment

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for performance
  INDEX idx_security_logs_user_id ON security_logs(user_id),
  INDEX idx_security_logs_event_type ON security_logs(event_type),
  INDEX idx_security_logs_created_at ON security_logs(created_at DESC)
);

-- User Sessions Table (for device tracking)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session Info
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT,

  -- Device Info
  device_name VARCHAR(100),
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  os VARCHAR(50),
  browser VARCHAR(50),
  ip_address INET,
  location_country VARCHAR(2),
  location_city VARCHAR(100),

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,

  INDEX idx_user_sessions_user_id ON user_sessions(user_id),
  INDEX idx_user_sessions_token ON user_sessions(session_token)
);

-- User Preferences Table (separate for flexibility)
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Editor Preferences
  editor_font_size INTEGER DEFAULT 14,
  editor_font_family VARCHAR(50) DEFAULT 'Monaco',
  editor_tab_size INTEGER DEFAULT 2,
  editor_word_wrap BOOLEAN DEFAULT true,
  editor_line_numbers BOOLEAN DEFAULT true,
  editor_minimap BOOLEAN DEFAULT true,

  -- AI Model Preferences
  default_model VARCHAR(50),
  model_temperature DECIMAL(3,2) DEFAULT 0.7,
  model_max_tokens INTEGER DEFAULT 2000,
  streaming_enabled BOOLEAN DEFAULT true,

  -- UI Preferences
  sidebar_collapsed BOOLEAN DEFAULT false,
  show_avatars BOOLEAN DEFAULT true,
  compact_mode BOOLEAN DEFAULT false,
  animations_enabled BOOLEAN DEFAULT true,

  -- Feature Flags
  beta_features_enabled BOOLEAN DEFAULT false,
  experimental_features JSONB DEFAULT '{}',

  -- Custom Settings
  custom_shortcuts JSONB DEFAULT '{}',
  custom_templates JSONB DEFAULT '{}',

  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth Connections Table
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Provider Info
  provider VARCHAR(50) NOT NULL, -- 'google', 'github', 'microsoft', etc.
  provider_account_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),

  -- Tokens
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,

  -- Scopes & Permissions
  scopes TEXT[],

  -- Metadata
  profile_data JSONB,

  -- Status
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(user_id, provider, provider_account_id),
  INDEX idx_oauth_connections_user_id ON oauth_connections(user_id)
);

-- Email Verification Tokens
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Queue Table
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification Details
  type VARCHAR(50) NOT NULL, -- 'email', 'push', 'slack', 'discord'
  subject VARCHAR(255),
  content TEXT NOT NULL,
  template_id VARCHAR(100),

  -- Delivery
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_notification_queue_user_id ON notification_queue(user_id),
  INDEX idx_notification_queue_status ON notification_queue(status)
);

-- User Activity Log (for GDPR compliance and analytics)
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity Details
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),

  -- Context
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  INDEX idx_user_activity_user_id ON user_activity_log(user_id),
  INDEX idx_user_activity_created_at ON user_activity_log(created_at DESC)
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_email ON user_profiles(id); -- id is already email in auth.users
CREATE INDEX idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- User Profiles: Users can read all public profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (profile_visibility = 'public' OR auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Security Logs: Users can only view their own logs
CREATE POLICY "Users can view own security logs" ON security_logs
  FOR SELECT USING (auth.uid() = user_id);

-- User Sessions: Users can only view/manage their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- User Preferences: Users can only access their own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- OAuth Connections: Users can only access their own connections
CREATE POLICY "Users can manage own oauth connections" ON oauth_connections
  FOR ALL USING (auth.uid() = user_id);

-- Activity Log: Users can only view their own activity
CREATE POLICY "Users can view own activity" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id)
  VALUES (NEW.id);

  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type VARCHAR,
  p_event_status VARCHAR,
  p_ip_address INET,
  p_user_agent TEXT,
  p_metadata JSONB
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_logs (
    user_id,
    event_type,
    event_status,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_status,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if username is available
CREATE OR REPLACE FUNCTION is_username_available(p_username VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE username = p_username
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user profile by username
CREATE OR REPLACE FUNCTION get_profile_by_username(p_username VARCHAR)
RETURNS TABLE (
  id UUID,
  username VARCHAR,
  display_name VARCHAR,
  bio TEXT,
  avatar_url TEXT,
  profile_visibility profile_visibility
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.username,
    up.display_name,
    up.bio,
    up.avatar_url,
    up.profile_visibility
  FROM user_profiles up
  WHERE up.username = p_username
    AND up.is_active = true
    AND (up.profile_visibility = 'public' OR up.id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
