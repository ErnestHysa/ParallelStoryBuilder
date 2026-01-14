-- Media system for storing and managing images, audio, and video
-- Creates chapter_media table with support for multiple media types

-- Create chapter_media table
CREATE TABLE IF NOT EXISTS public.chapter_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'audio', 'video', 'document')),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  dimensions JSONB NULL DEFAULT '{}'::jsonb, -- {width, height} for images, {duration} for audio/video
  caption TEXT NULL,
  alt_text TEXT NULL, -- For accessibility
  position INTEGER NOT NULL DEFAULT 0, -- Order within chapter
  is_featured BOOLEAN DEFAULT FALSE, -- Highlight this media
  metadata JSONB NULL DEFAULT '{}'::jsonb, -- Additional metadata
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processing', 'failed', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chapter_media_chapter_id ON public.chapter_media(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_media_user_id ON public.chapter_media(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_media_type ON public.chapter_media(media_type);
CREATE INDEX IF NOT EXISTS idx_chapter_media_status ON public.chapter_media(status);
CREATE INDEX IF NOT EXISTS idx_chapter_media_position ON public.chapter_media(chapter_id, position);
CREATE INDEX IF NOT EXISTS idx_chapter_media_created_at ON public.chapter_media(created_at);

-- Create unique constraint for featured media per chapter
CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_media_featured_unique
ON public.chapter_media(chapter_id)
WHERE is_featured = TRUE;

-- Function to add media to chapter
CREATE OR REPLACE FUNCTION public.add_chapter_media(
  p_chapter_id UUID,
  p_user_id UUID,
  p_media_type TEXT,
  p_storage_path TEXT,
  p_file_name TEXT,
  p_file_size BIGINT,
  p_mime_type TEXT,
  p_dimensions JSONB DEFAULT NULL,
  p_caption TEXT DEFAULT NULL,
  p_alt_text TEXT DEFAULT NULL,
  p_position INTEGER DEFAULT NULL
)
RETURNS TABLE(media_id UUID, public_url TEXT) AS $$
DECLARE
  v_position INTEGER;
  v_media_id UUID;
  v_public_url TEXT;
BEGIN
  -- Determine position
  IF p_position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
    FROM public.chapter_media
    WHERE chapter_id = p_chapter_id;
  ELSE
    v_position := p_position;
  END IF;

  -- Insert media record
  INSERT INTO public.chapter_media (
    chapter_id,
    user_id,
    media_type,
    storage_path,
    file_name,
    file_size,
    mime_type,
    dimensions,
    caption,
    alt_text,
    position
  ) VALUES (
    p_chapter_id,
    p_user_id,
    p_media_type,
    p_storage_path,
    p_file_name,
    p_file_size,
    p_mime_type,
    COALESCE(p_dimensions, '{}'::jsonb),
    p_caption,
    p_alt_text,
    v_position
  )
  RETURNING id INTO v_media_id;

  -- Generate public URL (this would typically be handled by your storage service)
  v_public_url := '/media/' || p_storage_path;

  -- Return the new media record
  RETURN QUERY SELECT v_media_id, v_public_url;
END;
$$ LANGUAGE plpgsql;

-- Function to update media position
CREATE OR REPLACE FUNCTION public.update_media_position(
  p_media_id UUID,
  p_new_position INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_chapter_id UUID;
  v_old_position INTEGER;
BEGIN
  -- Get chapter ID and old position
  SELECT chapter_id, position INTO v_chapter_id, v_old_position
  FROM public.chapter_media
  WHERE id = p_media_id;

  IF v_chapter_id IS NULL THEN
    RAISE EXCEPTION 'Media not found';
  END IF;

  -- Begin transaction
  BEGIN
    -- Shift positions to make room
    IF p_new_position > v_old_position THEN
      -- Moving forward - decrement positions after
      UPDATE public.chapter_media
      SET position = position - 1,
          updated_at = NOW()
      WHERE chapter_id = v_chapter_id
        AND position > v_old_position
        AND position <= p_new_position;
    ELSE
      -- Moving backward - increment positions before
      UPDATE public.chapter_media
      SET position = position + 1,
          updated_at = NOW()
      WHERE chapter_id = v_chapter_id
        AND position >= p_new_position
        AND position < v_old_position;
    END IF;

    -- Update the media position
    UPDATE public.chapter_media
    SET position = p_new_position,
        updated_at = NOW()
    WHERE id = p_media_id;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END;

  COMMIT;
END;
$$ LANGUAGE plpgsql;

-- Function to get chapter media stats
CREATE OR REPLACE FUNCTION public.get_chapter_media_stats(
  p_chapter_id UUID
)
RETURNS TABLE(
  total_media INTEGER,
  images INTEGER,
  audio INTEGER,
  video INTEGER,
  total_size BIGINT,
  featured_media_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_media,
    COUNT(CASE WHEN media_type = 'image' THEN 1 END)::INTEGER as images,
    COUNT(CASE WHEN media_type = 'audio' THEN 1 END)::INTEGER as audio,
    COUNT(CASE WHEN media_type = 'video' THEN 1 END)::INTEGER as video,
    COALESCE(SUM(file_size), 0)::BIGINT as total_size,
    (SELECT id FROM public.chapter_media
     WHERE chapter_id = p_chapter_id AND is_featured = TRUE
     LIMIT 1)::UUID as featured_media_id
  FROM public.chapter_media
  WHERE chapter_id = p_chapter_id AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to search media by text
CREATE OR REPLACE FUNCTION public.search_chapter_media(
  p_search_text TEXT,
  p_media_type TEXT DEFAULT NULL,
  p_chapter_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  chapter_id UUID,
  media_type TEXT,
  file_name TEXT,
  caption TEXT,
  alt_text TEXT,
  "position" INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.chapter_id,
    cm.media_type,
    cm.file_name,
    cm.caption,
    cm.alt_text,
    cm.position,
    cm.created_at
  FROM public.chapter_media cm
  WHERE cm.status = 'active'
    AND (cm.caption ILIKE '%' || p_search_text || '%'
      OR cm.alt_text ILIKE '%' || p_search_text || '%'
      OR cm.file_name ILIKE '%' || p_search_text || '%')
    AND (p_media_type IS NULL OR cm.media_type = p_media_type)
    AND (p_chapter_id IS NULL OR cm.chapter_id = p_chapter_id)
  ORDER BY cm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically clean up old media (older than 30 days) when there are more than 1000 items
CREATE OR REPLACE FUNCTION public.cleanup_old_media()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count media items
  SELECT COUNT(*) INTO v_count
  FROM public.chapter_media
  WHERE status = 'active';

  -- If over 1000 items, clean up oldest media
  IF v_count > 1000 THEN
    DELETE FROM public.chapter_media
    WHERE status = 'active'
      AND created_at < NOW() - INTERVAL '30 days'
      AND id IN (
        SELECT id
        FROM public.chapter_media
        WHERE status = 'active'
        ORDER BY created_at ASC
        LIMIT 100
      );
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply cleanup trigger
CREATE CONSTRAINT TRIGGER trg_cleanup_old_media
AFTER INSERT ON public.chapter_media
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_old_media();

-- Create view for chapter media with chapter and user info
CREATE OR REPLACE VIEW public.chapter_media_with_details AS
SELECT
  cm.*,
  c.chapter_number as chapter_number,
  c.content as chapter_content,
  s.id as story_id,
  s.theme as story_theme,
  u.display_name as display_name,
  u.avatar_url as user_avatar_url
FROM public.chapter_media cm
JOIN public.chapters c ON cm.chapter_id = c.id
JOIN public.stories s ON c.story_id = s.id
JOIN public.profiles u ON cm.user_id = u.id
WHERE cm.status = 'active';

-- Create view for featured media
CREATE OR REPLACE VIEW public.featured_media AS
SELECT cm.*
FROM public.chapter_media cm
JOIN public.chapters c ON cm.chapter_id = c.id
JOIN public.stories s ON c.story_id = s.id
WHERE cm.status = 'active'
  AND cm.is_featured = TRUE
  AND s.status = 'active'
ORDER BY cm.created_at DESC
LIMIT 100;

-- Function to generate media sitemap
CREATE OR REPLACE FUNCTION public.generate_media_sitemap()
RETURNS XML AS $$
DECLARE
  media_items XML;
BEGIN
  SELECT XMLAGG(
    XMLELEMENT(
      NAME url,
      XMLELEMENT(NAME loc, CONCAT('https://parallelstory.app/media/', cm.storage_path)),
      XMLELEMENT(NAME lastmod, TO_CHAR(cm.created_at, 'YYYY-MM-DD')),
      XMLELEMENT(NAME changefreq, 'monthly')
    )
  ) INTO media_items
  FROM public.chapter_media cm
  JOIN public.chapters c ON cm.chapter_id = c.id
  JOIN public.stories s ON c.story_id = s.id
  WHERE cm.status = 'active'
    AND s.status = 'active'
    AND cm.created_at > NOW() - INTERVAL '1 year';

  RETURN XMLELEMENT(
    NAME urlset,
    XMLATTRIBUTES('https://www.sitemaps.org/schemas/sitemap/0.9' AS "xmlns"),
    COALESCE(media_items, '')
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.chapter_media TO authenticated;
GRANT SELECT ON public.chapter_media_with_details TO authenticated;
GRANT SELECT ON public.featured_media TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_chapter_media TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_media_position TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chapter_media_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_chapter_media TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_media_sitemap TO authenticated;