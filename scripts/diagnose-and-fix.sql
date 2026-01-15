-- ========================================
-- DIAGNOSIS AND FIX - Run step by step
-- ========================================

-- STEP 1: Check what policies actually exist
SELECT '=== CURRENT STORY_MEMBERS POLICIES ===' as info;
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'story_members'
ORDER BY policyname;

SELECT '=== CURRENT PROFILES POLICIES ===' as info;
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

SELECT '=== CURRENT STORIES POLICIES ===' as info;
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stories'
ORDER BY policyname;

-- STEP 2: Check if RLS is enabled
SELECT '=== RLS STATUS ===' as info;
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('stories', 'story_members', 'profiles')
ORDER BY tablename;

-- STEP 3: Check actual data in story_members
SELECT '=== STORY_MEMBERS DATA (should show 2 rows for Prague) ===' as info;
SELECT
  sm.story_id,
  s.title as story_title,
  sm.user_id,
  p.display_name,
  sm.role
FROM story_members sm
JOIN stories s ON s.id = sm.story_id
LEFT JOIN profiles p ON p.id = sm.user_id
WHERE s.title = 'Prague'
ORDER BY sm.joined_at;

-- STEP 4: Completely disable RLS on story_members (for testing)
-- This will definitively prove if RLS is the issue
ALTER TABLE story_members DISABLE ROW LEVEL SECURITY;

-- Note: To re-enable RLS later, run:
-- ALTER TABLE story_members ENABLE ROW LEVEL SECURITY;
