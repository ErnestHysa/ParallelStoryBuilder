-- Fix recursion in chapters policy and improve security using SECURITY DEFINER functions

-- 1. Create a helper function to avoid recursion in policies
-- This function checks if the current user is a member of the given story.
-- It runs with SECURITY DEFINER to bypass RLS recursion on story_members.
CREATE OR REPLACE FUNCTION public.is_member_of_story(p_story_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.story_members 
    WHERE story_id = p_story_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix Chapters Policies using the safe function
DROP POLICY IF EXISTS "Story members can view chapters" ON public.chapters;
CREATE POLICY "Story members can view chapters"
  ON public.chapters FOR SELECT
  USING (
    author_id = auth.uid()
    OR 
    public.is_member_of_story(story_id)
  );

DROP POLICY IF EXISTS "Story members can create chapters" ON public.chapters;
CREATE POLICY "Story members can create chapters"
  ON public.chapters FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND 
    public.is_member_of_story(story_id)
  );

-- 3. Fix Inspirations Policies (likely has same issue)
DROP POLICY IF EXISTS "Story members can view inspirations" ON public.inspirations;
CREATE POLICY "Story members can view inspirations"
  ON public.inspirations FOR SELECT
  USING (
    user_id = auth.uid()
    OR 
    public.is_member_of_story(story_id)
  );

DROP POLICY IF EXISTS "Story members can create inspirations" ON public.inspirations;
CREATE POLICY "Story members can create inspirations"
  ON public.inspirations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND 
    public.is_member_of_story(story_id)
  );
