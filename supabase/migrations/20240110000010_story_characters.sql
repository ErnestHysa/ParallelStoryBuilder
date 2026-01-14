-- Story Characters system for maintaining AI character consistency
-- Creates story_characters table with detailed character attributes and relationships

-- Create story_characters table
CREATE TABLE IF NOT EXISTS public.story_characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NULL,
  personality JSONB NULL DEFAULT '{}'::jsonb, -- Character personality traits
  appearance JSONB NULL DEFAULT '{}'::jsonb, -- Visual description
  background JSONB NULL DEFAULT '{}'::jsonb, -- Character backstory
  relationships JSONB NULL DEFAULT '{}'::jsonb, -- Relationships with other characters
  voice JSONB NULL DEFAULT '{}'::jsonb, -- Speaking style, mannerisms
  goals JSONB NULL DEFAULT '{}'::jsonb, -- Character motivations and goals
  fears JSONB NULL DEFAULT '{}'::jsonb, -- Character fears and insecurities
  current_mood TEXT NULL DEFAULT 'neutral', -- Current emotional state
  role TEXT NOT NULL DEFAULT 'main', -- main, supporting, minor, antagonist
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_protagonist BOOLEAN DEFAULT FALSE,
  is_antagonist BOOLEAN DEFAULT FALSE,
  age INTEGER NULL, -- NULL if unknown or ageless
  gender TEXT NULL, -- male, female, non-binary, other, NULL if unknown
  species TEXT NULL, -- human, alien, robot, magical being, etc.
  occupation TEXT NULL,
  location JSONB NULL DEFAULT '{}'::jsonb, -- Where the character is typically found
  abilities JSONB NULL DEFAULT '[]'::jsonb, -- Special skills or powers
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (story_id, name)
);

-- Create character_versions table for tracking changes
CREATE TABLE IF NOT EXISTS public.character_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.story_characters(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT NULL,
  personality JSONB NULL DEFAULT '{}'::jsonb,
  appearance JSONB NULL DEFAULT '{}'::jsonb,
  background JSONB NULL DEFAULT '{}'::jsonb,
  relationships JSONB NULL DEFAULT '{}'::jsonb,
  voice JSONB NULL DEFAULT '{}'::jsonb,
  goals JSONB NULL DEFAULT '{}'::jsonb,
  fears JSONB NULL DEFAULT '{}'::jsonb,
  changes TEXT NULL, -- Description of what changed in this version
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create character_appearance table for storing visual references
CREATE TABLE IF NOT EXISTS public.character_appearance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.story_characters(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'description', 'reference')),
  reference TEXT NOT NULL, -- URL for images, text for descriptions
  caption TEXT NULL,
  position INTEGER NOT NULL DEFAULT 0, -- Order for multiple references
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create character_relationships table for explicit relationships
CREATE TABLE IF NOT EXISTS public.character_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.story_characters(id) ON DELETE CASCADE,
  related_character_id UUID NOT NULL REFERENCES public.story_characters(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'parent',
    'child',
    'sibling',
    'spouse',
    'romantic',
    'friend',
    'enemy',
    'mentor',
    'rival',
    'colleague',
    'ally',
    'neutral'
  )),
  description TEXT NULL,
  strength INTEGER DEFAULT 5 CHECK (strength >= 1 AND strength <= 10), -- Relationship strength
  is_reciprocal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_story_characters_story_id ON public.story_characters(story_id);
CREATE INDEX IF NOT EXISTS idx_story_characters_role ON public.story_characters(role);
CREATE INDEX IF NOT EXISTS idx_story_characters_is_ai_generated ON public.story_characters(is_ai_generated);
CREATE INDEX IF NOT EXISTS idx_character_versions_character_id ON public.character_versions(character_id);
CREATE INDEX IF NOT EXISTS idx_character_appearance_character_id ON public.character_appearance(character_id);
CREATE INDEX IF NOT EXISTS idx_character_relationships_character_id ON public.character_relationships(character_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_character_appearance_primary
ON public.character_appearance(character_id)
WHERE is_primary = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_character_relationships_unique
ON public.character_relationships(character_id, related_character_id, relationship_type);

-- Function to create or update a character
CREATE OR REPLACE FUNCTION public.create_or_update_character(
  p_story_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_personality JSONB DEFAULT '{}'::jsonb,
  p_appearance JSONB DEFAULT '{}'::jsonb,
  p_background JSONB DEFAULT '{}'::jsonb,
  p_voice JSONB DEFAULT '{}'::jsonb,
  p_goals JSONB DEFAULT '{}'::jsonb,
  p_fears JSONB DEFAULT '{}'::jsonb,
  p_role TEXT DEFAULT 'main',
  p_is_ai_generated BOOLEAN DEFAULT FALSE,
  p_is_protagonist BOOLEAN DEFAULT FALSE,
  p_is_antagonist BOOLEAN DEFAULT FALSE,
  p_age INTEGER DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_species TEXT DEFAULT NULL,
  p_occupation TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS TABLE(character_id UUID, is_new BOOLEAN) AS $$
DECLARE
  v_character_id UUID;
  v_is_new BOOLEAN;
BEGIN
  -- Check if character already exists
  SELECT id INTO v_character_id
  FROM public.story_characters
  WHERE story_id = p_story_id AND name = p_name;

  IF v_character_id IS NOT NULL THEN
    -- Update existing character
    UPDATE public.story_characters
    SET
      description = p_description,
      personality = p_personality,
      appearance = p_appearance,
      background = p_background,
      voice = p_voice,
      goals = p_goals,
      fears = p_fears,
      role = p_role,
      is_ai_generated = p_is_ai_generated,
      is_protagonist = p_is_protagonist,
      is_antagonist = p_is_antagonist,
      age = p_age,
      gender = p_gender,
      species = p_species,
      occupation = p_occupation,
      updated_at = NOW()
    WHERE id = v_character_id;

    v_is_new := FALSE;

    -- Create version record
    INSERT INTO public.character_versions (
      character_id,
      version,
      name,
      description,
      personality,
      appearance,
      background,
      voice,
      goals,
      fears,
      changes
    )
    SELECT
      id,
      COALESCE(
        (SELECT MAX(version) + 1 FROM public.character_versions WHERE character_id = v_character_id),
        1
      ),
      name,
      description,
      personality,
      appearance,
      background,
      voice,
      goals,
      fears,
      'Character updated'
    FROM public.story_characters
    WHERE id = v_character_id;
  ELSE
    -- Create new character
    INSERT INTO public.story_characters (
      story_id,
      name,
      description,
      personality,
      appearance,
      background,
      voice,
      goals,
      fears,
      role,
      is_ai_generated,
      is_protagonist,
      is_antagonist,
      age,
      gender,
      species,
      occupation,
      created_by
    ) VALUES (
      p_story_id,
      p_name,
      p_description,
      p_personality,
      p_appearance,
      p_background,
      p_voice,
      p_goals,
      p_fears,
      p_role,
      p_is_ai_generated,
      p_is_protagonist,
      p_is_antagonist,
      p_age,
      p_gender,
      p_species,
      p_occupation,
      p_created_by
    )
    RETURNING id INTO v_character_id;

    v_is_new := TRUE;

    -- Create initial version record
    INSERT INTO public.character_versions (
      character_id,
      version,
      name,
      description,
      personality,
      appearance,
      background,
      voice,
      goals,
      fears,
      changes
    ) VALUES (
      v_character_id,
      1,
      p_name,
      p_description,
      p_personality,
      p_appearance,
      p_background,
      p_voice,
      p_goals,
      p_fears,
      'Initial character creation'
    );
  END IF;

  RETURN QUERY SELECT v_character_id, v_is_new;
END;
$$ LANGUAGE plpgsql;

-- Function to get character context for AI generation
CREATE OR REPLACE FUNCTION public.get_character_context(
  p_character_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_context JSONB;
BEGIN
  SELECT jsonb_build_object(
    'name', sc.name,
    'description', sc.description,
    'personality', sc.personality,
    'appearance', sc.appearance,
    'background', sc.background,
    'voice', sc.voice,
    'goals', sc.goals,
    'fears', sc.fears,
    'current_mood', sc.current_mood,
    'role', sc.role,
    'relationships', (
      SELECT jsonb_object_agg(
        cr.relationship_type,
        jsonb_build_object(
          'description', cr.description,
          'strength', cr.strength,
          'character_name', relc.name
        )
      )
      FROM public.character_relationships cr
      JOIN public.story_characters relc ON cr.related_character_id = relc.id
      WHERE cr.character_id = p_character_id
    )
  ) INTO v_context
  FROM public.story_characters sc
  WHERE sc.id = p_character_id;

  RETURN v_context;
END;
$$ LANGUAGE plpgsql;

-- Function to update character mood
CREATE OR REPLACE FUNCTION public.update_character_mood(
  p_character_id UUID,
  p_mood TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.story_characters
  SET current_mood = p_mood,
      updated_at = NOW()
  WHERE id = p_character_id;
END;
$$ LANGUAGE plpgsql;

-- Function to add character relationship
CREATE OR REPLACE FUNCTION public.add_character_relationship(
  p_character_id UUID,
  p_related_character_id UUID,
  p_relationship_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_strength INTEGER DEFAULT 5,
  p_is_reciprocal BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
BEGIN
  -- Add the relationship
  INSERT INTO public.character_relationships (
    character_id,
    related_character_id,
    relationship_type,
    description,
    strength,
    is_reciprocal
  ) VALUES (
    p_character_id,
    p_related_character_id,
    p_relationship_type,
    p_description,
    p_strength,
    p_is_reciprocal
  );

  -- If reciprocal, add the reverse relationship
  IF p_is_reciprocal THEN
    -- Determine reverse relationship type
    DECLARE
      v_reverse_type TEXT;
    BEGIN
      CASE p_relationship_type
        WHEN 'parent' THEN v_reverse_type := 'child';
        WHEN 'child' THEN v_reverse_type := 'parent';
        WHEN 'sibling' THEN v_reverse_type := 'sibling';
        WHEN 'spouse' THEN v_reverse_type := 'spouse';
        WHEN 'romantic' THEN v_reverse_type := 'romantic';
        WHEN 'friend' THEN v_reverse_type := 'friend';
        WHEN 'enemy' THEN v_reverse_type := 'enemy';
        WHEN 'mentor' THEN v_reverse_type := 'mentee';
        WHEN 'mentee' THEN v_reverse_type := 'mentor';
        WHEN 'rival' THEN v_reverse_type := 'rival';
        WHEN 'colleague' THEN v_reverse_type := 'colleague';
        WHEN 'ally' THEN v_reverse_type := 'ally';
        WHEN 'neutral' THEN v_reverse_type := 'neutral';
        ELSE v_reverse_type := 'neutral';
      END CASE;

      INSERT INTO public.character_relationships (
        character_id,
        related_character_id,
        relationship_type,
        description,
        strength,
        is_reciprocal
      ) VALUES (
        p_related_character_id,
        p_character_id,
        v_reverse_type,
        p_description,
        p_strength,
        FALSE  -- Already added above
      );
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for character summary
CREATE OR REPLACE VIEW public.characters_summary AS
SELECT
  sc.*,
  s.title as story_title,
  s.slug as story_slug,
  u.username as created_by_username,
  ca.reference as primary_appearance,
  COUNT(cr.id) as relationship_count,
  COUNT(DISTINCT CASE WHEN sc.role = 'main' THEN 1 END) OVER (PARTITION BY sc.story_id) as main_characters_count
FROM public.story_characters sc
JOIN public.stories s ON sc.story_id = s.id
LEFT JOIN public.profiles u ON sc.created_by = u.id
LEFT JOIN public.character_appearance ca
  ON sc.id = ca.character_id AND ca.is_primary = TRUE
LEFT JOIN public.character_relationships cr ON sc.id = cr.character_id
GROUP BY sc.id, s.title, s.slug, u.username, ca.reference;

-- Create view for characters by story
CREATE OR REPLACE VIEW public.story_characters_expanded AS
SELECT
  sc.*,
  s.title as story_title,
  s.visibility as story_visibility,
  u.username as created_by_username,
  (SELECT COUNT(*) FROM public.character_relationships WHERE character_id = sc.id) as relationship_count,
  (SELECT array_agg(cr.relationship_type)
   FROM public.character_relationships cr
   WHERE cr.character_id = sc.id) as relationship_types,
  (SELECT jsonb_agg(
    jsonb_build_object(
      'name', relc.name,
      'type', cr.relationship_type,
      'strength', cr.strength
    )
  )
  FROM public.character_relationships cr
  JOIN public.story_characters relc ON cr.related_character_id = relc.id
  WHERE cr.character_id = sc.id) as relationships_details
FROM public.story_characters sc
JOIN public.stories s ON sc.story_id = s.id
LEFT JOIN public.profiles u ON sc.created_by = u.id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.story_characters TO authenticated;
GRANT SELECT, INSERT ON public.character_versions TO authenticated;
GRANT SELECT, INSERT ON public.character_appearance TO authenticated;
GRANT SELECT, INSERT ON public.character_relationships TO authenticated;
GRANT SELECT ON public.characters_summary TO authenticated;
GRANT SELECT ON public.story_characters_expanded TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_or_update_character TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_character_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_character_mood TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_character_relationship TO authenticated;