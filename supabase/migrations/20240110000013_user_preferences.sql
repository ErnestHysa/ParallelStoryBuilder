-- User preferences system - adding preference columns to existing profiles table
-- Adds preferences JSONB, language, onboarding_completed, relationship_blueprint columns

-- First, check if columns exist to avoid errors on subsequent runs
DO $$
BEGIN
  -- Add preferences JSONB column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add language column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN language TEXT DEFAULT 'en';
  END IF;

  -- Add onboarding_completed column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add relationship_blueprint column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'relationship_blueprint'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN relationship_blueprint JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add created_at and updated_at for preferences
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferences_updated_at'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN preferences_updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON public.profiles USING GIN(preferences);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON public.profiles(language);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);

-- Create index for relationship blueprint
CREATE INDEX IF NOT EXISTS idx_profiles_relationship_blueprint ON public.profiles USING GIN(relationship_blueprint);

-- Function to update user preferences
CREATE OR REPLACE FUNCTION public.update_user_preferences(
  p_user_id UUID,
  p_preferences JSONB DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_onboarding_completed BOOLEAN DEFAULT NULL,
  p_relationship_blueprint JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    preferences = COALESCE(p_preferences, preferences),
    language = COALESCE(p_language, language),
    onboarding_completed = COALESCE(p_onboarding_completed, onboarding_completed),
    relationship_blueprint = COALESCE(p_relationship_blueprint, relationship_blueprint),
    preferences_updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user preferences
CREATE OR REPLACE FUNCTION public.get_user_preferences(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_preferences JSONB;
BEGIN
  SELECT jsonb_build_object(
    'preferences', p.preferences,
    'language', p.language,
    'onboarding_completed', p.onboarding_completed,
    'relationship_blueprint', p.relationship_blueprint,
    'preferences_updated_at', p.preferences_updated_at
  ) INTO v_preferences
  FROM public.profiles p
  WHERE p.id = p_user_id;

  RETURN COALESCE(v_preferences, jsonb_build_object('error', 'User not found'));
END;
$$ LANGUAGE plpgsql;

-- Function to complete onboarding
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_user_id UUID,
  p_preferences JSONB DEFAULT NULL,
  p_language TEXT DEFAULT 'en',
  p_relationship_blueprint JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    onboarding_completed = TRUE,
    preferences = COALESCE(p_preferences, '{}'::jsonb),
    language = p_language,
    relationship_blueprint = COALESCE(p_relationship_blueprint, '{}'::jsonb),
    preferences_updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update relationship blueprint
CREATE OR REPLACE FUNCTION public.update_relationship_blueprint(
  p_user_id UUID,
  p_blueprint JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    relationship_blueprint = COALESCE(p_blueprint, '{}'::jsonb),
    preferences_updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get preference defaults
CREATE OR REPLACE FUNCTION public.get_default_preferences()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'theme', 'light',
    'font_size', 'medium',
    'auto_save', TRUE,
    'show_tips', TRUE,
    'privacy', jsonb_build_object(
      'show_online_status', TRUE,
      'show_activity_status', TRUE,
      'allow_direct_messages', TRUE,
      'allow_story_invitations', TRUE,
      'allow_profile_visibility', 'everyone'
    ),
    'notifications', jsonb_build_object(
      'email_digest', TRUE,
      'push_notifications', TRUE,
      'sound_effects', TRUE,
      'story_updates', TRUE,
      'collaboration_alerts', TRUE
    ),
    'writing', jsonb_build_object(
      'auto_correct', TRUE,
      'grammar_check', TRUE,
      'word_count_visible', TRUE,
      'show_reading_time', TRUE,
      'collaboration_mode', 'realtime'
    ),
    'interface', jsonb_build_object(
      'animations_enabled', TRUE,
      'show_tooltips', TRUE,
      'keyboard_shortcuts', TRUE,
      'minimap_enabled', FALSE
    ),
    'ai_assistant', jsonb_build_object(
      'enabled', TRUE,
      'suggestions_level', 'balanced',
      'auto_complete', TRUE,
      'style_suggestions', TRUE
    ),
    'social', jsonb_build_object(
      'connect_on_email', FALSE,
      'share_progress', TRUE,
      'show_streak', TRUE,
      'show_achievements', TRUE,
      'allow_friend_requests', TRUE
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to reset user preferences to defaults
CREATE OR REPLACE FUNCTION public.reset_user_preferences(
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    preferences = public.get_default_preferences(),
    preferences_updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for user preferences summary
CREATE OR REPLACE VIEW public.user_preferences_summary AS
SELECT
  p.*,
  CASE
    WHEN p.onboarding_completed THEN 'Completed'
    ELSE 'In Progress'
  END as onboarding_status,
  p.preferences->>'theme' as theme,
  p.preferences->>'font_size' as font_size,
  p.preferences->'privacy'->>'show_online_status' as show_online_status,
  p.preferences->'notifications'->>'email_digest' as email_digest,
  p.preferences->'notifications'->>'push_notifications' as push_notifications,
  p.preferences->'writing'->>'collaboration_mode' as collaboration_mode,
  p.preferences->'ai_assistant'->>'suggestions_level' as ai_suggestions_level,
  p.preferences->'social'->>'show_streak' as show_streak,
  CASE
    WHEN p.relationship_blueprint ? 'interests' THEN jsonb_array_length(p.relationship_blueprint->'interests')
    ELSE 0
  END as interest_count,
  CASE
    WHEN p.relationship_blueprint ? 'goals' THEN jsonb_array_length(p.relationship_blueprint->'goals')
    ELSE 0
  END as goal_count
FROM public.profiles p;

-- Create view for onboarding progress
CREATE OR REPLACE VIEW public.onboarding_progress AS
SELECT
  p.id,
  p.display_name,
  p.email,
  CASE
    WHEN p.onboarding_completed THEN 'Completed'
    WHEN p.preferences ? 'theme' AND p.preferences ? 'privacy' THEN 'Almost Done'
    WHEN p.preferences ? 'theme' THEN 'In Progress'
    ELSE 'Not Started'
  END as progress_status,
  COALESCE(
    (SELECT COUNT(*) FROM public.story_members WHERE user_id = p.id),
    0
  ) as stories_joined,
  COALESCE(
    (SELECT COUNT(*) FROM public.chapters WHERE author_id = p.id),
    0
  ) as chapters_written,
  COALESCE(
    (SELECT COUNT(*) FROM public.relationships WHERE (user_1 = p.id OR user_2 = p.id) AND status = 'accepted'),
    0
  ) as relationships_formed,
  p.onboarding_completed,
  p.preferences_updated_at as last_updated
FROM public.profiles p
ORDER BY p.created_at DESC;

-- Create view for users by language
CREATE OR REPLACE VIEW public.users_by_language AS
SELECT
  language,
  COUNT(*) as user_count,
  COUNT(CASE WHEN onboarding_completed THEN 1 END) as completed_onboarding,
  ROUND(
    (COUNT(CASE WHEN onboarding_completed THEN 1 END) * 100.0 / COUNT(*)),
    2
  ) as completion_rate
FROM public.profiles
GROUP BY language
ORDER BY user_count DESC;

-- Grant permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_preferences_summary TO authenticated;
GRANT SELECT ON public.onboarding_progress TO authenticated;
GRANT SELECT ON public.users_by_language TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_onboarding TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_relationship_blueprint TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_default_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_preferences TO authenticated;