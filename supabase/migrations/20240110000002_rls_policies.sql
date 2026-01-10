-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but policy needed)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Stories policies
-- Authenticated users can create stories
CREATE POLICY "Authenticated users can create stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Story members can view stories they belong to
CREATE POLICY "Story members can view stories"
  ON stories FOR SELECT
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT story_id FROM story_members WHERE user_id = auth.uid()
    )
  );

-- Only story creator can update story metadata
CREATE POLICY "Story creator can update story"
  ON stories FOR UPDATE
  USING (created_by = auth.uid());

-- Only story creator can delete story
CREATE POLICY "Story creator can delete story"
  ON stories FOR DELETE
  USING (created_by = auth.uid());

-- Story members policies
-- Story members can view membership for stories they belong to
CREATE POLICY "Members can view story memberships"
  ON story_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR story_id IN (
      SELECT story_id FROM story_members WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can join stories (if not already member)
CREATE POLICY "Users can join stories"
  ON story_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM story_members
      WHERE story_id = story_members.story_id
      AND user_id = auth.uid()
    )
  );

-- Members can leave stories
CREATE POLICY "Members can leave stories"
  ON story_members FOR DELETE
  USING (auth.uid() = user_id);

-- Creator can update member roles
CREATE POLICY "Creator can update members"
  ON story_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_members.story_id
      AND stories.created_by = auth.uid()
    )
  );

-- Chapters policies
-- Story members can view chapters for their stories
CREATE POLICY "Story members can view chapters"
  ON chapters FOR SELECT
  USING (
    author_id = auth.uid()
    OR story_id IN (
      SELECT story_id FROM story_members WHERE user_id = auth.uid()
    )
  );

-- Story members can create chapters in their stories
CREATE POLICY "Story members can create chapters"
  ON chapters FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND story_id IN (
      SELECT story_id FROM story_members WHERE user_id = auth.uid()
    )
  );

-- Authors can update their own chapters
CREATE POLICY "Authors can update own chapters"
  ON chapters FOR UPDATE
  USING (auth.uid() = author_id);

-- Authors can delete their own chapters
CREATE POLICY "Authors can delete own chapters"
  ON chapters FOR DELETE
  USING (auth.uid() = author_id);

-- Inspirations policies
-- Story members can view inspirations for their stories
CREATE POLICY "Story members can view inspirations"
  ON inspirations FOR SELECT
  USING (
    user_id = auth.uid()
    OR story_id IN (
      SELECT story_id FROM story_members WHERE user_id = auth.uid()
    )
  );

-- Story members can create inspirations in their stories
CREATE POLICY "Story members can create inspirations"
  ON inspirations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND story_id IN (
      SELECT story_id FROM story_members WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own inspirations
CREATE POLICY "Users can delete own inspirations"
  ON inspirations FOR DELETE
  USING (auth.uid() = user_id);

-- Create helper function to check if user is story member
CREATE OR REPLACE FUNCTION is_story_member(story_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM story_members
    WHERE story_id = story_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is story creator
CREATE OR REPLACE FUNCTION is_story_creator(story_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM stories
    WHERE id = story_uuid
    AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to advance turn to next member
CREATE OR REPLACE FUNCTION advance_turn(story_uuid UUID)
RETURNS UUID AS $$
DECLARE
  current_order INTEGER;
  next_order INTEGER;
  next_user_id UUID;
  total_members INTEGER;
BEGIN
  -- Get current member's turn order
  SELECT turn_order INTO current_order
  FROM story_members
  WHERE story_id = story_uuid
  AND user_id = (SELECT current_turn FROM stories WHERE id = story_uuid);

  -- Get total number of members
  SELECT COUNT(*) INTO total_members
  FROM story_members
  WHERE story_id = story_uuid;

  -- Calculate next turn order (cycle back to 1 if at end)
  next_order := ((current_order % total_members) + 1);

  -- Get next user
  SELECT user_id INTO next_user_id
  FROM story_members
  WHERE story_id = story_uuid
  AND turn_order = next_order;

  -- Update story's current turn
  UPDATE stories
  SET current_turn = next_user_id
  WHERE id = story_uuid;

  RETURN next_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
