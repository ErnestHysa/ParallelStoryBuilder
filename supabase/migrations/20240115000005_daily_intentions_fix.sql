-- Daily Intentions Schema Fix
-- Aligns the daily_intentions table with the DailyIntentionCard component expectations
-- Adds intention text fields, streak tracking, and proper completion handling

-- Add new columns to daily_intentions table
DO $$
BEGIN
  -- Add intention column (the main text intention)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_intentions' AND column_name = 'intention'
  ) THEN
    ALTER TABLE public.daily_intentions
    ADD COLUMN intention TEXT;
  END IF;

  -- Add partner_intention column (shows partner's intention for same date)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_intentions' AND column_name = 'partner_intention'
  ) THEN
    ALTER TABLE public.daily_intentions
    ADD COLUMN partner_intention TEXT;
  END IF;

  -- Add completed_at column (timestamp when intention was marked complete)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_intentions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.daily_intentions
    ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  -- Add streak_count column (calculated consecutive day streak)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_intentions' AND column_name = 'streak_count'
  ) THEN
    ALTER TABLE public.daily_intentions
    ADD COLUMN streak_count INTEGER DEFAULT 0;
  END IF;
END
$$;

-- Drop old function if exists
DROP FUNCTION IF EXISTS public.set_daily_intention(UUID, DATE, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT);

-- Create new simplified function to set daily intention
CREATE OR REPLACE FUNCTION public.set_daily_intention(
  p_user_id UUID,
  p_intention TEXT
)
RETURNS UUID AS $$
DECLARE
  v_intention_id UUID;
  v_streak_count INTEGER := 0;
  v_last_completion DATE;
BEGIN
  -- Get the user's current streak count (from previous day if completed yesterday)
  SELECT COALESCE(streak_count, 0) INTO v_streak_count
  FROM public.daily_intentions
  WHERE user_id = p_user_id
    AND intention_date = CURRENT_DATE - INTERVAL '1 day'
    AND is_completed = true;

  -- Reset streak if no completion yesterday
  IF v_streak_count IS NULL THEN
    v_streak_count := 0;
  END IF;

  -- Insert or update the daily intention
  INSERT INTO public.daily_intentions (
    user_id,
    intention_date,
    intention,
    is_completed,
    streak_count,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    CURRENT_DATE,
    p_intention,
    false,
    v_streak_count,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, intention_date)
  DO UPDATE SET
    intention = EXCLUDED.intention,
    updated_at = NOW()
  RETURNING id INTO v_intention_id;

  RETURN v_intention_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to complete daily intention and update streak
CREATE OR REPLACE FUNCTION public.complete_daily_intention(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  streak_count INTEGER
) AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_yesterday_completed BOOLEAN := false;
BEGIN
  -- Check if yesterday was completed
  SELECT EXISTS(
    SELECT 1 FROM public.daily_intentions
    WHERE user_id = p_user_id
      AND intention_date = CURRENT_DATE - INTERVAL '1 day'
      AND is_completed = true
  ) INTO v_yesterday_completed;

  -- Get current streak count
  SELECT COALESCE(streak_count, 0) INTO v_current_streak
  FROM public.daily_intentions
  WHERE user_id = p_user_id
    AND intention_date = CURRENT_DATE;

  -- Update streak: increment if yesterday was completed, else reset to 1
  IF v_yesterday_completed THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    v_current_streak := 1;
  END IF;

  -- Update the daily intention as completed
  UPDATE public.daily_intentions
  SET
    is_completed = true,
    completed_at = NOW(),
    streak_count = v_current_streak,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND intention_date = CURRENT_DATE
  RETURNING
    daily_intentions.id,
    daily_intentions.streak_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get today's intention with partner's intention
CREATE OR REPLACE FUNCTION public.get_daily_intention_with_partner(
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  intention TEXT,
  partner_intention TEXT,
  streak_count INTEGER,
  completed BOOLEAN,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    di.id,
    di.intention,
    -- Get partner's intention if exists
    (
      SELECT di2.intention
      FROM public.daily_intentions di2
      JOIN public.story_members sm ON sm.story_id IN (
        SELECT story_id FROM public.story_members WHERE user_id = p_user_id
      )
      WHERE di2.user_id = sm.user_id
        AND di2.user_id != p_user_id
        AND di2.intention_date = di.intention_date
      LIMIT 1
    ) as partner_intention,
    COALESCE(di.streak_count, 0) as streak_count,
    COALESCE(di.is_completed, false) as completed,
    di.completed_at,
    di.created_at
  FROM public.daily_intentions di
  WHERE di.user_id = p_user_id
    AND di.intention_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's current streak
CREATE OR REPLACE FUNCTION public.get_user_streak(
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
BEGIN
  SELECT COALESCE(streak_count, 0) INTO v_streak
  FROM public.daily_intentions
  WHERE user_id = p_user_id
    AND intention_date = CURRENT_DATE;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.set_daily_intention(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_daily_intention(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_intention_with_partner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_streak(UUID) TO authenticated;

-- Update RLS policies for new columns
DROP POLICY IF EXISTS "Users can view own daily intentions" ON public.daily_intentions;
CREATE POLICY "Users can view own daily intentions"
  ON public.daily_intentions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily intentions" ON public.daily_intentions;
CREATE POLICY "Users can insert own daily intentions"
  ON public.daily_intentions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily intentions" ON public.daily_intentions;
CREATE POLICY "Users can update own daily intentions"
  ON public.daily_intentions
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own daily intentions" ON public.daily_intentions;
CREATE POLICY "Users can delete own daily intentions"
  ON public.daily_intentions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Partners can view each other's daily intentions
DROP POLICY IF EXISTS "Partners can view daily intentions" ON public.daily_intentions;
CREATE POLICY "Partners can view daily intentions"
  ON public.daily_intentions
  FOR SELECT
  USING (
    user_id IN (
      SELECT sm.user_id
      FROM public.story_members sm
      WHERE sm.story_id IN (
        SELECT sm2.story_id
        FROM public.story_members sm2
        WHERE sm2.user_id = auth.uid()
      )
    )
  );
