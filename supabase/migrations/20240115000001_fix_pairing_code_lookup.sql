-- Fix pairing code lookup for joining stories
-- This creates a SECURITY DEFINER function that allows authenticated users
-- to look up stories by pairing_code for the purpose of joining

-- Create a security definer function for pairing code lookup
-- This function runs with the privileges of the function owner (postgres),
-- bypassing RLS restrictions for the lookup
CREATE OR REPLACE FUNCTION lookup_story_by_pairing_code(code TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  theme TEXT,
  created_by UUID,
  pairing_code TEXT,
  status TEXT,
  current_turn UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.title, s.theme, s.created_by, s.pairing_code, s.status, s.current_turn, s.created_at
  FROM stories s
  WHERE s.pairing_code = code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on the function to authenticated users
GRANT EXECUTE ON FUNCTION lookup_story_by_pairing_code(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION lookup_story_by_pairing_code IS 'Allows authenticated users to look up a story by its pairing code for joining. This is needed because RLS policies prevent users from seeing stories they are not yet members of.';
