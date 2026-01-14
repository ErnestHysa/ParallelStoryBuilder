-- Presence tracking system for real-time user activity
-- Creates presence table, update_presence function, and cleanup_stale_presence function

-- Create presence table
CREATE TABLE IF NOT EXISTS public.presence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id UUID NULL REFERENCES public.chapters(id) ON DELETE SET NULL,
  cursor_position INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'away', 'offline')),
  device_type TEXT NOT NULL DEFAULT 'web' CHECK (device_type IN ('web', 'mobile', 'desktop')),
  ip_address INET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_presence_user_story ON public.presence(user_id, story_id);
CREATE INDEX IF NOT EXISTS idx_presence_story_user ON public.presence(story_id, user_id);
CREATE INDEX IF NOT EXISTS idx_presence_last_active ON public.presence(last_active_at);
CREATE INDEX IF NOT EXISTS idx_presence_status ON public.presence(status);
CREATE INDEX IF NOT EXISTS idx_presence_chapter_id ON public.presence(chapter_id);

-- Function to update or create a user's presence
CREATE OR REPLACE FUNCTION public.update_presence(
  p_user_id UUID,
  p_story_id UUID,
  p_chapter_id UUID DEFAULT NULL,
  p_cursor_position INTEGER DEFAULT 0,
  p_status TEXT DEFAULT 'active',
  p_device_type TEXT DEFAULT 'web',
  p_ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.presence (
    user_id,
    story_id,
    chapter_id,
    cursor_position,
    last_active_at,
    status,
    device_type,
    ip_address
  ) VALUES (
    p_user_id,
    p_story_id,
    p_chapter_id,
    p_cursor_position,
    NOW(),
    p_status,
    p_device_type,
    p_ip_address
  )
  ON CONFLICT (user_id, story_id)
  DO UPDATE SET
    chapter_id = EXCLUDED.chapter_id,
    cursor_position = EXCLUDED.cursor_position,
    last_active_at = NOW(),
    status = EXCLUDED.status,
    device_type = EXCLUDED.device_type,
    ip_address = EXCLUDED.ip_address,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up stale presence records
CREATE OR REPLACE FUNCTION public.cleanup_stale_presence(
  p_threshold_hours INTEGER DEFAULT 24
)
RETURNS TABLE(count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.presence
  WHERE last_active_at < NOW() - INTERVAL '1 hour' * p_threshold_hours;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean up stale presence records every hour
CREATE OR REPLACE FUNCTION public.cleanup_presence_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Run cleanup for stale presence (older than 24 hours)
  PERFORM public.cleanup_stale_presence(24);

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job for cleanup (requires pg_cron extension)
-- This creates an event that runs every hour (only if cron extension is available)
DO $$
BEGIN
  -- Check if cron extension exists before scheduling
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('cleanup_stale_presence', '0 * * * *', 'SELECT public.cleanup_stale_presence(24)');
  ELSE
    RAISE NOTICE 'pg_cron extension not available, skipping scheduled job creation';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END;
$$;

-- Add constraint to ensure only one active presence per user per story
CREATE UNIQUE INDEX IF NOT EXISTS idx_presence_user_story_unique
ON public.presence(user_id, story_id)
WHERE status = 'active';

-- Create a view for active presences
CREATE OR REPLACE VIEW public.active_presences AS
SELECT p.*,
       u.display_name,
       u.avatar_url,
       s.theme as story_theme,
       c.chapter_number as chapter_number
FROM public.presence p
JOIN public.profiles u ON p.user_id = u.id
JOIN public.stories s ON p.story_id = s.id
LEFT JOIN public.chapters c ON p.chapter_id = c.id
WHERE p.status = 'active'
  AND p.last_active_at > NOW() - INTERVAL '5 minutes';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.presence TO authenticated;
GRANT SELECT ON public.active_presences TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_presence TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_presence TO authenticated;