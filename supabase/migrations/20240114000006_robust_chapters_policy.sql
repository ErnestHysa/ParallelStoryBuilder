-- Add creator check to chapters and inspirations policies to make them more robust
-- Also ensure is_member_of_story is working correctly

-- 1. Ensure we have a robust creator check function
-- Using the same parameter name 'story_uuid' as in previous migrations to avoid SQL error 42P13
CREATE OR REPLACE FUNCTION public.is_story_creator(story_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.stories 
    WHERE id = story_uuid 
    AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Chapters Policies
DROP POLICY IF EXISTS "Story members can create chapters" ON public.chapters;
CREATE POLICY "Story members can create chapters"
  ON public.chapters FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND (
      public.is_member_of_story(story_id)
      OR 
      public.is_story_creator(story_id)
    )
  );

DROP POLICY IF EXISTS "Story members can view chapters" ON public.chapters;
CREATE POLICY "Story members can view chapters"
  ON public.chapters FOR SELECT
  USING (
    author_id = auth.uid()
    OR 
    public.is_member_of_story(story_id)
    OR
    public.is_story_creator(story_id)
  );

-- 3. Update Inspirations Policies
DROP POLICY IF EXISTS "Story members can create inspirations" ON public.inspirations;
CREATE POLICY "Story members can create inspirations"
  ON public.inspirations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      public.is_member_of_story(story_id)
      OR 
      public.is_story_creator(story_id)
    )
  );

DROP POLICY IF EXISTS "Story members can view inspirations" ON public.inspirations;
CREATE POLICY "Story members can view inspirations"
  ON public.inspirations FOR SELECT
  USING (
    user_id = auth.uid()
    OR 
    public.is_member_of_story(story_id)
    OR
    public.is_story_creator(story_id)
  );
