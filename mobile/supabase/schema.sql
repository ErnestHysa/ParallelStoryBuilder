-- Create user_tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create token_transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('earned', 'spent')),
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  max_progress INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create achievements table (seed data)
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('writing', 'social', 'exploration', 'special')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_daily_activity table
CREATE TABLE IF NOT EXISTS user_daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activities INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create user_streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active DATE,
  daily_activities JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create function to get user streak
CREATE OR REPLACE FUNCTION get_user_streak(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER;
  last_activity DATE;
BEGIN
  -- Get last activity date
  SELECT date INTO last_activity
  FROM user_daily_activity
  WHERE user_id = get_user_streak.user_id
  ORDER BY date DESC
  LIMIT 1;

  IF last_activity IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate days since last activity
  streak_count := 0;
  WHILE last_activity >= CURRENT_DATE - streak_count LOOP
    -- Check if user was active on this date
    IF EXISTS (
      SELECT 1 FROM user_daily_activity
      WHERE user_id = get_user_streak.user_id
      AND date = (CURRENT_DATE - streak_count)
    ) THEN
      streak_count := streak_count + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN streak_count - 1; -- Subtract 1 because we started counting today
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tokens" ON user_tokens
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON token_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON token_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE user_daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own daily activity" ON user_daily_activity
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

-- Insert initial achievements
INSERT INTO achievements (id, title, description, icon, category, rarity, points) VALUES
('first_story', 'First Steps', 'Write your first story', '📝', 'writing', 'common', 10),
('prolific_writer', 'Prolific Writer', 'Write 10 stories', '✍️', 'writing', 'rare', 50),
('word_master', 'Word Master', 'Write 10,000 words', '📚', 'writing', 'epic', 100),
('collaborator', 'Collaborator', 'Join 5 collaborative stories', '🤝', 'social', 'rare', 50),
('social_butterfly', 'Social Butterfly', 'Collaborate with 10 different users', '🦋', 'social', 'legendary', 200),
('explorer', 'Explorer', 'Read 50 different stories', '🔍', 'exploration', 'rare', 50),
('week_streak', 'Week Warrior', '7-day writing streak', '🔥', 'special', 'epic', 100),
('month_streak', 'Month Master', '30-day writing streak', '🔥🔥', 'special', 'legendary', 300);

-- Create triggers for timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_tokens_updated_at
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_user_daily_activity_updated_at
  BEFORE UPDATE ON user_daily_activity
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();