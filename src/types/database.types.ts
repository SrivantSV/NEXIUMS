// Database types for Supabase
export type SubscriptionTier = 'free' | 'pro' | 'team' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type ProfileVisibility = 'public' | 'private' | 'team';
export type UserRole = 'developer' | 'designer' | 'product_manager' | 'student' | 'researcher' | 'content_creator' | 'business_analyst' | 'other';
export type ThemePreference = 'light' | 'dark' | 'system';
export type CodeTheme = 'vs-dark' | 'github' | 'monokai' | 'solarized' | 'dracula' | 'nord';

export interface UserProfile {
  id: string;

  // Basic Info
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  location: string | null;
  timezone: string;
  language: string;

  // Professional Info
  title: string | null;
  company: string | null;
  website: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;

  // User Role & Interests
  user_role: UserRole | null;
  skills: string[] | null;
  interests: string[] | null;

  // Preferences
  theme: ThemePreference;
  code_theme: CodeTheme;
  preferred_models: string[] | null;
  default_smart_router: boolean;

  // Notification Settings
  email_notifications: boolean;
  push_notifications: boolean;
  slack_notifications: boolean;
  discord_notifications: boolean;
  weekly_digest: boolean;
  security_alerts: boolean;
  billing_alerts: boolean;
  marketing_emails: boolean;

  // Privacy Settings
  profile_visibility: ProfileVisibility;
  activity_visibility: ProfileVisibility;
  allow_indexing: boolean;
  allow_analytics: boolean;
  allow_mentions: boolean;
  show_email: boolean;

  // Subscription & Billing
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_id: string | null;
  customer_id: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  trial_ends_at: string | null;

  // Usage Tracking
  monthly_requests: number;
  total_requests: number;
  last_request_at: string | null;
  api_quota_limit: number;

  // Security
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  backup_codes: string[] | null;
  security_key_ids: string[] | null;
  last_password_change: string | null;
  password_change_required: boolean;

  // Metadata
  onboarding_completed: boolean;
  onboarding_step: number;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  is_active: boolean;
  is_verified: boolean;
  verification_requested_at: string | null;
  last_seen_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface SecurityLog {
  id: string;
  user_id: string;
  event_type: string;
  event_status: string;
  ip_address: string | null;
  user_agent: string | null;
  device_fingerprint: string | null;
  location_country: string | null;
  location_city: string | null;
  metadata: Record<string, any> | null;
  risk_score: number;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  refresh_token: string | null;
  device_name: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  ip_address: string | null;
  location_country: string | null;
  location_city: string | null;
  is_active: boolean;
  last_activity_at: string;
  created_at: string;
  expires_at: string | null;
}

export interface UserPreferences {
  user_id: string;
  editor_font_size: number;
  editor_font_family: string;
  editor_tab_size: number;
  editor_word_wrap: boolean;
  editor_line_numbers: boolean;
  editor_minimap: boolean;
  default_model: string | null;
  model_temperature: number;
  model_max_tokens: number;
  streaming_enabled: boolean;
  sidebar_collapsed: boolean;
  show_avatars: boolean;
  compact_mode: boolean;
  animations_enabled: boolean;
  beta_features_enabled: boolean;
  experimental_features: Record<string, any>;
  custom_shortcuts: Record<string, any>;
  custom_templates: Record<string, any>;
  updated_at: string;
}

export interface OAuthConnection {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  provider_email: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  profile_data: Record<string, any> | null;
  is_primary: boolean;
  is_active: boolean;
  connected_at: string;
  last_synced_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Partial<UserProfile>;
        Update: Partial<UserProfile>;
      };
      security_logs: {
        Row: SecurityLog;
        Insert: Partial<SecurityLog>;
        Update: Partial<SecurityLog>;
      };
      user_sessions: {
        Row: UserSession;
        Insert: Partial<UserSession>;
        Update: Partial<UserSession>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Partial<UserPreferences>;
        Update: Partial<UserPreferences>;
      };
      oauth_connections: {
        Row: OAuthConnection;
        Insert: Partial<OAuthConnection>;
        Update: Partial<OAuthConnection>;
      };
    };
  };
}
