-- Fix infinite recursion in story_members policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can view story memberships" ON public.story_members;
DROP POLICY IF EXISTS "Story members can view stories" ON public.stories;
DROP POLICY IF EXISTS "Members can view story memberships" ON public.story_members; -- duplicate check

-- Create simplified non-recursive policy for story_members SELECT
-- Users should interpret "can see memberships" as "can see their own membership OR memberships of stories they are part of"
-- The recursion happens when "stories they are part of" checks story_members again.

-- Updated Policy: A user can view a row in story_members if:
-- 1. It is their own row (user_id = auth.uid()) -> They can see they are a member.
-- 2. It is a row for a story they CREATED (story exists where created_by = auth.uid())
-- 3. It is a row for a story where they are a member (this is recursive if not careful).

-- Fix: Use a DEFINER function to break recursion, OR simplify.
-- Let's use a cleaner approach:
-- Users can see all rows in story_members for ANY story ID that they are a member of.
-- To avoid recursion, we can just allow them to see rows where they are 'user_id' (their own membership).
-- AND rows for story_ids where they have a membership.
-- But the "have a membership" check is Select on story_members.

-- BREAK THE RECURSION using SECURITY DEFINER function or direct EXISTS on a different table (like stories created_by).
-- BUT simpler:
-- 1. Users can always see their own member rows.
-- 2. Users can see all member rows for stories they created.
-- 3. For partners, they need to see the other person.

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
-- SECURITY DEFINER is key here: it runs with owner privileges, bypassing RLS on story_members for this check.

-- 1. Story Members Policies
CREATE POLICY "View story memberships"
  ON public.story_members FOR SELECT
  USING (
    -- Can see own membership
    user_id = auth.uid() 
    OR 
    -- Can see memberships of stories created by self
    EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND created_by = auth.uid())
    OR
    -- Can see memberships if I am a member of that story (using secure function to avoid recursion)
    public.is_member_of_story(story_id)
  );

-- 2. Fix Stories Policy as well just in case
DROP POLICY IF EXISTS "Story members can view stories" ON public.stories;
CREATE POLICY "Story members can view stories"
  ON public.stories FOR SELECT
  USING (
    created_by = auth.uid()
    OR
    public.is_member_of_story(id)
  );
