-- Relationships system for connecting users based on shared interests
-- Creates relationships, daily_intentions tables and trigger for auto-creation

-- Create relationships table
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connection_score INTEGER NOT NULL DEFAULT 0 CHECK (connection_score >= 0 AND connection_score <= 100),
  relationship_type TEXT NOT NULL DEFAULT 'peer' CHECK (relationship_type IN ('peer', 'mentor', 'friend', 'collaborator')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_1, user_2)
);

-- Create daily_intentions table
CREATE TABLE IF NOT EXISTS public.daily_intentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intention_date DATE NOT NULL UNIQUE,
  writing_goal INTEGER DEFAULT 500 CHECK (writing_goal > 0),
  reading_goal INTEGER DEFAULT 3 CHECK (reading_goal > 0),
  collaboration_goal INTEGER DEFAULT 1 CHECK (collaboration_goal > 0),
  mood_score INTEGER DEFAULT 0 CHECK (mood_score >= 0 AND mood_score <= 10),
  energy_level INTEGER DEFAULT 0 CHECK (energy_level >= 0 AND energy_level <= 10),
  notes TEXT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_relationships_user_1 ON public.relationships(user_1);
CREATE INDEX IF NOT EXISTS idx_relationships_user_2 ON public.relationships(user_2);
CREATE INDEX IF NOT EXISTS idx_relationships_status ON public.relationships(status);
CREATE INDEX IF NOT EXISTS idx_relationships_score ON public.relationships(connection_score);
CREATE INDEX IF NOT EXISTS idx_daily_intentions_user_id ON public.daily_intentions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_intentions_date ON public.daily_intentions(intention_date);

-- Function to create or update daily intention
CREATE OR REPLACE FUNCTION public.set_daily_intention(
  p_user_id UUID,
  p_intention_date DATE,
  p_writing_goal INTEGER DEFAULT 500,
  p_reading_goal INTEGER DEFAULT 3,
  p_collaboration_goal INTEGER DEFAULT 1,
  p_mood_score INTEGER DEFAULT 0,
  p_energy_level INTEGER DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.daily_intentions (
    user_id,
    intention_date,
    writing_goal,
    reading_goal,
    collaboration_goal,
    mood_score,
    energy_level,
    notes
  ) VALUES (
    p_user_id,
    p_intention_date,
    p_writing_goal,
    p_reading_goal,
    p_collaboration_goal,
    p_mood_score,
    p_energy_level,
    p_notes
  )
  ON CONFLICT (user_id, intention_date)
  DO UPDATE SET
    writing_goal = EXCLUDED.writing_goal,
    reading_goal = EXCLUDED.reading_goal,
    collaboration_goal = EXCLUDED.collaboration_goal,
    mood_score = EXCLUDED.mood_score,
    energy_level = EXCLUDED.energy_level,
    notes = EXCLUDED.notes,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get relationship score between two users
CREATE OR REPLACE FUNCTION public.get_connection_score(
  p_user_1_id UUID,
  p_user_2_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_story_count INTEGER;
  v_chapter_count INTEGER;
  v_common_tags INTEGER[];
  v_similarity_score INTEGER;
BEGIN
  -- Count shared stories
  SELECT COUNT(*) INTO v_story_count
  FROM public.story_members sp1
  JOIN public.story_members sp2 ON sp1.story_id = sp2.story_id
  WHERE sp1.user_id = p_user_1_id AND sp2.user_id = p_user_2_id;

  -- Alternative for chapter contributions (using author_id from chapters)
  SELECT COUNT(*) INTO v_chapter_count
  FROM public.chapters c
  WHERE c.author_id = p_user_1_id 
    AND c.story_id IN (SELECT story_id FROM public.story_members WHERE user_id = p_user_2_id);

  -- Base score calculation
  v_score := v_story_count * 10 +
             v_chapter_count * 5 +
             LEAST(v_story_count + v_chapter_count, 30); -- Bonus for frequent collaboration

  -- Cap at 100
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create relationship when both users join a story
CREATE OR REPLACE FUNCTION public.create_relationship_on_story_join()
RETURNS TRIGGER AS $$
DECLARE
  v_user_1 UUID;
  v_user_2 UUID;
BEGIN
  -- Get the two users who joined the story
  SELECT
    CASE WHEN sp.user_id = NEW.user_id THEN ss.created_by ELSE NEW.user_id END,
    CASE WHEN sp.user_id = NEW.user_id THEN NEW.user_id ELSE ss.created_by END
  INTO v_user_1, v_user_2
  FROM public.story_members sp
  JOIN public.stories ss ON sp.story_id = ss.id
  WHERE sp.story_id = NEW.story_id AND sp.user_id = NEW.user_id;

  -- Check if relationship already exists
  IF NOT EXISTS (
    SELECT 1 FROM public.relationships
    WHERE (user_1 = v_user_1 AND user_2 = v_user_2)
       OR (user_1 = v_user_2 AND user_2 = v_user_1)
  ) THEN
    -- Create new relationship with initial score based on connection
    INSERT INTO public.relationships (
      user_1,
      user_2,
      connection_score,
      relationship_type,
      status,
      last_activity
    ) VALUES (
      v_user_1,
      v_user_2,
      public.get_connection_score(v_user_1, v_user_2),
      'peer',
      'pending',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update relationship when users collaborate on chapters
CREATE OR REPLACE FUNCTION public.update_relationship_on_collaboration()
RETURNS TRIGGER AS $$
BEGIN
  -- Update relationship score and last activity
  INSERT INTO public.relationships (
    user_1,
    user_2,
    connection_score,
    last_activity
  ) VALUES (
    COALESCE(OLD.user_id, NEW.user_id),
    COALESCE(NEW.user_id, OLD.user_id),
    LEAST(
      (
        SELECT connection_score
        FROM public.relationships
        WHERE (user_1 = COALESCE(OLD.user_id, NEW.user_id) AND user_2 = COALESCE(NEW.user_id, OLD.user_id))
           OR (user_1 = COALESCE(NEW.user_id, OLD.user_id) AND user_2 = COALESCE(OLD.user_id, NEW.user_id))
      ) + 1, 100
    ),
    NOW()
  )
  ON CONFLICT (user_1, user_2)
  DO UPDATE SET
    connection_score = LEAST(relationships.connection_score + 1, 100),
    last_activity = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER trg_create_relationship_on_story_join
AFTER INSERT ON public.story_members
FOR EACH ROW
EXECUTE FUNCTION public.create_relationship_on_story_join();

CREATE TRIGGER trg_update_relationship_on_collaboration
AFTER INSERT OR UPDATE ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_relationship_on_collaboration();

-- Create view for active relationships
CREATE OR REPLACE VIEW public.active_relationships AS
SELECT r.*,
       p1.display_name as user_1_name,
       p1.avatar_url as user_1_avatar,
       p2.display_name as user_2_name,
       p2.avatar_url as user_2_avatar
FROM public.relationships r
JOIN public.profiles p1 ON r.user_1 = p1.id
JOIN public.profiles p2 ON r.user_2 = p2.id
WHERE r.status = 'accepted'
  AND r.last_activity > NOW() - INTERVAL '30 days'
ORDER BY r.connection_score DESC;

-- Create view for daily intentions dashboard
CREATE OR REPLACE VIEW public.daily_intentions_dashboard AS
SELECT di.*,
       p.display_name,
       p.avatar_url,
       CASE
         WHEN di.is_completed THEN 'completed'
         WHEN di.intention_date = CURRENT_DATE THEN 'today'
         WHEN di.intention_date < CURRENT_DATE AND NOT di.is_completed THEN 'overdue'
         ELSE 'upcoming'
       END as intention_status
FROM public.daily_intentions di
JOIN public.profiles p ON di.user_id = p.id
ORDER BY di.intention_date DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.relationships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.daily_intentions TO authenticated;
GRANT SELECT ON public.active_relationships TO authenticated;
GRANT SELECT ON public.daily_intentions_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_daily_intention TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_connection_score TO authenticated;