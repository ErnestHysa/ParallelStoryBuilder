-- ========================================
-- FIX: Partner Names Showing as "Unknown"
-- ========================================
-- Run this in your Supabase SQL Editor to fix the RLS policy
-- that prevents partner profile data from being loaded.

-- Step 1: Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Step 2: Create the new permissive policy
CREATE POLICY "Users can view own and story members' profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR id IN (
      SELECT user_id
      FROM story_members
      WHERE story_id IN (
        SELECT story_id
        FROM story_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Step 3: Verify the policy is created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- ========================================
-- After running this, refresh your app to see partner names
-- ========================================