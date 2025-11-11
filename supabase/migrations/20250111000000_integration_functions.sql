-- Integration Helper Functions
-- Functions needed for the integrated chat system

-- Function to increment user's monthly request count
CREATE OR REPLACE FUNCTION increment_user_requests(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET
    monthly_requests = COALESCE(monthly_requests, 0) + 1,
    total_requests = COALESCE(total_requests, 0) + 1,
    last_request_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly requests (run on 1st of each month)
CREATE OR REPLACE FUNCTION reset_monthly_requests()
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET monthly_requests = 0;

  -- Log the reset action
  INSERT INTO user_activity_log (user_id, action, metadata)
  SELECT
    id,
    'monthly_quota_reset',
    jsonb_build_object(
      'previous_requests', monthly_requests,
      'reset_date', NOW()
    )
  FROM user_profiles
  WHERE monthly_requests > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can make request (quota check)
CREATE OR REPLACE FUNCTION can_make_request(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT
    (api_quota_limit - COALESCE(monthly_requests, 0))
  INTO v_remaining
  FROM user_profiles
  WHERE id = p_user_id;

  RETURN v_remaining > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user quota info
CREATE OR REPLACE FUNCTION get_user_quota(p_user_id UUID)
RETURNS TABLE (
  monthly_requests INTEGER,
  api_quota_limit INTEGER,
  remaining INTEGER,
  percentage_used NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(up.monthly_requests, 0)::INTEGER,
    COALESCE(up.api_quota_limit, 100)::INTEGER,
    (COALESCE(up.api_quota_limit, 100) - COALESCE(up.monthly_requests, 0))::INTEGER,
    ROUND(
      (COALESCE(up.monthly_requests, 0)::NUMERIC / NULLIF(COALESCE(up.api_quota_limit, 100), 0)) * 100,
      2
    )
  FROM user_profiles up
  WHERE up.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to reset monthly requests
-- This should be configured in Supabase dashboard or via cron
-- Example cron schedule: '0 0 1 * *' (midnight on the 1st of each month)

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_user_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_make_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_quota(UUID) TO authenticated;

-- Comments
COMMENT ON FUNCTION increment_user_requests IS 'Increments the monthly and total request count for a user';
COMMENT ON FUNCTION reset_monthly_requests IS 'Resets monthly_requests to 0 for all users (run monthly)';
COMMENT ON FUNCTION can_make_request IS 'Checks if user has remaining quota to make a request';
COMMENT ON FUNCTION get_user_quota IS 'Returns detailed quota information for a user';
