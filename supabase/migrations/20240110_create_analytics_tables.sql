-- ============================================================================
-- ANALYTICS & INSIGHTS PLATFORM - DATABASE SCHEMA
-- Complete analytics infrastructure for Nexus AI
-- ============================================================================

-- Create analytics events table for raw event tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  properties JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  user_tier TEXT,
  user_segment TEXT,
  ip_address INET,
  user_agent TEXT,
  platform TEXT,
  version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create model requests table for AI model usage tracking
CREATE TABLE IF NOT EXISTS model_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  project_id UUID,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,

  -- Token usage
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,

  -- Cost tracking
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  cost_per_token DECIMAL(10, 8),

  -- Performance metrics
  response_time INTEGER NOT NULL, -- milliseconds
  time_to_first_token INTEGER,
  tokens_per_second DECIMAL(10, 2),

  -- Smart router metrics
  was_routed BOOLEAN DEFAULT false,
  router_confidence DECIMAL(5, 4),
  router_reason TEXT,
  alternative_models JSONB,

  -- Request details
  prompt_length INTEGER,
  completion_length INTEGER,
  temperature DECIMAL(3, 2),
  max_tokens INTEGER,

  -- Status and errors
  status TEXT NOT NULL DEFAULT 'success', -- success, error, timeout, canceled
  error_type TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- User feedback
  user_feedback_rating INTEGER CHECK (user_feedback_rating BETWEEN 1 AND 5),
  user_feedback_comment TEXT,
  user_feedback_at TIMESTAMPTZ,

  -- Context
  feature_context TEXT,
  task_type TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create aggregated metrics table for pre-computed analytics
CREATE TABLE IF NOT EXISTS aggregated_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- counter, gauge, histogram, timeseries
  dimension TEXT,
  dimension_value TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  value DECIMAL(20, 6) NOT NULL,
  count INTEGER DEFAULT 0,
  min_value DECIMAL(20, 6),
  max_value DECIMAL(20, 6),
  avg_value DECIMAL(20, 6),
  percentile_50 DECIMAL(20, 6),
  percentile_95 DECIMAL(20, 6),
  percentile_99 DECIMAL(20, 6),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(metric_name, dimension, dimension_value, period_start, period_end)
);

-- Create cost tracking table for detailed cost attribution
CREATE TABLE IF NOT EXISTS cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID,
  project_id UUID,
  model_request_id UUID REFERENCES model_requests(id) ON DELETE CASCADE,

  cost_type TEXT NOT NULL, -- model_usage, storage, api_call, feature_usage
  amount DECIMAL(10, 6) NOT NULL,
  currency TEXT DEFAULT 'USD',

  model_id TEXT,
  feature_id TEXT,

  potential_cost DECIMAL(10, 6), -- what it would have cost without optimization
  savings DECIMAL(10, 6) DEFAULT 0,

  billing_period DATE,
  is_billable BOOLEAN DEFAULT true,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user analytics summary table for quick lookups
CREATE TABLE IF NOT EXISTS user_analytics_summary (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity metrics
  total_requests INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_active_days INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,

  -- Usage metrics
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_cost DECIMAL(12, 6) DEFAULT 0,
  total_savings DECIMAL(12, 6) DEFAULT 0,

  -- Engagement metrics
  engagement_score DECIMAL(5, 2) DEFAULT 0,
  feature_adoption_count INTEGER DEFAULT 0,
  projects_created INTEGER DEFAULT 0,
  files_uploaded INTEGER DEFAULT 0,
  collaborations INTEGER DEFAULT 0,

  -- Model preferences
  preferred_model TEXT,
  most_used_models JSONB DEFAULT '[]',
  model_usage_distribution JSONB DEFAULT '{}',

  -- Performance
  avg_response_time INTEGER,
  avg_user_rating DECIMAL(3, 2),

  -- Time tracking
  first_request_at TIMESTAMPTZ,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create anomaly detection table
CREATE TABLE IF NOT EXISTS analytics_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_type TEXT NOT NULL, -- statistical, cost_spike, performance, usage, error
  metric_name TEXT NOT NULL,
  severity TEXT NOT NULL, -- low, medium, high, critical

  detected_value DECIMAL(20, 6) NOT NULL,
  expected_value DECIMAL(20, 6),
  deviation DECIMAL(10, 4),
  z_score DECIMAL(10, 4),

  affected_entity_type TEXT, -- user, team, model, feature
  affected_entity_id TEXT,

  description TEXT NOT NULL,
  suggestion TEXT,

  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create recommendations table
CREATE TABLE IF NOT EXISTS analytics_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type TEXT NOT NULL, -- cost, performance, usage, growth, retention, feature
  priority TEXT NOT NULL, -- low, medium, high, critical

  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID,

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  effort TEXT NOT NULL,

  potential_value DECIMAL(12, 6),
  confidence DECIMAL(5, 4),

  action_items JSONB DEFAULT '[]',

  status TEXT DEFAULT 'active', -- active, dismissed, implemented, expired
  dismissed_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create feature usage tracking table
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL,
  feature_name TEXT NOT NULL,

  usage_count INTEGER DEFAULT 1,
  first_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  time_spent_seconds INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, feature_id)
);

-- Create router analytics table
CREATE TABLE IF NOT EXISTS router_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES model_requests(id) ON DELETE CASCADE,

  selected_model TEXT NOT NULL,
  confidence DECIMAL(5, 4) NOT NULL,

  alternative_models JSONB DEFAULT '[]',
  selection_factors JSONB DEFAULT '{}',

  estimated_cost DECIMAL(10, 6),
  estimated_quality DECIMAL(5, 4),
  estimated_speed INTEGER,

  actual_cost DECIMAL(10, 6),
  actual_quality DECIMAL(5, 4),
  actual_speed INTEGER,

  was_optimal BOOLEAN,
  savings_achieved DECIMAL(10, 6) DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create session analytics table
CREATE TABLE IF NOT EXISTS session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  request_count INTEGER DEFAULT 0,
  feature_interactions INTEGER DEFAULT 0,

  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,

  entry_page TEXT,
  exit_page TEXT,
  pages_visited JSONB DEFAULT '[]',

  total_cost DECIMAL(10, 6) DEFAULT 0,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Analytics events indexes
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp DESC);

-- Model requests indexes
CREATE INDEX idx_model_requests_user_id ON model_requests(user_id);
CREATE INDEX idx_model_requests_model_id ON model_requests(model_id);
CREATE INDEX idx_model_requests_created_at ON model_requests(created_at DESC);
CREATE INDEX idx_model_requests_status ON model_requests(status);
CREATE INDEX idx_model_requests_was_routed ON model_requests(was_routed);
CREATE INDEX idx_model_requests_user_created ON model_requests(user_id, created_at DESC);
CREATE INDEX idx_model_requests_model_created ON model_requests(model_id, created_at DESC);

-- Aggregated metrics indexes
CREATE INDEX idx_aggregated_metrics_name ON aggregated_metrics(metric_name);
CREATE INDEX idx_aggregated_metrics_period ON aggregated_metrics(period_start, period_end);
CREATE INDEX idx_aggregated_metrics_dimension ON aggregated_metrics(dimension, dimension_value);

-- Cost tracking indexes
CREATE INDEX idx_cost_tracking_user_id ON cost_tracking(user_id);
CREATE INDEX idx_cost_tracking_created_at ON cost_tracking(created_at DESC);
CREATE INDEX idx_cost_tracking_billing_period ON cost_tracking(billing_period);
CREATE INDEX idx_cost_tracking_team_id ON cost_tracking(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_cost_tracking_project_id ON cost_tracking(project_id) WHERE project_id IS NOT NULL;

-- Feature usage indexes
CREATE INDEX idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX idx_feature_usage_feature_id ON feature_usage(feature_id);
CREATE INDEX idx_feature_usage_last_used ON feature_usage(last_used_at DESC);

-- Router analytics indexes
CREATE INDEX idx_router_analytics_user_id ON router_analytics(user_id);
CREATE INDEX idx_router_analytics_model ON router_analytics(selected_model);
CREATE INDEX idx_router_analytics_created ON router_analytics(created_at DESC);
CREATE INDEX idx_router_analytics_optimal ON router_analytics(was_optimal);

-- Anomalies indexes
CREATE INDEX idx_anomalies_severity ON analytics_anomalies(severity);
CREATE INDEX idx_anomalies_created ON analytics_anomalies(created_at DESC);
CREATE INDEX idx_anomalies_resolved ON analytics_anomalies(is_resolved);

-- Recommendations indexes
CREATE INDEX idx_recommendations_user_id ON analytics_recommendations(user_id);
CREATE INDEX idx_recommendations_status ON analytics_recommendations(status);
CREATE INDEX idx_recommendations_priority ON analytics_recommendations(priority);
CREATE INDEX idx_recommendations_created ON analytics_recommendations(created_at DESC);

-- Session analytics indexes
CREATE INDEX idx_session_analytics_user_id ON session_analytics(user_id);
CREATE INDEX idx_session_analytics_started ON session_analytics(started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregated_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE router_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for analytics_events
CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Policies for model_requests
CREATE POLICY "Users can view own model requests"
  ON model_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert model requests"
  ON model_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own feedback"
  ON model_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for cost_tracking
CREATE POLICY "Users can view own cost tracking"
  ON cost_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert cost tracking"
  ON cost_tracking FOR INSERT
  WITH CHECK (true);

-- Policies for user_analytics_summary
CREATE POLICY "Users can view own analytics summary"
  ON user_analytics_summary FOR SELECT
  USING (auth.uid() = user_id);

-- Policies for feature_usage
CREATE POLICY "Users can view own feature usage"
  ON feature_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage feature usage"
  ON feature_usage FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies for router_analytics
CREATE POLICY "Users can view own router analytics"
  ON router_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Policies for recommendations
CREATE POLICY "Users can view own recommendations"
  ON analytics_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON analytics_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for anomalies (admins only in real app)
CREATE POLICY "Service role can manage anomalies"
  ON analytics_anomalies FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policies for session_analytics
CREATE POLICY "Users can view own session analytics"
  ON session_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Function to update user analytics summary
CREATE OR REPLACE FUNCTION update_user_analytics_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_analytics_summary (
    user_id,
    total_requests,
    total_input_tokens,
    total_output_tokens,
    total_cost,
    last_activity_at,
    first_request_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    1,
    NEW.input_tokens,
    NEW.output_tokens,
    NEW.cost,
    NEW.created_at,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_requests = user_analytics_summary.total_requests + 1,
    total_input_tokens = user_analytics_summary.total_input_tokens + NEW.input_tokens,
    total_output_tokens = user_analytics_summary.total_output_tokens + NEW.output_tokens,
    total_cost = user_analytics_summary.total_cost + NEW.cost,
    last_activity_at = NEW.created_at,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update analytics summary on model request
CREATE TRIGGER trigger_update_user_analytics_summary
  AFTER INSERT ON model_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_user_analytics_summary();

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL := 0;
  v_metrics RECORD;
BEGIN
  SELECT
    total_requests,
    total_active_days,
    feature_adoption_count,
    current_streak,
    collaborations
  INTO v_metrics
  FROM user_analytics_summary
  WHERE user_id = p_user_id;

  IF v_metrics IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate weighted score (0-100)
  v_score :=
    (LEAST(v_metrics.total_requests, 1000) / 10.0) + -- max 100 points
    (LEAST(v_metrics.total_active_days, 100) * 0.5) + -- max 50 points
    (LEAST(v_metrics.feature_adoption_count, 20) * 2) + -- max 40 points
    (LEAST(v_metrics.current_streak, 30) * 1) + -- max 30 points
    (LEAST(v_metrics.collaborations, 10) * 3); -- max 30 points

  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user metrics for a period
CREATE OR REPLACE FUNCTION get_user_metrics(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_requests BIGINT,
  total_cost DECIMAL,
  avg_response_time INTEGER,
  top_model TEXT,
  satisfaction_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_requests,
    SUM(cost)::DECIMAL as total_cost,
    AVG(response_time)::INTEGER as avg_response_time,
    MODE() WITHIN GROUP (ORDER BY model_id) as top_model,
    AVG(user_feedback_rating)::DECIMAL as satisfaction_rating
  FROM model_requests
  WHERE user_id = p_user_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert some default aggregated metrics structure
INSERT INTO aggregated_metrics (metric_name, metric_type, period_start, period_end, value, count)
VALUES
  ('daily_active_users', 'counter', NOW() - INTERVAL '1 day', NOW(), 0, 0),
  ('total_requests', 'counter', NOW() - INTERVAL '1 day', NOW(), 0, 0),
  ('total_cost', 'gauge', NOW() - INTERVAL '1 day', NOW(), 0, 0),
  ('avg_response_time', 'gauge', NOW() - INTERVAL '1 day', NOW(), 0, 0)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON analytics_events TO authenticated;
GRANT SELECT ON model_requests TO authenticated;
GRANT SELECT ON cost_tracking TO authenticated;
GRANT SELECT ON user_analytics_summary TO authenticated;
GRANT SELECT ON feature_usage TO authenticated;
GRANT SELECT ON router_analytics TO authenticated;
GRANT SELECT ON analytics_recommendations TO authenticated;
GRANT SELECT ON session_analytics TO authenticated;
