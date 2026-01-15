-- User Settings Features Migration
-- Adds support for password change, account deletion, and enhanced settings

-- Enable uuid-ossp extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to delete user account and all associated data
-- This is robust and handles all dependencies by deleting from auth.users directly
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Security check: users can only delete their own account
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'You are not authorized to delete this account';
  END IF;

  -- 1. Explicitly delete related data
  DELETE FROM public.story_members WHERE user_id = p_user_id;
  DELETE FROM public.chapters WHERE author_id = p_user_id;
  DELETE FROM public.relationships WHERE (user_1 = p_user_id OR user_2 = p_user_id);
  DELETE FROM public.inspirations WHERE user_id = p_user_id;
  DELETE FROM public.daily_intentions WHERE user_id = p_user_id;
  DELETE FROM public.user_achievements WHERE user_id = p_user_id;
  DELETE FROM public.user_tokens WHERE user_id = p_user_id;

  -- 2. Delete the profile
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- 3. Target auth.users for the final wipe
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Grant execute permission (specifying types to avoid ambiguity)
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO authenticated;

-- Improved helper for updating preferences using JSONB merge to avoid NULL issues
-- This version only updates provided keys, preserving existing settings for omitted keys.
-- Note: This overloads the existing update_notification_preferences(UUID, JSONB) if it exists.
CREATE OR REPLACE FUNCTION public.update_notification_preferences(
  p_user_id UUID,
  p_new_chapter BOOLEAN DEFAULT NULL,
  p_partner_joined BOOLEAN DEFAULT NULL,
  p_daily_intention BOOLEAN DEFAULT NULL,
  p_weekly_highlights BOOLEAN DEFAULT NULL,
  p_ai_reminder BOOLEAN DEFAULT NULL,
  p_email_new_chapter BOOLEAN DEFAULT NULL,
  p_email_weekly BOOLEAN DEFAULT NULL,
  p_email_marketing BOOLEAN DEFAULT NULL,
  p_push_enabled BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET preferences = jsonb_set(
    COALESCE(preferences, '{}'::jsonb),
    '{notifications}',
    (COALESCE(preferences->'notifications', '{}'::jsonb) || 
     jsonb_strip_nulls(jsonb_build_object(
       'new_chapter', p_new_chapter,
       'partner_joined', p_partner_joined,
       'daily_intention', p_daily_intention,
       'weekly_highlights', p_weekly_highlights,
       'ai_reminder', p_ai_reminder,
       'email_new_chapter', p_email_new_chapter,
       'email_weekly', p_email_weekly,
       'email_marketing', p_email_marketing,
       'push_notifications', p_push_enabled
     )))
  ),
  preferences_updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Specify full signature to avoid "ambiguous function" error during GRANT
GRANT EXECUTE ON FUNCTION public.update_notification_preferences(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;

-- Create function for updating security preferences
CREATE OR REPLACE FUNCTION public.update_security_preferences(
  p_user_id UUID,
  p_session_timeout INTEGER DEFAULT NULL,
  p_auto_lock BOOLEAN DEFAULT NULL,
  p_two_factor_enabled BOOLEAN DEFAULT NULL,
  p_biometric_enabled BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET preferences = jsonb_set(
    COALESCE(preferences, '{}'::jsonb),
    '{security}',
    (COALESCE(preferences->'security', '{}'::jsonb) || 
     jsonb_strip_nulls(jsonb_build_object(
       'session_timeout', p_session_timeout,
       'auto_lock', p_auto_lock,
       'two_factor_enabled', p_two_factor_enabled,
       'biometric_enabled', p_biometric_enabled
     )))
  ),
  preferences_updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.update_security_preferences(UUID, INTEGER, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;

-- Create function for updating privacy preferences
CREATE OR REPLACE FUNCTION public.update_privacy_preferences(
  p_user_id UUID,
  p_show_online_status BOOLEAN DEFAULT NULL,
  p_allow_profile_visibility TEXT DEFAULT NULL,
  p_allow_story_sharing BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET preferences = jsonb_set(
    COALESCE(preferences, '{}'::jsonb),
    '{privacy}',
    (COALESCE(preferences->'privacy', '{}'::jsonb) || 
     jsonb_strip_nulls(jsonb_build_object(
       'show_online_status', p_show_online_status,
       'allow_profile_visibility', p_allow_profile_visibility,
       'allow_story_sharing', p_allow_story_sharing
     )))
  ),
  preferences_updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.update_privacy_preferences(UUID, BOOLEAN, TEXT, BOOLEAN) TO authenticated;

-- Update the profiles table to include phone column for 2FA
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN phone TEXT;
  END IF;
END
$$;

-- Create index on phone for 2FA lookup
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone) WHERE phone IS NOT NULL;

-- Add last_password_changed column for password history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_password_changed'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN last_password_changed TIMESTAMPTZ DEFAULT NOW();
  END IF;
END
$$;

-- Create trigger to update last_password_changed when auth.users is updated
CREATE OR REPLACE FUNCTION public.handle_password_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if encrypted_password was updated (password changed)
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
    UPDATE public.profiles
    SET last_password_changed = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_password_change ON auth.users;

-- Create trigger for password changes
DO $$
BEGIN
  CREATE TRIGGER on_auth_user_password_change
  AFTER UPDATE OF encrypted_password ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_password_change();
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create trigger on auth.users: %. This is expected on restricted Supabase environments.', SQLERRM;
END;
$$;
