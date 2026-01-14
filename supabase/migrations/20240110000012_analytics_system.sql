-- Analytics system for tracking user events and system metrics
-- Creates analytics_events table and log_event function with comprehensive tracking

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  user_properties JSONB DEFAULT '{}'::jsonb,
  session_id TEXT NULL,
  platform TEXT NULL CHECK (platform IN ('web', 'ios', 'android', 'api')),
  browser TEXT NULL,
  device_type TEXT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  os TEXT NULL,
  language TEXT NULL,
  country_code TEXT NULL,
  ip_address INET NULL,
  referrer TEXT NULL,
  url TEXT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create analytics_sessions table for session tracking
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  exit_url TEXT NULL,
  completed BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create function to log events
CREATE OR REPLACE FUNCTION public.log_event(
  p_event_type TEXT,
  p_event_name TEXT,
  p_event_data JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_user_properties JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Insert the event
  INSERT INTO public.analytics_events (
    user_id,
    event_type,
    event_name,
    event_data,
    user_properties,
    session_id,
    platform,
    browser,
    device_type,
    os,
    language,
    country_code,
    ip_address,
    referrer,
    url
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_name,
    COALESCE(p_event_data, '{}'::jsonb),
    COALESCE(p_user_properties, '{}'::jsonb),
    p_session_id,
    p_platform,
    p_browser,
    p_device_type,
    p_os,
    p_language,
    p_country_code,
    p_ip_address,
    p_referrer,
    p_url
  )
  RETURNING id INTO v_event_id;

  -- Update session if provided
  IF p_session_id IS NOT NULL THEN
    UPDATE public.analytics_sessions
    SET
      last_activity = NOW(),
      events_count = events_count + 1,
      exit_url = p_url,
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('last_event', p_event_name)
    WHERE session_id = p_session_id;
  END IF;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to start a new session
CREATE OR REPLACE FUNCTION public.start_session(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_session_id TEXT;
BEGIN
  -- Generate session ID if not provided
  IF p_session_id IS NULL THEN
    v_session_id := lower(gen_random_uuid()::text);
  ELSE
    v_session_id := p_session_id;
  END IF;

  -- Insert or update session
  INSERT INTO public.analytics_sessions (
    session_id,
    user_id,
    platform,
    browser,
    device_type,
    os,
    language,
    country_code,
    ip_address,
    referrer,
    url
  ) VALUES (
    v_session_id,
    p_user_id,
    p_platform,
    p_browser,
    p_device_type,
    p_os,
    p_language,
    p_country_code,
    p_ip_address,
    p_referrer,
    p_url
  )
  ON CONFLICT (session_id)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    started_at = EXCLUDED.started_at,
    completed = FALSE;

  -- Log session start event
  PERFORM public.log_event(
    'session',
    'session_start',
    jsonb_build_object(
      'session_id', v_session_id,
      'user_id', p_user_id,
      'platform', p_platform,
      'browser', p_browser,
      'device_type', p_device_type,
      'os', p_os,
      'language', p_language,
      'country_code', p_country_code
    ),
    p_user_id,
    v_session_id,
    p_platform,
    p_browser,
    p_device_type,
    p_os,
    p_language,
    p_country_code,
    p_ip_address,
    p_referrer,
    p_url
  );

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to end a session
CREATE OR REPLACE FUNCTION public.end_session(
  p_session_id TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.analytics_sessions
  SET
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at)),
    completed = TRUE,
    last_activity = NOW()
  WHERE session_id = p_session_id;

  -- Log session end event
  PERFORM public.log_event(
    'session',
    'session_end',
    jsonb_build_object('session_id', p_session_id),
    NULL,
    p_session_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to track page views
CREATE OR REPLACE FUNCTION public.track_page_view(
  p_url TEXT,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_country_code TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  -- Log page view event
  RETURN public.log_event(
    'page_view',
    'page_view',
    jsonb_build_object('title', p_title),
    p_user_id,
    p_session_id,
    p_platform,
    p_browser,
    p_device_type,
    p_os,
    p_language,
    p_country_code,
    NULL,
    p_referrer,
    p_url
  );
END;
$$ LANGUAGE plpgsql;

-- Function to track user actions
CREATE OR REPLACE FUNCTION public.track_action(
  p_action_name TEXT,
  p_action_data JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  RETURN public.log_event(
    'action',
    p_action_name,
    p_action_data,
    p_user_id,
    p_session_id,
    p_platform
  );
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old analytics data (older than 2 years)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS TABLE(count INTEGER) AS $$
DECLARE
  v_events_count INTEGER;
  v_sessions_count INTEGER;
BEGIN
  -- Delete old events
  DELETE FROM public.analytics_events
  WHERE timestamp < NOW() - INTERVAL '2 years';

  GET DIAGNOSTICS v_events_count = ROW_COUNT;

  -- Delete old sessions
  DELETE FROM public.analytics_sessions
  WHERE started_at < NOW() - INTERVAL '2 years';

  GET DIAGNOSTICS v_sessions_count = ROW_COUNT;

  RETURN QUERY SELECT v_events_count + v_sessions_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_platform ON public.analytics_events(platform);
CREATE INDEX IF NOT EXISTS idx_analytics_events_ip_address ON public.analytics_events(ip_address);

-- Create indexes for analytics_sessions
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON public.analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON public.analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_completed ON public.analytics_sessions(completed);

-- Create function to get user activity summary
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_events', (
      SELECT COUNT(*)
      FROM public.analytics_events
      WHERE user_id = p_user_id
        AND timestamp > NOW() - INTERVAL '1 day' * p_days
    ),
    'page_views', (
      SELECT COUNT(*)
      FROM public.analytics_events
      WHERE user_id = p_user_id
        AND event_type = 'page_view'
        AND timestamp > NOW() - INTERVAL '1 day' * p_days
    ),
    'story_events', (
      SELECT COUNT(*)
      FROM public.analytics_events
      WHERE user_id = p_user_id
        AND event_type = 'action'
        AND event_name LIKE 'story%'
        AND timestamp > NOW() - INTERVAL '1 day' * p_days
    ),
    'session_count', (
      SELECT COUNT(DISTINCT session_id)
      FROM public.analytics_events
      WHERE user_id = p_user_id
        AND timestamp > NOW() - INTERVAL '1 day' * p_days
    ),
    'last_activity', (
      SELECT MAX(timestamp)
      FROM public.analytics_events
      WHERE user_id = p_user_id
    ),
    'platforms', (
      SELECT jsonb_object_agg(
        platform,
        COUNT(*)
      )
      FROM public.analytics_events
      WHERE user_id = p_user_id
        AND timestamp > NOW() - INTERVAL '1 day' * p_days
      GROUP BY platform
    ),
    'daily_stats', (
      SELECT jsonb_agg(jsonb_build_object(
        'date', DATE_TRUNC('day', timestamp)::date,
        'events', COUNT(*),
        'page_views', COUNT(CASE WHEN event_type = 'page_view' THEN 1 END)
      ))
      FROM public.analytics_events
      WHERE user_id = p_user_id
        AND timestamp > NOW() - INTERVAL '1 day' * p_days
      GROUP BY DATE_TRUNC('day', timestamp)
      ORDER BY DATE_TRUNC('day', timestamp) DESC
    )
  ) INTO v_summary;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql;

-- Create function to get top events
CREATE OR REPLACE FUNCTION public.get_top_events(
  p_event_name TEXT,
  p_days INTEGER DEFAULT 7,
  p_limit INTEGER DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
  v_top_events JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'event_data', event_data,
    'count', count,
    'users', COUNT(DISTINCT user_id)
  ))
  INTO v_top_events
  FROM public.analytics_events
  WHERE event_name = p_event_name
    AND timestamp > NOW() - INTERVAL '1 day' * p_days
  GROUP BY event_data
  ORDER BY count DESC, users DESC
  LIMIT p_limit;

  RETURN COALESCE(v_top_events, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job for cleanup (runs daily at 3 AM)
SELECT cron.schedule('0 3 * * *', $$SELECT public.cleanup_old_analytics()$$);

-- Create view for daily analytics summary
CREATE OR REPLACE VIEW public.daily_analytics_summary AS
SELECT
  DATE_TRUNC('day', timestamp) as date,
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
  COUNT(CASE WHEN event_type = 'action' THEN 1 END) as actions,
  COUNT(CASE WHEN event_type = 'session' THEN 1 END) as sessions,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(CASE WHEN platform = 'web' THEN 1 END) as web_events,
  COUNT(CASE WHEN platform = 'ios' THEN 1 END) as ios_events,
  COUNT(CASE WHEN platform = 'android' THEN 1 END) as android_events
FROM public.analytics_events
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp)
ORDER BY DATE_TRUNC('day', timestamp) DESC;

-- Create view for popular events
CREATE OR REPLACE VIEW public.popular_events AS
SELECT
  event_name,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.analytics_events
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY event_name, event_type
ORDER BY event_count DESC
LIMIT 50;

-- Grant permissions
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT SELECT, INSERT ON public.analytics_sessions TO authenticated;
GRANT SELECT ON public.daily_analytics_summary TO authenticated;
GRANT SELECT ON public.popular_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_page_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_events TO authenticated;