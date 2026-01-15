-- ========================================
-- CORRECT FIX - Run this in Supabase SQL Editor
-- ========================================

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Authenticated users can view story_members" ON story_members;
DROP POLICY IF EXISTS "Members can view story memberships" ON story_members;

-- Create the CORRECT policy - using TRUE allows all authenticated users to see ALL rows
CREATE POLICY "Authenticated users can view story_members"
  ON story_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Same for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify the fix
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename IN ('story_members', 'profiles')
ORDER BY tablename;
