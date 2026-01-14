-- Fix ambiguous column references in check_and_unlock_achievements function
-- Issues: user_id and achievement_id are ambiguous because they exist as both
-- table columns and potentially in function scope. We must qualify all column
-- references and rename return columns to avoid conflicts.

CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(
  p_user_id UUID,
  p_condition_type TEXT,
  p_condition_value INTEGER
)
RETURNS TABLE(unlocked_achievement_id UUID, unlocked_achievement_name TEXT, unlocked_points INTEGER) AS $$
DECLARE
  v_achievement RECORD;
  v_progress INTEGER;
  v_new_progress INTEGER;
BEGIN
  -- Find achievements of this type
  FOR v_achievement IN
    SELECT id, name, points, condition_value
    FROM public.achievement_definitions
    WHERE condition_type = p_condition_type
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = achievement_definitions.id AND ua.is_unlocked
      )
  LOOP
    -- Get current progress
    SELECT COALESCE(ua.progress, 0) INTO v_progress
    FROM public.user_achievements ua
    WHERE ua.user_id = p_user_id AND ua.achievement_id = v_achievement.id;

    -- Calculate new progress
    v_new_progress := v_progress + p_condition_value;

    -- Update progress
    INSERT INTO public.user_achievements (user_id, achievement_id, progress)
    VALUES (p_user_id, v_achievement.id, v_new_progress)
    ON CONFLICT (user_id, achievement_id)
    DO UPDATE SET
      progress = excluded.progress,
      updated_at = NOW();

    -- Check if achievement is unlocked
    IF v_new_progress >= v_achievement.condition_value THEN
      UPDATE public.user_achievements ua
      SET is_unlocked = TRUE,
          unlocked_at = NOW()
      WHERE ua.user_id = p_user_id AND ua.achievement_id = v_achievement.id;

      -- Return unlocked achievement
      RETURN QUERY SELECT v_achievement.id, v_achievement.name, v_achievement.points;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;
