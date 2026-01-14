-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('romance', 'fantasy', 'our_future')),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pairing_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  current_turn UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create story_members table
CREATE TABLE story_members (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'creator' CHECK (role IN ('creator', 'partner')),
  turn_order INTEGER CHECK (turn_order IN (1, 2)),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (story_id, user_id)
);

-- Create chapters table
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  ai_enhanced_content TEXT,
  context_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(story_id, chapter_number)
);

-- Create inspirations table
CREATE TABLE inspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_stories_created_by ON stories(created_by);
CREATE INDEX idx_stories_pairing_code ON stories(pairing_code);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_story_members_user_id ON story_members(user_id);
CREATE INDEX idx_chapters_story_id ON chapters(story_id);
CREATE INDEX idx_chapters_author_id ON chapters(author_id);
CREATE INDEX idx_inspirations_story_id ON inspirations(story_id);
CREATE INDEX idx_inspirations_user_id ON inspirations(user_id);

-- Create trigger function for auto-profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth user created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to check if it's user's turn
CREATE OR REPLACE FUNCTION is_user_turn(story_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_turn_user UUID;
  turn_count INTEGER;
BEGIN
  -- Get current turn user
  SELECT current_turn INTO current_turn_user
  FROM stories
  WHERE id = story_uuid;

  -- Check if user exists in story_members
  SELECT COUNT(*) INTO turn_count
  FROM story_members
  WHERE story_id = story_uuid AND user_id = user_uuid;

  -- Return true if it's the user's turn and they are a member
  RETURN (current_turn_user = user_uuid) AND (turn_count > 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

