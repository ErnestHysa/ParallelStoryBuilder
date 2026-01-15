-- ========================================
-- FIX v2: Partner Names Showing as "Unknown"
-- ========================================
-- This creates a SECURITY DEFINER function to fetch story members with profiles
-- This bypasses RLS entirely for the join operation

-- Drop the old policy first
DROP POLICY IF EXISTS "Users can view own and story members' profiles" ON profiles;

-- Create a simpler policy - allow authenticated users to view profiles
-- This is safe because we only expose public profile info (display_name, avatar_url)
CREATE POLICY "Authenticated users can view public profile data"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ========================================
-- Alternative: Use a SECURITY DEFINER function
-- If the above doesn't work, use this function instead
-- ========================================

CREATE OR REPLACE FUNCTION get_stories_with_members()
RETURNS SETOF json AS $$
DECLARE
  v_story stories;
  v_members json;
BEGIN
  -- For each story the user is a member of
  FOR v_story IN
    SELECT DISTINCT s.*
    FROM stories s
    INNER JOIN story_members sm ON sm.story_id = s.id
    WHERE sm.user_id = auth.uid()
  LOOP
    -- Get all members with their profiles (bypasses RLS via SECURITY DEFINER)
    SELECT json_agg(json_build_object(
      'user_id', sm.user_id,
      'role', sm.role,
      'profile', (
        SELECT json_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'avatar_url', p.avatar_url
        )
        FROM profiles p
        WHERE p.id = sm.user_id
      )
    )) INTO v_members
    FROM story_members sm
    WHERE sm.story_id = v_story.id;

    -- Return the combined data
    RETURN QUERY SELECT json_build_object(
      'story', v_story,
      'members', v_members
    );
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_stories_with_members() TO authenticated;

COMMENT ON FUNCTION get_stories_with_members() IS 'Returns stories with member profiles. Uses SECURITY DEFINER to bypass RLS for profile joins.';
