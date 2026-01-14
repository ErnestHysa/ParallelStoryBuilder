-- Gamification system with achievements, user achievements, and writing streaks
-- Creates achievement_definitions, user_achievements, writing_streaks tables with seeded achievements and triggers

-- Create achievement_definitions table
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('writing', 'collaboration', 'exploration', 'social', 'milestone')),
  condition_type TEXT NOT NULL CHECK (condition_type IN (
    'total_words',
    'chapters_written',
    'stories_joined',
    'relationships_formed',
    'consecutive_days',
    'tokens_spent',
    'stories_created',
    'chapters_read',
    'badges_earned'
  )),
  condition_value INTEGER NOT NULL CHECK (condition_value > 0),
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  color TEXT NOT NULL DEFAULT '#4ade80',
  unlocked_message TEXT NOT NULL,
  secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

-- Create writing_streaks table
CREATE TABLE IF NOT EXISTS public.writing_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_write_date DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Insert seeded achievements
INSERT INTO public.achievement_definitions (name, description, icon, category, condition_type, condition_value, rarity, points, color, unlocked_message) VALUES
-- Writing achievements
('First Words', 'Write your first chapter', '📝', 'writing', 'chapters_written', 1, 'common', 50, '#4ade80', 'Your journey begins!'),
('Wordsmith', 'Write 10,000 total words', '✍️', 'writing', 'total_words', 10000, 'common', 100, '#4ade80', 'You''re finding your voice!'),
('Storyteller', 'Write 50 chapters across different stories', '📖', 'writing', 'chapters_written', 50, 'rare', 250, '#3b82f6', 'A true storyteller emerges!'),
('Epic Tale', 'Write 100,000 total words', '🏆', 'writing', 'total_words', 100000, 'rare', 500, '#3b82f6', 'Crafting epics!'),
('Master Wordsmith', 'Write 1,000,000 total words', '🔥', 'epic', 'total_words', 1000000, 'epic', 1000, '#f59e0b', 'Words flow like water!'),
('Legendary Author', 'Write 10,000,000 total words', '👑', 'legendary', 'total_words', 10000000, 'legendary', 5000, '#dc2626', 'A literary legend is born!'),

-- Collaboration achievements
('Team Player', 'Join 5 different stories', '🤝', 'collaboration', 'stories_joined', 5, 'common', 50, '#4ade80', 'Ready to collaborate!'),
('Collaborator', 'Contribute to 20 chapters with others', '👥', 'collaboration', 'chapters_written', 20, 'common', 100, '#4ade80', 'Teamwork makes the dream work!'),
('Social Butterfly', 'Form 10 relationships', '🦋', 'social', 'relationships_formed', 10, 'rare', 250, '#3b82f6', 'Connecting with others!'),
('Mentor', 'Help 5 new users get started', '🧭', 'social', 'relationships_formed', 5, 'rare', 300, '#3b82f6', 'Guiding others on their journey!'),

-- Exploration achievements
('Explorer', 'Join 10 different genres', '🗺️', 'exploration', 'stories_joined', 10, 'common', 50, '#4ade80', 'Exploring new worlds!'),
('Genre Master', 'Try 50 different genres', '🎭', 'rare', 'stories_joined', 50, 'rare', 400, '#3b82f6', 'A master of all genres!'),

-- Milestone achievements
('First Day', 'Write for 7 consecutive days', '📅', 'milestone', 'consecutive_days', 7, 'common', 100, '#4ade80', 'Building a habit!'),
('Week Warrior', 'Write for 30 consecutive days', '🏃', 'milestone', 'consecutive_days', 30, 'rare', 300, '#3b82f6', 'Consistency champion!'),
('Marathon Writer', 'Write for 100 consecutive days', '🚀', 'epic', 'consecutive_days', 100, 'epic', 800, '#f59e0b', 'Unstoppable dedication!'),
('Ultra Marathon', 'Write for 365 consecutive days', '💪', 'legendary', 'consecutive_days', 365, 'legendary', 2000, '#dc2626', 'Writing legend!'),

-- Secret achievements
('Night Owl', 'Write between 2 AM and 5 AM', '🦉', 'milestone', 'secret', 1, 'epic', 600, '#f59e0b', 'Working the night shift!'),
('Speed Demon', 'Write 10,000 words in one session', '⚡', 'milestone', 'secret', 1, 'legendary', 1000, '#dc2626', 'Lightning fast!'),
('Perfectionist', 'Edit a chapter 50 times', '✨', 'milestone', 'secret', 1, 'rare', 400, '#3b82f6', 'Detail oriented!');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_category ON public.achievement_definitions(category);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_rarity ON public.achievement_definitions(rarity);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON public.user_achievements(is_unlocked, unlocked_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_writing_streaks_user_id ON public.writing_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_streaks_current_streak ON public.writing_streaks(current_streak);

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements(
  p_user_id UUID,
  p_condition_type TEXT,
  p_condition_value INTEGER
)
RETURNS TABLE(achievement_id UUID, achievement_name TEXT, points_earned INTEGER) AS $$
DECLARE
  v_achievement RECORD;
  v_progress INTEGER;
  v_new_progress INTEGER;
  v_points_earned INTEGER := 0;
BEGIN
  -- Find achievements of this type
  FOR v_achievement IN
    SELECT id, name, points
    FROM public.achievement_definitions
    WHERE condition_type = p_condition_type
      AND NOT EXISTS (
        SELECT 1 FROM public.user_achievements
        WHERE user_id = p_user_id AND achievement_id = id AND is_unlocked
      )
  LOOP
    -- Get current progress
    SELECT COALESCE(progress, 0) INTO v_progress
    FROM public.user_achievements
    WHERE user_id = p_user_id AND achievement_id = v_achievement.id;

    -- Calculate new progress
    v_new_progress := v_progress + p_condition_value;

    -- Update progress
    INSERT INTO public.user_achievements (user_id, achievement_id, progress)
    VALUES (p_user_id, v_achievement.id, v_new_progress)
    ON CONFLICT (user_id, achievement_id)
    DO UPDATE SET
      progress = user_achievements.progress + p_condition_value,
      updated_at = NOW();

    -- Check if achievement is unlocked
    IF v_new_progress >= v_achievement.condition_value THEN
      UPDATE public.user_achievements
      SET is_unlocked = TRUE,
          unlocked_at = NOW()
      WHERE user_id = p_user_id AND achievement_id = v_achievement.id;

      v_points_earned := v_points_earned + v_achievement.points;

      -- Return unlocked achievement
      RETURN QUERY SELECT v_achievement.id, v_achievement.name, v_achievement.points;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to update writing streak
CREATE OR REPLACE FUNCTION public.update_writing_streak(
  p_user_id UUID,
  p_write_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_write_date DATE;
BEGIN
  -- Get current streak data
  SELECT current_streak, longest_streak, last_write_date
  INTO v_current_streak, v_longest_streak, v_last_write_date
  FROM public.writing_streaks
  WHERE user_id = p_user_id;

  IF v_last_write_date IS NULL THEN
    -- First write
    INSERT INTO public.writing_streaks (user_id, current_streak, longest_streak, last_write_date)
    VALUES (p_user_id, 1, 1, p_write_date)
    ON CONFLICT (user_id)
    DO UPDATE SET
      current_streak = 1,
      longest_streak = GREATEST(writing_streaks.longest_streak, 1),
      last_write_date = p_write_date,
      updated_at = NOW();
  ELSIF p_write_date = v_last_write_date THEN
    -- Same day, no change needed
    RETURN;
  ELSIF p_write_date = v_last_write_date + INTERVAL '1 day' THEN
    -- Consecutive day
    INSERT INTO public.writing_streaks (user_id, current_streak, longest_streak, last_write_date)
    VALUES (p_user_id, v_current_streak + 1, GREATEST(v_longest_streak, v_current_streak + 1), p_write_date)
    ON CONFLICT (user_id)
    DO UPDATE SET
      current_streak = writing_streaks.current_streak + 1,
      longest_streak = GREATEST(writing_streaks.longest_streak, writing_streaks.current_streak + 1),
      last_write_date = p_write_date,
      updated_at = NOW();
  ELSE
    -- Break in streak
    INSERT INTO public.writing_streaks (user_id, current_streak, longest_streak, last_write_date)
    VALUES (p_user_id, 1, GREATEST(v_longest_streak, 1), p_write_date)
    ON CONFLICT (user_id)
    DO UPDATE SET
      current_streak = 1,
      longest_streak = GREATEST(writing_streaks.longest_streak, 1),
      last_write_date = p_write_date,
      updated_at = NOW();
  END IF;

  -- Check for consecutive day achievements
  PERFORM public.check_and_unlock_achievements(p_user_id, 'consecutive_days', 1);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total user points
CREATE OR REPLACE FUNCTION public.calculate_user_points(
  p_user_id UUID
)
RETURNS INTEGER AS $$
BEGIN
  SELECT COALESCE(SUM(achievement_definitions.points), 0)
  INTO 1
  FROM public.user_achievements
  JOIN public.achievement_definitions ON user_achievements.achievement_id = achievement_definitions.id
  WHERE user_achievements.user_id = p_user_id
    AND user_achievements.is_unlocked;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update writing streak when chapters are created/updated
CREATE OR REPLACE FUNCTION public.trigger_writing_streak_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update writing streak for user
  PERFORM public.update_writing_streak(NEW.user_id);

  -- Check for achievements
  IF TG_OP = 'INSERT' THEN
    -- New chapter
    PERFORM public.check_and_unlock_achievements(NEW.user_id, 'chapters_written', 1);
  ELSIF TG_OP = 'UPDATE' AND OLD.content <> NEW.content THEN
    -- Chapter content updated
    -- Calculate word difference
    DECLARE
      v_old_word_count INTEGER;
      v_new_word_count INTEGER;
      v_word_difference INTEGER;
    BEGIN
      -- Simple word count (split by spaces)
      SELECT length(OLD.content) - length(replace(OLD.content, ' ', '')) INTO v_old_word_count;
      SELECT length(NEW.content) - length(replace(NEW.content, ' ', '')) INTO v_new_word_count;
      v_word_difference := v_new_word_count - v_old_word_count;

      IF v_word_difference > 0 THEN
        PERFORM public.check_and_unlock_achievements(NEW.user_id, 'total_words', v_word_difference);
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trg_writing_streak_update
AFTER INSERT OR UPDATE ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.trigger_writing_streak_update();

-- Create view for user achievements summary
CREATE OR REPLACE VIEW public.user_achievements_summary AS
SELECT ua.user_id,
       p.username,
       COUNT(ua.id) as total_achievements,
       COUNT(CASE WHEN ua.is_unlocked THEN 1 END) as unlocked_achievements,
       SUM(ad.points) as total_points,
       MAX(ua.unlocked_at) as last_unlocked_at,
       (SELECT COUNT(*) FROM public.achievement_definitions) as total_available_achievements
FROM public.user_achievements ua
JOIN public.profiles p ON ua.user_id = p.id
JOIN public.achievement_definitions ad ON ua.achievement_id = ad.id
GROUP BY ua.user_id, p.username;

-- Create view for leaderboard
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT p.id,
       p.username,
       p.avatar_url,
       COALESCE(usa.total_points, 0) as total_points,
       COALESCE(usa.unlocked_achievements, 0) as achievements_count,
       COALESCE(ws.current_streak, 0) as current_streak,
       COALESCE(ws.longest_streak, 0) as longest_streak
FROM public.profiles p
LEFT JOIN public.user_achievements_summary usa ON p.id = usa.user_id
LEFT JOIN public.writing_streaks ws ON p.id = ws.user_id
WHERE p.created_at < NOW() - INTERVAL '7 days'  -- Exclude very new users
ORDER BY usa.total_points DESC NULLS LAST,
          usa.unlocked_achievements DESC NULLS LAST,
          ws.longest_streak DESC NULLS LAST,
          p.created_at ASC
LIMIT 100;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.achievement_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.writing_streaks TO authenticated;
GRANT SELECT ON public.user_achievements_summary TO authenticated;
GRANT SELECT ON public.leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_unlock_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_writing_streak TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_user_points TO authenticated;