-- Comprehensive cleanup and fix for chapters table triggers
-- This addresses the "record 'old' has no field 'user_id'" error by explicitly
-- dropping and recreating all triggers and their associated functions.

-- 1. DROP ALL POTENTIALLY CONFLICTING TRIGGERS ON CHAPTERS
DROP TRIGGER IF EXISTS trg_writing_streak_update ON public.chapters;
DROP TRIGGER IF EXISTS trg_update_relationship_on_collaboration ON public.chapters;
DROP TRIGGER IF EXISTS trg_auto_convert_content ON public.chapters;

-- 2. ENSURE FUNCTIONS ARE UPDATED AND SECURE
-- Fix gamification system trigger function
CREATE OR REPLACE FUNCTION public.trigger_writing_streak_update()
RETURNS TRIGGER AS $$
BEGIN
  -- chapters table uses author_id, NOT user_id
  PERFORM public.update_writing_streak(NEW.author_id);

  IF TG_OP = 'INSERT' THEN
    PERFORM public.check_and_unlock_achievements(NEW.author_id, 'chapters_written', 1);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only check words if content changed
    IF OLD.content IS DISTINCT FROM NEW.content THEN
      DECLARE
        v_old_words INTEGER;
        v_new_words INTEGER;
        v_diff INTEGER;
      BEGIN
        -- Improved word count using regex to avoid issues with extra spaces/nulls
        v_old_words := array_length(regexp_split_to_array(COALESCE(OLD.content, ''), '\s+'), 1);
        v_new_words := array_length(regexp_split_to_array(COALESCE(NEW.content, ''), '\s+'), 1);
        v_diff := COALESCE(v_new_words, 0) - COALESCE(v_old_words, 0);
        
        IF v_diff > 0 THEN
          PERFORM public.check_and_unlock_achievements(NEW.author_id, 'total_words', v_diff);
        END IF;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix relationship system trigger function
CREATE OR REPLACE FUNCTION public.update_relationship_on_collaboration()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id UUID;
BEGIN
    -- chapters table uses author_id, NOT user_id. OLD record is not used to avoids errors during INSERTS.
    
    -- Find the other member in the story to update the relationship connection
    SELECT user_id INTO v_partner_id
    FROM public.story_members
    WHERE story_id = NEW.story_id
    AND user_id != NEW.author_id
    LIMIT 1;

    -- Update relationship if a partner exists
    IF v_partner_id IS NOT NULL THEN
        INSERT INTO public.relationships (
            user_1,
            user_2,
            connection_score,
            last_activity,
            status
        ) VALUES (
            LEAST(NEW.author_id, v_partner_id),
            GREATEST(NEW.author_id, v_partner_id),
            1, -- Initial connection score
            NOW(),
            'accepted' -- Auto-accepted for collaborators
        )
        ON CONFLICT (user_1, user_2)
        DO UPDATE SET
            connection_score = LEAST(relationships.connection_score + 1, 100),
            last_activity = NOW(),
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RE-APPLY ALL TRIGGERS
CREATE TRIGGER trg_writing_streak_update
  AFTER INSERT OR UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_writing_streak_update();

CREATE TRIGGER trg_update_relationship_on_collaboration
  AFTER INSERT OR UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_relationship_on_collaboration();

-- Restore the content conversion trigger if it was defined previously
CREATE TRIGGER trg_auto_convert_content
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content AND OLD.content_rich IS NULL)
  EXECUTE FUNCTION public.auto_convert_content();
