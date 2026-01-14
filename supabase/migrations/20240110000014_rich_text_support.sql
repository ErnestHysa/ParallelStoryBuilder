-- Rich text support for enhanced content editing
-- Adds content_rich JSONB, content_format, language columns to chapters
-- Adds language column to stories

-- First, check if columns exist to avoid errors on subsequent runs
DO $$
BEGIN
  -- Add columns to chapters table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chapters' AND column_name = 'content_rich'
  ) THEN
    ALTER TABLE public.chapters
    ADD COLUMN content_rich JSONB DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chapters' AND column_name = 'content_format'
  ) THEN
    ALTER TABLE public.chapters
    ADD COLUMN content_format TEXT DEFAULT 'html' CHECK (content_format IN ('html', 'markdown', 'plain'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chapters' AND column_name = 'language'
  ) THEN
    ALTER TABLE public.chapters
    ADD COLUMN language TEXT DEFAULT 'en';
  END IF;

  -- Add columns to stories table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'language'
  ) THEN
    ALTER TABLE public.stories
    ADD COLUMN language TEXT DEFAULT 'en';
  END IF;

  -- Add updated_at for content changes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chapters' AND column_name = 'content_updated_at'
  ) THEN
    ALTER TABLE public.chapters
    ADD COLUMN content_updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chapters_content_format ON public.chapters(content_format);
CREATE INDEX IF NOT EXISTS idx_chapters_language ON public.chapters(language);
CREATE INDEX IF NOT EXISTS idx_stories_language ON public.stories(language);

-- Create index for rich content search
CREATE INDEX IF NOT EXISTS idx_chapters_content_rich ON public.chapters USING GIN(content_rich);

-- Function to convert content to rich format
CREATE OR REPLACE FUNCTION public.convert_to_rich_content(
  p_content TEXT,
  p_source_format TEXT DEFAULT 'plain',
  p_target_format TEXT DEFAULT 'html'
)
RETURNS JSONB AS $$
BEGIN
  -- This is a simplified implementation
  -- In production, you would use proper markdown/HTML parsing libraries
  RETURN jsonb_build_object(
    'content', p_content,
    'format', p_target_format,
    'version', '1.0',
    'blocks', COALESCE(
      CASE p_source_format
        WHEN 'markdown' THEN
          -- Simple markdown to blocks conversion
          jsonb_build_array(
            jsonb_build_object(
              'type', 'paragraph',
              'text', p_content
            )
          )
        ELSE
          jsonb_build_array(
            jsonb_build_object(
              'type', 'paragraph',
              'text', p_content
            )
          )
      END,
      '[]'::jsonb
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update chapter content with rich text
CREATE OR REPLACE FUNCTION public.update_chapter_content(
  p_chapter_id UUID,
  p_content TEXT,
  p_format TEXT DEFAULT 'html',
  p_language TEXT DEFAULT 'en',
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.chapters
  SET
    content = p_content,
    content_rich = public.convert_to_rich_content(p_content, 'plain', p_format),
    content_format = p_format,
    language = p_language,
    updated_at = NOW(),
    content_updated_at = NOW(),
    updated_by = p_user_id
  WHERE id = p_chapter_id;
END;
$$ LANGUAGE plpgsql;

-- Function to merge rich content
CREATE OR REPLACE FUNCTION public.merge_rich_content(
  p_existing_content JSONB,
  p_new_content JSONB,
  p_merge_strategy TEXT DEFAULT 'append'
)
RETURNS JSONB AS $$
BEGIN
  CASE p_merge_strategy
    WHEN 'append' THEN
      RETURN jsonb_build_object(
        'content', p_existing_content->>'content' || ' ' || p_new_content->>'content',
        'format', p_new_content->>'format',
        'version', p_new_content->>'version',
        'blocks',
          CASE
            WHEN p_existing_content ? 'blocks' AND p_new_content ? 'blocks' THEN
              p_existing_content->'blocks' || p_new_content->'blocks'
            ELSE
              COALESCE(p_new_content->'blocks', '[]'::jsonb)
          END
      );
    WHEN 'replace' THEN
      RETURN p_new_content;
    WHEN 'smart_merge' THEN
      -- Simple smart merge - append new paragraph blocks
      RETURN jsonb_build_object(
        'content', p_existing_content->>'content',
        'format', p_existing_content->>'format',
        'version', COALESCE(p_existing_content->>'version', '1.0'),
        'blocks',
          COALESCE(p_existing_content->'blocks', '[]'::jsonb) ||
          COALESCE(p_new_content->'blocks', '[]'::jsonb)
      );
    ELSE
      RETURN p_existing_content;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to search rich content
CREATE OR REPLACE FUNCTION public.search_rich_content(
  p_search_text TEXT,
  p_language TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  content_preview TEXT,
  format TEXT,
  language TEXT,
  score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    LEFT(
      CASE
        WHEN c.content_rich ? 'content' THEN c.content_rich->>'content'
        ELSE c.content
      END,
      200
    ) as content_preview,
    COALESCE(c.content_format, 'plain') as format,
    c.language,
    -- Simple score based on search text appearance
    CASE
      WHEN c.content ILIKE '%' || p_search_text || '%' THEN 100
      WHEN c.content_rich ? 'content' AND c.content_rich->>'content' ILIKE '%' || p_search_text || '%' THEN 80
      WHEN c.title ILIKE '%' || p_search_text || '%' THEN 90
      ELSE 50
    END as score
  FROM public.chapters c
  WHERE (c.content ILIKE '%' || p_search_text || '%'
    OR (c.content_rich ? 'content' AND c.content_rich->>'content' ILIKE '%' || p_search_text || '%')
    OR c.title ILIKE '%' || p_search_text || '%')
    AND (p_language IS NULL OR c.language = p_language)
    ORDER BY score DESC, c.updated_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to get content statistics
CREATE OR REPLACE FUNCTION public.get_content_stats(
  p_chapter_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_word_count INTEGER;
  v_character_count INTEGER;
  v_paragraph_count INTEGER;
  v_reading_time REAL;
BEGIN
  -- Get content
  DECLARE
    v_content TEXT;
  BEGIN
    SELECT
      CASE
        WHEN content_rich ? 'content' THEN content_rich->>'content'
        ELSE content
      END
    INTO v_content
    FROM public.chapters
    WHERE id = p_chapter_id;

    -- Calculate statistics
    IF v_content IS NOT NULL AND v_content != '' THEN
      v_word_count := LENGTH(v_content) - LENGTH(REPLACE(v_content, ' ', '')) + 1;
      v_character_count := LENGTH(v_content);
      v_paragraph_count := LENGTH(v_content) - LENGTH(REPLACE(v_content, CHR(10), '')) + 1;
      v_reading_time := v_word_count / 200.0; -- Average reading speed
    ELSE
      v_word_count := 0;
      v_character_count := 0;
      v_paragraph_count := 0;
      v_reading_time := 0;
    END IF;

    RETURN jsonb_build_object(
      'word_count', v_word_count,
      'character_count', v_character_count,
      'paragraph_count', v_paragraph_count,
      'reading_time_minutes', ROUND(v_reading_time, 1)
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old rich content versions (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_rich_content()
RETURNS TABLE(count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Update old chapters to keep only recent rich content
  UPDATE public.chapters
  SET content_rich = NULL
  WHERE content_updated_at < NOW() - INTERVAL '90 days'
    AND content_rich IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job for cleanup (runs daily at 4 AM)
SELECT cron.schedule('0 4 * * *', $$SELECT public.cleanup_old_rich_content()$$);

-- Create view for chapters with rich content details
CREATE OR REPLACE VIEW public.chapters_with_rich_content AS
SELECT
  c.*,
  s.language as story_language,
  CASE
    WHEN c.content_format = 'html' THEN 'HTML'
    WHEN c.content_format = 'markdown' THEN 'Markdown'
    WHEN c.content_format = 'plain' THEN 'Plain Text'
    ELSE 'Unknown'
  END as format_display,
  CASE
    WHEN c.content_rich ? 'blocks' THEN jsonb_array_length(c.content_rich->'blocks')
    ELSE 0
  END as block_count,
  public.get_content_stats(c.id) as content_stats,
  u.username as last_updated_by
FROM public.chapters c
JOIN public.stories s ON c.story_id = s.id
LEFT JOIN public.profiles u ON c.updated_by = u.id;

-- Create view for content by language
CREATE OR REPLACE VIEW public.content_by_language AS
SELECT
  c.language,
  COUNT(*) as chapter_count,
  COUNT(DISTINCT c.story_id) as story_count,
  COUNT(CASE WHEN c.is_published THEN 1 END) as published_chapters,
  COUNT(CASE WHEN c.is_draft THEN 1 END) as draft_chapters,
  AVG(public.get_content_stats(c.id)->>'word_count'::integer) as avg_words_per_chapter
FROM public.chapters c
GROUP BY c.language
ORDER BY chapter_count DESC;

-- Create view for content format distribution
CREATE OR REPLACE VIEW public.content_format_distribution AS
SELECT
  content_format,
  COUNT(*) as chapter_count,
  COUNT(DISTINCT story_id) as story_count,
  ROUND(
    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.chapters WHERE content_format IS NOT NULL)),
    2
  ) as percentage
FROM public.chapters
WHERE content_format IS NOT NULL
GROUP BY content_format
ORDER BY chapter_count DESC;

-- Create trigger to automatically convert plain content to rich format
CREATE OR REPLACE FUNCTION public.auto_convert_content()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content_format IS NULL OR OLD.content_format = 'plain' THEN
    NEW.content_rich := public.convert_to_rich_content(NEW.content, 'plain', 'html');
    NEW.content_format := 'html';
    NEW.content_updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER trg_auto_convert_content
BEFORE UPDATE ON public.chapters
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content AND OLD.content_rich IS NULL)
EXECUTE FUNCTION public.auto_convert_content();

-- Grant permissions
GRANT SELECT, UPDATE ON public.chapters TO authenticated;
GRANT SELECT ON public.stories TO authenticated;
GRANT SELECT ON public.chapters_with_rich_content TO authenticated;
GRANT SELECT ON public.content_by_language TO authenticated;
GRANT SELECT ON public.content_format_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_to_rich_content TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_chapter_content TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_rich_content TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_rich_content TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_rich_content TO authenticated;