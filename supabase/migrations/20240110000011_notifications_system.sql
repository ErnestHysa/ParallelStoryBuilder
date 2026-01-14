-- Notifications system with push notifications and user preferences
-- Creates push_tokens and notification_preferences tables with comprehensive notification handling

-- Create push_tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  device_name TEXT NULL,
  last_used TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, token)
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Push notification preferences
  push_enabled BOOLEAN DEFAULT TRUE,

  -- Story notifications
  story_updates BOOLEAN DEFAULT TRUE,
  story_invitations BOOLEAN DEFAULT TRUE,

  -- Chapter notifications
  new_contributions BOOLEAN DEFAULT TRUE,
  chapter_comments BOOLEAN DEFAULT TRUE,

  -- Social notifications
  new_relationships BOOLEAN DEFAULT TRUE,
  achievement_unlocks BOOLEAN DEFAULT TRUE,
  mentions BOOLEAN DEFAULT TRUE,

  -- Marketing emails
  marketing_emails BOOLEAN DEFAULT FALSE,

  -- Daily digest
  daily_digest BOOLEAN DEFAULT TRUE,

  -- Weekly summary
  weekly_summary BOOLEAN DEFAULT TRUE,

  -- Sound settings
  sound_enabled BOOLEAN DEFAULT TRUE,
  vibrate_enabled BOOLEAN DEFAULT TRUE,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',

  -- Notification channels
  channels JSONB DEFAULT '{
    "story_updates": {"enabled": true, "sound": true},
    "invitations": {"enabled": true, "sound": true},
    "contributions": {"enabled": true, "sound": true},
    "comments": {"enabled": true, "sound": true},
    "social": {"enabled": true, "sound": false},
    "achievements": {"enabled": true, "sound": true},
    "mentions": {"enabled": true, "sound": true}
  }'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON public.push_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Function to register or update push token
CREATE OR REPLACE FUNCTION public.register_push_token(
  p_user_id UUID,
  p_token TEXT,
  p_platform TEXT,
  p_device_name TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.push_tokens (
    user_id,
    token,
    platform,
    device_name,
    last_used,
    is_active
  ) VALUES (
    p_user_id,
    p_token,
    p_platform,
    p_device_name,
    NOW(),
    TRUE
  )
  ON CONFLICT (user_id, token)
  DO UPDATE SET
    device_name = COALESCE(p_device_name, push_tokens.device_name),
    last_used = NOW(),
    is_active = TRUE,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update notification preferences
CREATE OR REPLACE FUNCTION public.update_notification_preferences(
  p_user_id UUID,
  p_preferences JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notification_preferences
  SET
    push_enabled = COALESCE(p_preferences->>'push_enabled', notification_preferences.push_enabled),
    story_updates = COALESCE(p_preferences->>'story_updates', notification_preferences.story_updates),
    story_invitations = COALESCE(p_preferences->>'story_invitations', notification_preferences.story_invitations),
    new_contributions = COALESCE(p_preferences->>'new_contributions', notification_preferences.new_contributions),
    chapter_comments = COALESCE(p_preferences->>'chapter_comments', notification_preferences.chapter_comments),
    new_relationships = COALESCE(p_preferences->>'new_relationships', notification_preferences.new_relationships),
    achievement_unlocks = COALESCE(p_preferences->>'achievement_unlocks', notification_preferences.achievement_unlocks),
    mentions = COALESCE(p_preferences->>'mentions', notification_preferences.mentions),
    marketing_emails = COALESCE(p_preferences->>'marketing_emails', notification_preferences.marketing_emails),
    daily_digest = COALESCE(p_preferences->>'daily_digest', notification_preferences.daily_digest),
    weekly_summary = COALESCE(p_preferences->>'weekly_summary', notification_preferences.weekly_summary),
    sound_enabled = COALESCE(p_preferences->>'sound_enabled', notification_preferences.sound_enabled),
    vibrate_enabled = COALESCE(p_preferences->>'vibrate_enabled', notification_preferences.vibrate_enabled),
    quiet_hours_enabled = COALESCE(p_preferences->>'quiet_hours_enabled', notification_preferences.quiet_hours_enabled),
    quiet_hours_start = COALESCE(p_preferences->>'quiet_hours_start', notification_preferences.quiet_hours_start),
    quiet_hours_end = COALESCE(p_preferences->>'quiet_hours_end', notification_preferences.quiet_hours_end),
    channels = COALESCE(p_preferences->'channels', notification_preferences.channels),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if notifications should be muted
CREATE OR REPLACE FUNCTION public.is_notification_muted(
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_preferences JSONB;
  v_now TIME;
  v_is_muted BOOLEAN := FALSE;
BEGIN
  -- Get user preferences
  SELECT COALESCE(notification_preferences.preferences, '{}'::jsonb) INTO v_preferences
  FROM public.notification_preferences
  WHERE user_id = p_user_id;

  IF v_preferences IS NULL THEN
    -- No preferences set, allow notifications
    RETURN FALSE;
  END IF;

  -- Check if quiet hours are enabled
  IF v_preferences->>'quiet_hours_enabled' = 'true' THEN
    v_now := TIME 'now';

    -- Handle overnight quiet hours
    DECLARE
      v_start TIME := (v_preferences->>'quiet_hours_start')::TIME;
      v_end TIME := (v_preferences->>'quiet_hours_end')::TIME;
    BEGIN
      IF v_start >= v_end THEN
        -- Quiet hours span midnight (e.g., 22:00 to 08:00)
        IF v_now >= v_start OR v_now < v_end THEN
          v_is_muted := TRUE;
        END IF;
      ELSE
        -- Regular quiet hours
        IF v_now >= v_start AND v_now < v_end THEN
          v_is_muted := TRUE;
        END IF;
      END IF;
    END;
  END IF;

  RETURN v_is_muted;
END;
$$ LANGUAGE plpgsql;

-- Function to get active push tokens for user
CREATE OR REPLACE FUNCTION public.get_active_push_tokens(
  p_user_id UUID
)
RETURNS TABLE(token TEXT, platform TEXT, device_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT token, platform, device_name
  FROM public.push_tokens
  WHERE user_id = p_user_id
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up inactive push tokens
CREATE OR REPLACE FUNCTION public.cleanup_inactive_push_tokens()
RETURNS TABLE(count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Deactivate tokens older than 90 days
  UPDATE public.push_tokens
  SET is_active = FALSE,
      updated_at = NOW()
  WHERE is_active = TRUE
    AND last_used < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job for cleanup (requires pg_cron extension)
-- This runs daily at 2 AM (only if cron extension is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cleanup_inactive_push_tokens', '0 2 * * *', 'SELECT public.cleanup_inactive_push_tokens()');
  ELSE
    RAISE NOTICE 'pg_cron extension not available, skipping scheduled job creation';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END;
$$;

-- Function to get user notification settings summary
CREATE OR REPLACE FUNCTION public.get_notification_settings(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_settings JSONB;
BEGIN
  SELECT jsonb_build_object(
    'push_enabled', np.push_enabled,
    'story_updates', np.story_updates,
    'story_invitations', np.story_invitations,
    'new_contributions', np.new_contributions,
    'chapter_comments', np.chapter_comments,
    'new_relationships', np.new_relationships,
    'achievement_unlocks', np.achievement_unlocks,
    'mentions', np.mentions,
    'marketing_emails', np.marketing_emails,
    'daily_digest', np.daily_digest,
    'weekly_summary', np.weekly_summary,
    'sound_enabled', np.sound_enabled,
    'vibrate_enabled', np.vibrate_enabled,
    'quiet_hours_enabled', np.quiet_hours_enabled,
    'quiet_hours_start', np.quiet_hours_start,
    'quiet_hours_end', np.quiet_hours_end,
    'channels', np.channels,
    'is_muted', public.is_notification_muted(p_user_id),
    'active_devices', (
      SELECT jsonb_agg(jsonb_build_object(
        'platform', platform,
        'device_name', device_name,
        'last_used', last_used
      ))
      FROM public.push_tokens
      WHERE user_id = p_user_id AND is_active = TRUE
    )
  ) INTO v_settings
  FROM public.notification_preferences np
  WHERE np.user_id = p_user_id;

  RETURN COALESCE(v_settings, jsonb_build_object('error', 'User preferences not found'));
END;
$$ LANGUAGE plpgsql;

-- Create view for push tokens summary
CREATE OR REPLACE VIEW public.push_tokens_summary AS
SELECT
  pt.user_id,
  p.display_name,
  p.email,
  COUNT(pt.id) as token_count,
  COUNT(CASE WHEN pt.is_active THEN 1 END) as active_tokens,
  COUNT(CASE WHEN pt.platform = 'web' THEN 1 END) as web_tokens,
  COUNT(CASE WHEN pt.platform = 'ios' THEN 1 END) as ios_tokens,
  COUNT(CASE WHEN pt.platform = 'android' THEN 1 END) as android_tokens,
  MAX(pt.last_used) as last_token_used
FROM public.push_tokens pt
JOIN public.profiles p ON pt.user_id = p.id
GROUP BY pt.user_id, p.display_name, p.email;

-- Create view for notification preferences summary
CREATE OR REPLACE VIEW public.notification_preferences_summary AS
SELECT
  np.*,
  u.display_name,
  u.email,
  CASE
    WHEN np.quiet_hours_enabled
      AND (
        (
          (np.quiet_hours_start <= np.quiet_hours_end
           AND TIME 'now' >= np.quiet_hours_start
           AND TIME 'now' < np.quiet_hours_end)
        )
        OR
        (
          (np.quiet_hours_start > np.quiet_hours_end
           AND (TIME 'now' >= np.quiet_hours_start
                OR TIME 'now' < np.quiet_hours_end))
        )
      )
    THEN 'Muted'
    ELSE 'Enabled'
  END as status
FROM public.notification_preferences np
JOIN public.profiles u ON np.user_id = u.id;

-- Grant permissions
GRANT SELECT, INSERT ON public.push_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT SELECT ON public.push_tokens_summary TO authenticated;
GRANT SELECT ON public.notification_preferences_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_push_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_notification_muted TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_push_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_inactive_push_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_settings TO authenticated;