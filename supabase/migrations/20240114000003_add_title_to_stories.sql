-- Migration to add 'title' column to 'stories' table
-- This migration fixes the PGRST204 error where the 'title' column was missing in the schema but expected by the API.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stories' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.stories
    ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled Story';
    
    -- Optionally remove default constraint if you want it to be mandatory on insert without default
    ALTER TABLE public.stories ALTER COLUMN title DROP DEFAULT;
  END IF;
END $$;
