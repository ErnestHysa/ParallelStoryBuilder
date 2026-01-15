-- Fix infinite recursion in story_members RLS policy
-- The old policy referenced story_members within its own condition

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Members can view story memberships" ON story_members;

-- Create a new policy that avoids recursion
-- Users can view their own memberships and memberships for stories they are members of
CREATE POLICY "Members can view story memberships"
  ON story_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM stories s
      WHERE s.id = story_members.story_id
      AND s.created_by = auth.uid()
    )
  );

-- Drop and recreate the INSERT policy to avoid recursion
DROP POLICY IF EXISTS "Users can join stories" ON story_members;

CREATE POLICY "Users can join stories"
  ON story_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      -- Check if already a member using a direct query without self-reference
      SELECT 1 FROM story_members sm
      WHERE sm.story_id = story_members.story_id
      AND sm.user_id = auth.uid()
      LIMIT 1
    )
  );
