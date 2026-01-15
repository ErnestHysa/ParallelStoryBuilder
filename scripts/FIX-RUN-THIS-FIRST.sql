-- ========================================
-- CRITICAL FIX: Run this in Supabase SQL Editor
-- ========================================
-- This fixes the issue where users can only see themselves in story_members

-- Step 1: Drop old restrictive policies
DROP POLICY IF EXISTS "Members can view story memberships" ON story_members;
DROP POLICY IF EXISTS "Users can join stories" ON story_members;
DROP POLICY IF EXISTS "Members can leave stories" ON story_members;
DROP POLICY IF EXISTS "Creator can update members" ON story_members;

-- Step 2: Create permissive policy - allows all authenticated users to see all story_members
CREATE POLICY "Authenticated users can view story_members"
  ON story_members FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 3: Same for INSERT (joining stories)
CREATE POLICY "Authenticated users can insert story_members"
  ON story_members FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Step 4: Fix profiles too (if not already done)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 5: Verify the fix
SELECT 'Current story_members policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'story_members';

SELECT 'Current profiles policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
