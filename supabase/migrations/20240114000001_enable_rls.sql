-- Enable RLS and add policies for unrestricted tables

-- 1. Presence
ALTER TABLE IF EXISTS public.presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Presence viewable by authenticated users" ON public.presence;
CREATE POLICY "Presence viewable by authenticated users" ON public.presence FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can manage own presence" ON public.presence;
CREATE POLICY "Users can manage own presence" ON public.presence FOR ALL USING (auth.uid() = user_id);

-- 2. Relationships
ALTER TABLE IF EXISTS public.relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own relationships" ON public.relationships;
CREATE POLICY "Users can view their own relationships" ON public.relationships FOR SELECT USING (auth.uid() = user_1 OR auth.uid() = user_2);
DROP POLICY IF EXISTS "Users can insert relationships" ON public.relationships;
CREATE POLICY "Users can insert relationships" ON public.relationships FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update their own relationships" ON public.relationships;
CREATE POLICY "Users can update their own relationships" ON public.relationships FOR UPDATE USING (auth.uid() = user_1 OR auth.uid() = user_2);

-- 3. Daily Intentions
ALTER TABLE IF EXISTS public.daily_intentions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own intentions" ON public.daily_intentions;
CREATE POLICY "Users can manage own intentions" ON public.daily_intentions FOR ALL USING (auth.uid() = user_id);

-- 4. Achievement Definitions
ALTER TABLE IF EXISTS public.achievement_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Achievements viewable by everyone" ON public.achievement_definitions;
CREATE POLICY "Achievements viewable by everyone" ON public.achievement_definitions FOR SELECT USING (true);

-- 5. User Achievements
ALTER TABLE IF EXISTS public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own achievements" ON public.user_achievements;
CREATE POLICY "Users can update own achievements" ON public.user_achievements FOR ALL USING (auth.uid() = user_id);

-- 6. Writing Streaks
ALTER TABLE IF EXISTS public.writing_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own streaks" ON public.writing_streaks;
CREATE POLICY "Users can manage own streaks" ON public.writing_streaks FOR ALL USING (auth.uid() = user_id);

-- 7. Chapter Media
ALTER TABLE IF EXISTS public.chapter_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Media viewable by everyone" ON public.chapter_media;
CREATE POLICY "Media viewable by everyone" ON public.chapter_media FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can upload media" ON public.chapter_media;
CREATE POLICY "Users can upload media" ON public.chapter_media FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update own media" ON public.chapter_media;
CREATE POLICY "Users can update own media" ON public.chapter_media FOR UPDATE USING (auth.uid() = user_id);

-- 8. Story Characters
ALTER TABLE IF EXISTS public.story_characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Characters viewable by everyone" ON public.story_characters;
CREATE POLICY "Characters viewable by everyone" ON public.story_characters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create characters" ON public.story_characters;
CREATE POLICY "Authenticated users can create characters" ON public.story_characters FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update characters they created" ON public.story_characters;
CREATE POLICY "Users can update characters they created" ON public.story_characters FOR UPDATE USING (auth.uid() = created_by OR created_by IS NULL);

-- 9. Character Versions
ALTER TABLE IF EXISTS public.character_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Character versions viewable by everyone" ON public.character_versions;
CREATE POLICY "Character versions viewable by everyone" ON public.character_versions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create versions" ON public.character_versions;
CREATE POLICY "Users can create versions" ON public.character_versions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10. Character Appearance
ALTER TABLE IF EXISTS public.character_appearance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Appearance viewable by everyone" ON public.character_appearance;
CREATE POLICY "Appearance viewable by everyone" ON public.character_appearance FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage appearance" ON public.character_appearance;
CREATE POLICY "Users can manage appearance" ON public.character_appearance FOR ALL USING (auth.role() = 'authenticated');

-- 11. Character Relationships
ALTER TABLE IF EXISTS public.character_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Character relationships viewable by everyone" ON public.character_relationships;
CREATE POLICY "Character relationships viewable by everyone" ON public.character_relationships FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage character relationships" ON public.character_relationships;
CREATE POLICY "Users can manage character relationships" ON public.character_relationships FOR ALL USING (auth.role() = 'authenticated');

-- 12. Push Tokens
ALTER TABLE IF EXISTS public.push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own push tokens" ON public.push_tokens;
CREATE POLICY "Users can manage own push tokens" ON public.push_tokens FOR ALL USING (auth.uid() = user_id);

-- 13. Notification Preferences
ALTER TABLE IF EXISTS public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);

-- 14. Analytics Events
ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert analytics" ON public.analytics_events;
CREATE POLICY "Users can insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics_events;
CREATE POLICY "Users can view own analytics" ON public.analytics_events FOR SELECT USING (auth.uid() = user_id);

-- 15. Analytics Sessions
ALTER TABLE IF EXISTS public.analytics_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.analytics_sessions;
CREATE POLICY "Users can manage own sessions" ON public.analytics_sessions FOR ALL USING (auth.uid() = user_id);
