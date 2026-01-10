-- supabase/migrations/20240110000004_atomic_rate_limit_function.sql
-- Atomic function to increment AI usage and check rate limits
-- This prevents race conditions when multiple requests come in simultaneously

CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id UUID,
  p_date DATE,
  p_limit INT
)
RETURNS TABLE (
  allowed BOOLEAN,
  count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count INT;
BEGIN
  -- Insert or update the usage count atomically
  INSERT INTO public.ai_usage (user_id, date, count)
  VALUES (p_user_id, p_date, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    count = public.ai_usage.count + 1
  RETURNING public.ai_usage.count INTO v_current_count;

  -- Check if the count exceeds the limit
  RETURN QUERY SELECT
    (v_current_count <= p_limit) AS allowed,
    v_current_count AS count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_ai_usage(UUID, DATE, INT) TO authenticated;
