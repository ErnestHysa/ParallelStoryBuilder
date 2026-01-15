-- ========================================
-- COMPLETE FIX - Run all of this
-- ========================================

-- STEP 1: Drop the problematic old policy
DROP POLICY IF EXISTS "View story memberships" ON story_members;

-- STEP 2: Verify only the good policy remains
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'story_members' AND cmd = 'SELECT';

-- STEP 3: Add Ernest to story_members for Prague story
-- Replace 'ernest-email@example.com' with Ernest's actual email or user_id
INSERT INTO story_members (story_id, user_id, role, turn_order)
SELECT s.id, p.id, 'creator', 1
FROM stories s
JOIN profiles p ON p.email = 'ernest-email@example.com'  -- CHANGE THIS EMAIL
WHERE s.title = 'Prague'
ON CONFLICT (story_id, user_id) DO NOTHING;

-- OR if you know Ernest's user_id directly:
-- INSERT INTO story_members (story_id, user_id, role, turn_order)
-- VALUES ('prague-story-id', 'ernest-user-id', 'creator', 1)
-- ON CONFLICT (story_id, user_id) DO NOTHING;

-- STEP 4: Verify both users are now in story_members
SELECT
  s.title,
  sm.user_id,
  p.display_name,
  p.email,
  sm.role
FROM story_members sm
JOIN stories s ON s.id = sm.story_id
LEFT JOIN profiles p ON p.id = sm.user_id
WHERE s.title = 'Prague';

-- Expected result: 2 rows (Ernest as creator, Katie as partner)
