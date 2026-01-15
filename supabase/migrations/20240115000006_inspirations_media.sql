-- Add media support to inspirations table
-- Allows users to attach images, videos, and audio to their inspirations

-- Add media column (JSONB array) to inspirations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspirations' AND column_name = 'media'
  ) THEN
    ALTER TABLE public.inspirations
    ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
  END IF;
END
$$;

-- Add index on media for faster queries
CREATE INDEX IF NOT EXISTS idx_inspirations_media
  ON public.inspirations USING GIN (media);

-- Add comment for documentation
COMMENT ON COLUMN public.inspirations.media IS 'Array of media attachments (images, videos, audio) attached to the inspiration';
