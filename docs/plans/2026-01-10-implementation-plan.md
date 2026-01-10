# Parallel Story Builder - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a collaborative storytelling app for LDR couples with AI-assisted writing, turn-based chapters, and real-time sync.

**Architecture:** React Native (Expo) mobile app with Tamagui UI, Zustand state management, connected directly to Supabase for auth/database/real-time. Supabase Edge Functions handle AI calls to Gemini 2.0 Flash.

**Tech Stack:** React Native, Expo, Tamagui, Zustand, Supabase (PostgreSQL + Auth + Edge Functions), Google Gemini 2.0 Flash

---

## Task 1: Initialize Monorepo Structure

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `mobile/package.json`
- Create: `mobile/tsconfig.json`
- Create: `mobile/app.json`
- Create: `supabase/config.toml`
- Create: `.gitignore`

**Step 1: Create root package.json**

```json
{
  "name": "parallel-story-builder",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "mobile"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

**Step 2: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

**Step 3: Create mobile/package.json**

```json
{
  "name": "parallel-story-builder-mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint ."
  },
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-status-bar": "~1.12.0",
    "expo-secure-store": "~13.0.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-safe-area-context": "4.10.0",
    "react-native-screens": "~3.31.0",
    "@supabase/supabase-js": "^2.45.0",
    "zustand": "^4.5.0",
    "@tamagui/config": "^1.100.0",
    "tamagui": "^1.100.0",
    "@tamagui/extras": "^1.100.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.79",
    "typescript": "~5.3.3",
    "eslint": "^8.57.0",
    "eslint-config-expo": "^7.0.0"
  },
  "private": true
}
```

**Step 4: Create mobile/tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/stores/*": ["./stores/*"],
      "@/lib/*": ["./lib/*"],
      "@/assets/*": ["./assets/*"]
    }
  }
}
```

**Step 5: Create mobile/app.json**

```json
{
  "expo": {
    "name": "Parallel Story Builder",
    "slug": "parallel-story-builder",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#E91E63"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.parallelstorybuilder.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#E91E63"
      },
      "package": "com.parallelstorybuilder.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "scheme": "psb",
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**Step 6: Create supabase/config.toml**

```toml
project_id = "your-project-id-here"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320

[studio]
enabled = true
port = 54323

[ingest]
enabled = false

[storage]
enabled = true
file_size_limit = "5MiB"

[auth]
enabled = true
site_url = "http://localhost:8081"
additional_redirect_urls = ["exp://127.0.0.1:8081"]

[functions]
enabled = true
verify_jwt = true
```

**Step 7: Create .gitignore**

```
# Dependencies
node_modules/
.pnp/
.pnp.js

# Expo
.expo/
dist/
web-build/

# Native
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.ipa
*.apk

# Supabase
.supabase/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Turbo
.turbo/
```

**Step 8: Commit**

```bash
git add .
git commit -m "feat: initialize monorepo structure with mobile and supabase"
```

---

## Task 2: Set Up Supabase Database Schema

**Files:**
- Create: `supabase/migrations/20240110000001_initial_schema.sql`
- Create: `supabase/migrations/20240110000002_rls_policies.sql`

**Step 1: Create initial schema migration**

```sql
-- supabase/migrations/20240110000001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('romance', 'fantasy', 'our_future')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pairing_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story members table
CREATE TABLE IF NOT EXISTS public.story_members (
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator', 'partner')),
  turn_order INT CHECK (turn_order IN (1, 2)),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (story_id, user_id)
);

-- Chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  chapter_number INT NOT NULL,
  content TEXT NOT NULL,
  ai_enhanced_content TEXT,
  context_snippet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, chapter_number)
);

-- Inspirations table
CREATE TABLE IF NOT EXISTS public.inspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_created_by ON public.stories(created_by);
CREATE INDEX IF NOT EXISTS idx_stories_pairing_code ON public.stories(pairing_code);
CREATE INDEX IF NOT EXISTS idx_story_members_user_id ON public.story_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON public.chapters(story_id);
CREATE INDEX IF NOT EXISTS idx_inspirations_story_id ON public.inspirations(story_id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, SPLIT_PART(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if it's a user's turn
CREATE OR REPLACE FUNCTION public.is_user_turn(story_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_chapters INT;
  user_order INT;
BEGIN
  -- Get user's turn order
  SELECT turn_order INTO user_order
  FROM public.story_members
  WHERE story_id = story_uuid AND user_id = user_uuid;

  -- Count total chapters
  SELECT COUNT(*) INTO total_chapters
  FROM public.chapters
  WHERE story_id = story_uuid;

  -- If turn_order is 1, user writes on even chapters (0, 2, 4...)
  -- If turn_order is 2, user writes on odd chapters (1, 3, 5...)
  RETURN CASE
    WHEN user_order = 1 THEN total_chapters % 2 = 0
    WHEN user_order = 2 THEN total_chapters % 2 = 1
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 2: Create RLS policies migration**

```sql
-- supabase/migrations/20240110000002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspirations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Stories policies
CREATE POLICY "Members can view story"
  ON public.stories FOR SELECT
  USING (
    id IN (
      SELECT story_id FROM public.story_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creator can update story"
  ON public.stories FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Creator can delete story"
  ON public.stories FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "Authenticated can create story"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Story members policies
CREATE POLICY "Members can view story membership"
  ON public.story_members FOR SELECT
  USING (
    story_id IN (
      SELECT story_id FROM public.story_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated can join story"
  ON public.story_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Member can leave story"
  ON public.story_members FOR DELETE
  USING (user_id = auth.uid());

-- Chapters policies
CREATE POLICY "Members can view chapters"
  ON public.chapters FOR SELECT
  USING (
    story_id IN (
      SELECT story_id FROM public.story_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Member can create chapter when story is joined"
  ON public.chapters FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    story_id IN (
      SELECT story_id FROM public.story_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Author can update own chapter"
  ON public.chapters FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Author can delete own chapter"
  ON public.chapters FOR DELETE
  USING (author_id = auth.uid());

-- Inspirations policies
CREATE POLICY "Story members can view inspirations"
  ON public.inspirations FOR SELECT
  USING (
    story_id IN (
      SELECT story_id FROM public.story_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Story member can create inspiration"
  ON public.inspirations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    story_id IN (
      SELECT story_id FROM public.story_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Creator can delete own inspiration"
  ON public.inspirations FOR DELETE
  USING (user_id = auth.uid());
```

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: create database schema with RLS policies"
```

---

## Task 3: Set Up Supabase Client and Config

**Files:**
- Create: `mobile/lib/supabase.ts`
- Create: `mobile/lib/types.ts`
- Create: `mobile/.env.example`

**Step 1: Create Supabase client**

```typescript
// mobile/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { SecureStore } from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Secure storage adapter for session persistence
const secureStorageAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Step 2: Create TypeScript types**

```typescript
// mobile/lib/types.ts
import { User } from '@supabase/supabase-js';

export type Theme = 'romance' | 'fantasy' | 'our_future';
export type StoryStatus = 'active' | 'paused' | 'completed';
export type MemberRole = 'creator' | 'partner';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Story {
  id: string;
  title: string;
  theme: Theme;
  created_by: string | null;
  pairing_code: string;
  status: StoryStatus;
  created_at: string;
}

export interface StoryMember {
  story_id: string;
  user_id: string;
  role: MemberRole;
  turn_order: number;
  joined_at: string;
}

export interface Chapter {
  id: string;
  story_id: string;
  author_id: string;
  chapter_number: number;
  content: string;
  ai_enhanced_content: string | null;
  context_snippet: string | null;
  created_at: string;
}

export interface Inspiration {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface StoryWithMembers extends Story {
  members: (StoryMember & { profile: Profile })[];
  chapters?: Chapter[];
}

export interface AuthState {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
}

export type { User } from '@supabase/supabase-js';
```

**Step 3: Create .env.example**

```bash
# mobile/.env.example
EXPO_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=your-project-url.supabase.co/functions/v1
```

**Step 4: Commit**

```bash
git add mobile/lib/
git commit -m "feat: add Supabase client and TypeScript types"
```

---

## Task 4: Create Zustand Stores

**Files:**
- Create: `mobile/stores/authStore.ts`
- Create: `mobile/stories/storiesStore.ts`
- Create: `mobile/stores/editorStore.ts`
- Create: `mobile/stores/inspirationsStore.ts`

**Step 1: Create auth store**

```typescript
// mobile/stores/authStore.ts
import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null, isLoading: false });

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        set({ profile: profile ?? null });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Auth initialization error:', error);
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  },

  signUp: async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    set({ profile: profile ?? null });
  },
}));
```

**Step 2: Create stories store**

```typescript
// mobile/stores/storiesStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Story, StoryWithMembers, StoryMember, Profile } from '@/lib/types';
import { useAuthStore } from './authStore';

interface StoriesState {
  stories: StoryWithMembers[];
  currentStory: StoryWithMembers | null;
  isLoading: boolean;
  error: string | null;
  fetchStories: () => Promise<void>;
  fetchStory: (storyId: string) => Promise<void>;
  createStory: (title: string, theme: 'romance' | 'fantasy' | 'our_future') => Promise<{ error: string | null; data?: Story }>;
  joinStory: (pairingCode: string) => Promise<{ error: string | null; data?: Story }>;
  setCurrentStory: (story: StoryWithMembers | null) => void;
  subscribeToStory: (storyId: string) => () => void;
}

function generatePairingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useStoriesStore = create<StoriesState>((set, get) => ({
  stories: [],
  currentStory: null,
  isLoading: false,
  error: null,

  fetchStories: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('story_members')
        .select(`
          story_id,
          stories (
            id,
            title,
            theme,
            created_by,
            pairing_code,
            status,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const stories = (data?.map((m: any) => m.stories).filter(Boolean) ?? []) as Story[];

      // Fetch members for each story
      const storiesWithMembers: StoryWithMembers[] = await Promise.all(
        stories.map(async (story) => {
          const { data: members } = await supabase
            .from('story_members')
            .select('*, profiles(*)')
            .eq('story_id', story.id);

          return {
            ...story,
            members: members ?? [],
          };
        })
      );

      set({ stories: storiesWithMembers, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchStory: async (storyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: story, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (error) throw error;

      const { data: members } = await supabase
        .from('story_members')
        .select('*, profiles(*)')
        .eq('story_id', storyId);

      set({
        currentStory: {
          ...story,
          members: members ?? [],
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createStory: async (title, theme) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return { error: 'Not authenticated' };

    const pairingCode = generatePairingCode();

    const { data, error } = await supabase
      .from('stories')
      .insert({ title, theme, pairing_code: pairingCode, created_by: userId })
      .select()
      .single();

    if (error) return { error: error.message };

    // Add creator as first member
    await supabase
      .from('story_members')
      .insert({ story_id: data.id, user_id: userId, role: 'creator', turn_order: 1 });

    await get().fetchStories();
    return { error: null, data };
  },

  joinStory: async (pairingCode: string) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return { error: 'Not authenticated' };

    // Find story with this code
    const { data: story, error: findError } = await supabase
      .from('stories')
      .select('*')
      .eq('pairing_code', pairingCode.toUpperCase())
      .single();

    if (findError || !story) return { error: 'Invalid pairing code' };

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('story_members')
      .select('*')
      .eq('story_id', story.id)
      .eq('user_id', userId)
      .single();

    if (existingMember) return { error: 'Already a member of this story' };

    // Check if story already has two members
    const { data: allMembers } = await supabase
      .from('story_members')
      .select('*')
      .eq('story_id', story.id);

    if (allMembers && allMembers.length >= 2) return { error: 'Story is full' };

    // Add as partner
    await supabase
      .from('story_members')
      .insert({ story_id: story.id, user_id: userId, role: 'partner', turn_order: 2 });

    await get().fetchStories();
    return { error: null, data: story };
  },

  setCurrentStory: (story) => set({ currentStory: story }),

  subscribeToStory: (storyId: string) => {
    const channel = supabase
      .channel(`story:${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chapters',
          filter: `story_id=eq.${storyId}`,
        },
        async () => {
          await get().fetchStory(storyId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_members',
          filter: `story_id=eq.${storyId}`,
        },
        async () => {
          await get().fetchStory(storyId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
```

**Step 3: Create editor store**

```typescript
// mobile/stores/editorStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Chapter } from '@/lib/types';
import { useAuthStore } from './authStore';

interface EditorState {
  draftContent: string;
  contextSnippet: string;
  isEnhancing: boolean;
  isSubmitting: boolean;
  aiEnhancedContent: string | null;
  setDraftContent: (content: string) => void;
  setContextSnippet: (snippet: string) => void;
  enhanceWithAI: (storyId: string) => Promise<{ error: string | null; content?: string }>;
  submitChapter: (storyId: string, chapterNumber: number) => Promise<{ error: string | null }>;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  draftContent: '',
  contextSnippet: '',
  isEnhancing: false,
  isSubmitting: false,
  aiEnhancedContent: null,

  setDraftContent: (content) => set({ draftContent: content }),

  setContextSnippet: (snippet) => set({ contextSnippet: snippet }),

  enhanceWithAI: async (storyId: string) => {
    const { draftContent, contextSnippet } = get();
    if (!draftContent.trim()) return { error: 'Please write some content first' };

    set({ isEnhancing: true });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { error: 'Not authenticated' };

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/ai-enhance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            content: draftContent,
            context: contextSnippet,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { error: error.error || 'Failed to enhance content' };
      }

      const { enhancedContent } = await response.json();
      set({ aiEnhancedContent: enhancedContent, isEnhancing: false });
      return { error: null, content: enhancedContent };
    } catch (error: any) {
      set({ isEnhancing: false });
      return { error: error.message || 'Failed to connect to AI service' };
    }
  },

  submitChapter: async (storyId: string, chapterNumber: number) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return { error: 'Not authenticated' };

    const { draftContent, contextSnippet, aiEnhancedContent } = get();
    if (!draftContent.trim()) return { error: 'Please write some content first' };

    set({ isSubmitting: true });

    try {
      const { error } = await supabase
        .from('chapters')
        .insert({
          story_id: storyId,
          author_id: userId,
          chapter_number: chapterNumber,
          content: draftContent,
          ai_enhanced_content: aiEnhancedContent,
          context_snippet: contextSnippet || null,
        });

      if (error) return { error: error.message };

      set({ draftContent: '', contextSnippet: '', aiEnhancedContent: null, isSubmitting: false });
      return { error: null };
    } catch (error: any) {
      set({ isSubmitting: false });
      return { error: error.message };
    }
  },

  reset: () => set({
    draftContent: '',
    contextSnippet: '',
    isEnhancing: false,
    isSubmitting: false,
    aiEnhancedContent: null,
  }),
}));
```

**Step 4: Create inspirations store**

```typescript
// mobile/stores/inspirationsStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Inspiration } from '@/lib/types';
import { useAuthStore } from './authStore';

interface InspirationsState {
  inspirations: Inspiration[];
  isLoading: boolean;
  error: string | null;
  fetchInspirations: (storyId: string) => Promise<void>;
  addInspiration: (storyId: string, content: string) => Promise<{ error: string | null }>;
  deleteInspiration: (id: string) => Promise<{ error: string | null }>;
}

export const useInspirationsStore = create<InspirationsState>((set, get) => ({
  inspirations: [],
  isLoading: false,
  error: null,

  fetchInspirations: async (storyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('inspirations')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ inspirations: data ?? [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addInspiration: async (storyId: string, content: string) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('inspirations')
      .insert({ story_id: storyId, user_id: userId, content });

    if (error) return { error: error.message };

    await get().fetchInspirations(storyId);
    return { error: null };
  },

  deleteInspiration: async (id: string) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('inspirations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return { error: error.message };

    set({ inspirations: get().inspirations.filter((i) => i.id !== id) });
    return { error: null };
  },
}));
```

**Step 5: Commit**

```bash
git add mobile/stores/
git commit -m "feat: create Zustand stores for state management"
```

---

## Task 5: Create Supabase Edge Functions for AI

**Files:**
- Create: `supabase/functions/ai-enhance/index.ts`
- Create: `supabase/functions/ai-twist/index.ts`
- Create: `supabase/functions/ai-continuation/index.ts`

**Step 1: Create ai-enhance function**

```typescript
// supabase/functions/ai-enhance/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface EnhanceRequest {
  content: string;
  context?: string;
}

interface EnhanceResponse {
  enhancedContent: string;
}

corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit (simple implementation)
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (usage && usage.count >= 10) {
      return new Response(JSON.stringify({ error: 'Daily AI limit reached (10 calls per day)' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { content, context }: EnhanceRequest = await req.json();

    if (!content || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Gemini API
    const systemPrompt = `You are a romantic co-writer helping a couple write their shared story.
Enhance the following text with sensory details, emotional depth, and vivid imagery
while preserving the user's voice and plot. Keep it playful and romantic.
Return ONLY the enhanced text, no explanations or meta-commentary.`;

    const userPrompt = context
      ? `Context from their real life: "${context}"\n\nTheir chapter text: "${content}"`
      : `Their chapter text: "${content}"`;

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt + '\n\n' + userPrompt }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    const enhancedContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || content;

    // Record usage
    if (usage) {
      await supabase
        .from('ai_usage')
        .update({ count: usage.count + 1 })
        .eq('user_id', user.id)
        .eq('date', today);
    } else {
      await supabase
        .from('ai_usage')
        .insert({ user_id: user.id, date: today, count: 1 });
    }

    const response: EnhanceResponse = { enhancedContent };
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-enhance function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 2: Create ai-twist function**

```typescript
// supabase/functions/ai-twist/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface TwistRequest {
  storyContext: string;
  recentChapters: string[];
  context?: string;
}

interface TwistResponse {
  twists: string[];
}

corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { storyContext, recentChapters, context }: TwistRequest = await req.json();

    const prompt = `Given this story context: "${storyContext}"
Recent chapters: ${recentChapters.map((c, i) => `Chapter ${i + 1}: ${c}`).join('\n')}
${context ? `Real-life context: "${context}"` : ''}

Suggest 2-3 plot twists that would surprise and delight a couple writing this story together.
Each twist should be 1-2 sentences max. Consider their real-life context if provided.
Return as a JSON array of strings, like: ["twist 1", "twist 2", "twist 3"]`;

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 500 },
      }),
    });

    if (!geminiResponse.ok) {
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    // Parse JSON response
    let twists: string[] = [];
    try {
      twists = JSON.parse(responseText);
    } catch {
      // Fallback: extract from text
      twists = responseText
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .slice(0, 3);
    }

    return new Response(JSON.stringify({ twists }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-twist function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 3: Create ai-continuation function**

```typescript
// supabase/functions/ai-continuation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface ContinuationRequest {
  storyContext: string;
  recentChapters: string[];
  theme: string;
}

interface ContinuationResponse {
  suggestions: string[];
}

corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { storyContext, recentChapters, theme }: ContinuationRequest = await req.json();

    const themeGuidance: Record<string, string> = {
      romance: 'Keep suggestions romantic, focusing on emotional connection and relationship development.',
      fantasy: 'Include magical elements, adventures, and fantastical possibilities.',
      our_future: 'Keep suggestions grounded in reality, focusing on realistic relationship milestones and shared dreams.',
    };

    const prompt = `Story context: "${storyContext}"
Theme: ${theme}
Recent chapters: ${recentChapters.map((c, i) => `Chapter ${i + 1}: ${c}`).join('\n')}

${themeGuidance[theme] || ''}

Suggest 3 potential narrative directions for the next chapter.
Each should be 1-2 sentences max.
Return as a JSON array of strings: ["direction 1", "direction 2", "direction 3"]`;

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 500 },
      }),
    });

    if (!geminiResponse.ok) {
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(responseText);
    } catch {
      suggestions = responseText
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .slice(0, 3);
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-continuation function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 4: Create AI usage tracking migration**

```sql
-- supabase/migrations/20240110000003_ai_usage_table.sql
CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  count INT DEFAULT 1,
  PRIMARY KEY (user_id, date)
);

-- RLS for ai_usage
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage"
  ON public.ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI usage"
  ON public.ai_usage FOR UPDATE
  USING (auth.uid() = user_id);
```

**Step 5: Commit**

```bash
git add supabase/functions/ supabase/migrations/
git commit -m "feat: add Supabase Edge Functions for AI features"
```

---

## Task 6: Create Tamagui Theme and Base Components

**Files:**
- Create: `mobile/tamagui.config.ts`
- Create: `mobile/components/theme.tsx`
- Create: `mobile/components/Button.tsx`
- Create: `mobile/components/Input.tsx`
- Create: `mobile/components/Card.tsx`
- Create: `mobile/components/LoadingSpinner.tsx`

**Step 1: Create Tamagui config**

```typescript
// mobile/tamagui.config.ts
import { createTamagui, createTokens } from '@tamagui/core';

const colors = createTokens({
  primary: '#E91E63',
  primaryDark: '#C2185B',
  secondary: '#9C27B0',
  accent: '#FF4081',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
});

const space = createTokens({
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
});

const fontSize = createTokens({
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
});

const radius = createTokens({
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
});

export const tamaguiConfig = createTamagui({
  tokens: {
    color: colors,
    space,
    fontSize,
    radius,
  },
  themes: {
    light: {
      bg: colors.background,
      color: colors.text,
    },
  },
  shorthands: {
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    pt: 'paddingTop',
    pb: 'paddingBottom',
    pl: 'paddingLeft',
    pr: 'paddingRight',
  },
});

export type TamaguiConfig = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends TamaguiConfig {}
}
```

**Step 2: Create theme provider**

```typescript
// mobile/components/theme.tsx
'use client';

import { supabase } from '@/lib/supabase';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { tamaguiConfig } from '../tamagui.config';
import { config } from '@tamagui/config/v3';
import { TamaguiProvider, Theme } from '@tamagui/core';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <Theme name="light">
        <Slot />
      </Theme>
    </TamaguiProvider>
  );
}
```

**Step 3: Create Button component**

```typescript
// mobile/components/Button.tsx
import { Button as TamaguiButton, ButtonProps } from 'tamagui';
import { ActivityIndicator } from 'react-native';

interface Props extends ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  ...props
}: Props) {
  const variants = {
    primary: {
      backgroundColor: '$primary',
      color: '$surface',
      pressStyle: { opacity: 0.9, scale: 0.97 },
    },
    secondary: {
      backgroundColor: '$secondary',
      color: '$surface',
      pressStyle: { opacity: 0.9, scale: 0.97 },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '$primary',
      borderWidth: 1,
      borderColor: '$primary',
      pressStyle: { backgroundColor: '$background', scale: 0.97 },
    },
    danger: {
      backgroundColor: '$error',
      color: '$surface',
      pressStyle: { opacity: 0.9, scale: 0.97 },
    },
  };

  const variantStyle = variants[variant];

  return (
    <TamaguiButton
      disabled={disabled || isLoading}
      opacity={disabled ? 0.5 : 1}
      py="$sm"
      px="$md"
      borderRadius="$md"
      fontWeight="600"
      fontSize="$md"
      minHeight={44}
      animation="fast"
      {...variantStyle}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="$surface" />
      ) : (
        children
      )}
    </TamaguiButton>
  );
}
```

**Step 4: Create Input component**

```typescript
// mobile/components/Input.tsx
import { Input as TextInput, View, Text, TextInputProps } from 'react-native';
import { useState } from 'react';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View mb="$sm">
      {label && (
        <Text mb="$xs" fontWeight="600" fontSize="$sm" color="$text">
          {label}
        </Text>
      )}
      <View
        borderWidth={1}
        borderColor={error ? '$error' : isFocused ? '$primary' : '$border'}
        borderRadius="$md"
        bg="$surface"
        minHeight={44}
        px="$sm"
        flexDirection="row"
        alignItems="center"
      >
        <TextInput
          flex={1}
          py="$sm"
          fontSize="$md"
          color="$text"
          placeholderTextColor="$textSecondary"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {error && (
        <Text mt="$xs" fontSize="$xs" color="$error">
          {error}
        </Text>
      )}
    </View>
  );
}
```

**Step 5: Create Card component**

```typescript
// mobile/components/Card.tsx
import { View, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export function Card({ children, style, variant = 'elevated' }: Props) {
  const variants = {
    elevated: {
      bg: '$surface',
      borderRadius: '$lg',
      padding: '$md',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    } as ViewStyle,
    outlined: {
      bg: '$surface',
      borderRadius: '$lg',
      padding: '$md',
      borderWidth: 1,
      borderColor: '$border',
    } as ViewStyle,
    flat: {
      bg: '$surface',
      borderRadius: '$lg',
      padding: '$md',
    } as ViewStyle,
  };

  return <View style={[variants[variant], style]}>{children}</View>;
}
```

**Step 6: Create LoadingSpinner component**

```typescript
// mobile/components/LoadingSpinner.tsx
import { ActivityIndicator, View } from 'react-native';

interface Props {
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingSpinner({ size = 'large', color = '#E91E63' }: Props) {
  return (
    <View flex={1} justifyContent="center" alignItems="center" bg="$background">
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
```

**Step 7: Commit**

```bash
git add mobile/components/ mobile/tamagui.config.ts
git commit -m "feat: create Tamagui theme and base UI components"
```

---

## Task 7: Create App Layout and Navigation

**Files:**
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/index.tsx`
- Create: `mobile/app/(auth)/_layout.tsx`
- Create: `mobile/app/(auth)/login.tsx`
- Create: `mobile/app/(auth)/register.tsx`
- Create: `mobile/app/(app)/_layout.tsx`
- Create: `mobile/app/(app)/index.tsx`
- Create: `mobile/app/(app)/story/[id].tsx`

**Step 1: Create root layout**

```typescript
// mobile/app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function RootLayout() {
  const { initialize, user, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
```

**Step 2: Create index redirect**

```typescript
// mobile/app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const user = useAuthStore((s) => s.user);

  return <Redirect href={user ? '/(app)' : '/(auth)/login'} />;
}
```

**Step 3: Create auth layout**

```typescript
// mobile/app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#FAFAFA' },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
```

**Step 4: Create login screen**

```typescript
// mobile/app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { styled } from '@tamagui/core';

const Title = styled(Text, {
  fontSize: '$xxl',
  fontWeight: '700',
  color: '$primary',
  textAlign: 'center',
  marginBottom: '$sm',
});

const Subtitle = styled(Text, {
  fontSize: '$md',
  color: '$textSecondary',
  textAlign: 'center',
  marginBottom: '$xl',
});

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await signIn(email, password);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.replace('/(app)');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} bg="$background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', padding: 24 }}
      >
        <Title>Parallel Story Builder</Title>
        <Subtitle>Write your love story together</Subtitle>

        <Card variant="elevated">
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? (
            <Text color="$error" fontSize="$sm" mb="$sm">
              {error}
            </Text>
          ) : null}
          <Button onPress={handleLogin} isLoading={isLoading} mb="$sm">
            Sign In
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.push('/(auth)/register')}
          >
            Create Account
          </Button>
        </Card>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}
```

**Step 5: Create register screen**

```typescript
// mobile/app/(auth)/register.tsx
import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { styled } from '@tamagui/core';

const Title = styled(Text, {
  fontSize: '$xxl',
  fontWeight: '700',
  color: '$primary',
  textAlign: 'center',
  marginBottom: '$sm',
});

const Subtitle = styled(Text, {
  fontSize: '$md',
  color: '$textSecondary',
  textAlign: 'center',
  marginBottom: '$xl',
});

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await signUp(email, password, displayName);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.replace('/(app)');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} bg="$background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', padding: 24 }}
      >
        <Title>Create Account</Title>
        <Subtitle>Start writing your story together</Subtitle>

        <Card variant="elevated">
          <Input
            label="Display Name"
            placeholder="Your name"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Input
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {error ? (
            <Text color="$error" fontSize="$sm" mb="$sm">
              {error}
            </Text>
          ) : null}
          <Button onPress={handleRegister} isLoading={isLoading} mb="$sm">
            Create Account
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.push('/(auth)/login')}
          >
            Already have an account? Sign In
          </Button>
        </Card>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}
```

**Step 6: Create app layout**

```typescript
// mobile/app/(app)/_layout.tsx
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { Pressable, Text } from 'react-native';
import { X } from '@tamagui/lucide-icons';

function LogoutButton() {
  const { signOut } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Pressable onPress={handleLogout} style={{ padding: 8 }}>
      <X size={24} color="#E91E63" />
    </Pressable>
  );
}

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#E91E63' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        headerRight: () => <LogoutButton />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'My Stories' }}
      />
      <Stack.Screen
        name="story/[id]"
        options={{ title: 'Story' }}
      />
      <Stack.Screen
        name="create-story"
        options={{ title: 'Create Story', presentation: 'modal' }}
      />
      <Stack.Screen
        name="join-story"
        options={{ title: 'Join Story', presentation: 'modal' }}
      />
    </Stack>
  );
}
```

**Step 7: Create home screen (stories list)**

```typescript
// mobile/app/(app)/index.tsx
import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useStoriesStore } from '@/stores/storiesStore';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Plus, LogIn } from '@tamagui/lucide-icons';
import { styled } from '@tamagui/core';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const EmptyState = styled(View, {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: '$xl',
});

const EmptyTitle = styled(Text, {
  fontSize: '$xl',
  fontWeight: '600',
  color: '$text',
  marginTop: '$md',
  marginBottom: '$sm',
});

const EmptySubtitle = styled(Text, {
  fontSize: '$md',
  color: '$textSecondary',
  textAlign: 'center',
});

const StoryCard = styled(Pressable, {
  marginBottom: '$md',
});

const StoryTitle = styled(Text, {
  fontSize: '$lg',
  fontWeight: '600',
  color: '$text',
  marginBottom: '$xs',
});

const StoryMeta = styled(Text, {
  fontSize: '$sm',
  color: '$textSecondary',
});

const fabContainer = {
  position: 'absolute' as const,
  bottom: 24,
  right: 24,
  flexDirection: 'row' as const,
  gap: 12,
};

export default function HomeScreen() {
  const router = useRouter();
  const { stories, isLoading, fetchStories } = useStoriesStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user) fetchStories();
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {stories.length === 0 ? (
          <EmptyState>
            <Text style={{ fontSize: 48 }}>📖</Text>
            <EmptyTitle>No stories yet</EmptyTitle>
            <EmptySubtitle>
              Create your first story or join your partner's story to begin writing together.
            </EmptySubtitle>
          </EmptyState>
        ) : (
          stories.map((story) => (
            <StoryCard
              key={story.id}
              onPress={() => router.push(`/story/${story.id}`)}
            >
              <Card variant="elevated">
                <StoryTitle>{story.title}</StoryTitle>
                <StoryMeta>
                  Theme: {story.theme.charAt(0).toUpperCase() + story.theme.slice(1)} •
                  {story.members.length === 2 ? ' 2 members' : ' Waiting for partner'}
                </StoryMeta>
              </Card>
            </StoryCard>
          ))
        )}
      </ScrollView>

      <View style={fabContainer}>
        <Button
          variant="secondary"
          onPress={() => router.push('/join-story')}
          style={{ width: 56, height: 56, padding: 0, justifyContent: 'center' }}
        >
          <LogIn size={24} color="#fff" />
        </Button>
        <Button
          onPress={() => router.push('/create-story')}
          style={{ width: 56, height: 56, padding: 0, justifyContent: 'center' }}
        >
          <Plus size={24} color="#fff" />
        </Button>
      </View>
    </View>
  );
}
```

**Step 8: Commit**

```bash
git add mobile/app/
git commit -m "feat: create app layout and navigation screens"
```

---

## Task 8: Create Story Creation and Join Screens

**Files:**
- Create: `mobile/app/(app)/create-story.tsx`
- Create: `mobile/app/(app)/join-story.tsx`

**Step 1: Create create-story screen**

```typescript
// mobile/app/(app)/create-story.tsx
import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useStoriesStore } from '@/stores/storiesStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { styled } from '@tamagui/core';

const Title = styled(Text, {
  fontSize: '$lg',
  fontWeight: '700',
  color: '$text',
  marginBottom: '$md',
});

const ThemeLabel = styled(Text, {
  fontSize: '$sm',
  fontWeight: '600',
  color: '$text',
  marginBottom: '$xs',
});

const ThemeOption = styled(Pressable, {
  padding: '$md',
  borderRadius: '$md',
  borderWidth: 1,
  borderColor: '$border',
  marginBottom: '$sm',
  flexDirection: 'row',
  alignItems: 'center',
});

const ThemeEmoji = styled(Text, {
  fontSize: '$xl',
  marginRight: '$sm',
});

const ThemeName = styled(Text, {
  fontSize: '$md',
  fontWeight: '500',
  color: '$text',
});

type Theme = 'romance' | 'fantasy' | 'our_future';

const themes = [
  { id: 'romance' as Theme, name: 'Romance', emoji: '💕' },
  { id: 'fantasy' as Theme, name: 'Fantasy Adventure', emoji: '⚔️' },
  { id: 'our_future' as Theme, name: 'Our Future Together', emoji: '🏠' },
];

export default function CreateStoryScreen() {
  const router = useRouter();
  const { createStory } = useStoriesStore();
  const [title, setTitle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<Theme>('romance');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a story title');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await createStory(title, selectedTheme);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ padding: 16 }}
        >
          <Title>Create a New Story</Title>

          <Card variant="outlined" mb="$md">
            <Input
              label="Story Title"
              placeholder="Our Love Story"
              value={title}
              onChangeText={setTitle}
            />

            <ThemeLabel>Choose a Theme</ThemeLabel>
            {themes.map((theme) => (
              <ThemeOption
                key={theme.id}
                onPress={() => setSelectedTheme(theme.id)}
                style={{
                  borderColor: selectedTheme === theme.id ? '#E91E63' : '#E0E0E0',
                  backgroundColor: selectedTheme === theme.id ? '#FCE4EC' : '#FFFFFF',
                }}
              >
                <ThemeEmoji>{theme.emoji}</ThemeEmoji>
                <ThemeName>{theme.name}</ThemeName>
              </ThemeOption>
            ))}

            {error ? (
              <Text color="$error" fontSize="$sm" mt="$sm">
                {error}
              </Text>
            ) : null}
          </Card>

          <Button onPress={handleCreate} isLoading={isLoading}>
            Create Story
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.back()}
            style={{ marginTop: 8 }}
          >
            Cancel
          </Button>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}
```

**Step 2: Create join-story screen**

```typescript
// mobile/app/(app)/join-story.tsx
import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useStoriesStore } from '@/stores/storiesStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { styled } from '@tamagui/core';

const Title = styled(Text, {
  fontSize: '$lg',
  fontWeight: '700',
  color: '$text',
  marginBottom: '$md',
});

const InfoText = styled(Text, {
  fontSize: '$sm',
  color: '$textSecondary',
  marginBottom: '$md',
  lineHeight: 20,
});

export default function JoinStoryScreen() {
  const router = useRouter();
  const { joinStory } = useStoriesStore();
  const [pairingCode, setPairingCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!pairingCode.trim() || pairingCode.length !== 6) {
      setError('Please enter a valid 6-character code');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await joinStory(pairingCode);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ padding: 16 }}
        >
          <Title>Join Your Partner's Story</Title>

          <Card variant="outlined" mb="$md">
            <InfoText>
              Ask your partner for their story's pairing code. Enter it below to join their story and start writing together.
            </InfoText>

            <Input
              label="Pairing Code"
              placeholder="ABC123"
              value={pairingCode}
              onChangeText={(text) => setPairingCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              textAlign="center"
              style={{ fontSize: 24, letterSpacing: 4 }}
            />

            {error ? (
              <Text color="$error" fontSize="$sm" mt="$sm">
                {error}
              </Text>
            ) : null}
          </Card>

          <Button onPress={handleJoin} isLoading={isLoading}>
            Join Story
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.back()}
            style={{ marginTop: 8 }}
          >
            Cancel
          </Button>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}
```

**Step 9: Commit**

```bash
git add mobile/app/(app)/create-story.tsx mobile/app/(app)/join-story.tsx
git commit -m "feat: add create and join story screens"
```

---

## Task 9: Create Story Detail Screen

**Files:**
- Create: `mobile/app/(app)/story/[id].tsx`

**Step 1: Create story detail screen**

```typescript
// mobile/app/(app)/story/[id].tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStoriesStore } from '@/stores/storiesStore';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Edit2, BookOpen, Heart, Sparkles } from '@tamagui/lucide-icons';
import { styled } from '@tamagui/core';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Chapter } from '@/lib/types';

const Header = styled(View, {
  padding: '$md',
  bg: '$primary',
});

const Title = styled(Text, {
  fontSize: '$xl',
  fontWeight: '700',
  color: '$surface',
  marginBottom: '$xs',
});

const Meta = styled(Text, {
  fontSize: '$sm',
  color: '$surface',
  opacity: 0.9,
});

const ChapterCard = styled(Pressable, {
  marginBottom: '$sm',
});

const ChapterNumber = styled(Text, {
  fontSize: '$xs',
  fontWeight: '600',
  color: '$primary',
  textTransform: 'uppercase',
  marginBottom: '$xs',
});

const ChapterPreview = styled(Text, {
  fontSize: '$md',
  color: '$text',
  lineHeight: 22,
});

const AuthorLabel = styled(Text, {
  fontSize: '$xs',
  color: '$textSecondary',
  marginTop: '$sm',
});

const ActionsRow = styled(View, {
  flexDirection: 'row',
  gap: '$sm',
  padding: '$md',
  bg: '$background',
  borderTopWidth: 1,
  borderTopColor: '$border',
});

export default function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { currentStory, fetchStory, subscribeToStory } = useStoriesStore();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStory(id);
      fetchChapters();

      const unsubscribe = subscribeToStory(id);
      return () => unsubscribe();
    }
  }, [id]);

  const fetchChapters = async () => {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('story_id', id)
      .order('chapter_number', { ascending: true });

    setChapters(data ?? []);
    setIsLoading(false);
  };

  const isMyTurn = currentStory && user ? (
    (currentStory.members.find((m) => m.user_id === user.id)?.turn_order === 1 && chapters.length % 2 === 0) ||
    (currentStory.members.find((m) => m.user_id === user.id)?.turn_order === 2 && chapters.length % 2 === 1)
  ) : false;

  const myMember = currentStory?.members.find((m) => m.user_id === user?.id);
  const partnerMember = currentStory?.members.find((m) => m.user_id !== user?.id);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentStory) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text fontSize="$lg" color="$text">
          Story not found
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <Header>
        <Title>{currentStory.title}</Title>
        <Meta>
          {currentStory.theme.charAt(0).toUpperCase() + currentStory.theme.slice(1)} •
          {partnerMember ? ` 2 writers` : ' Waiting for partner'}
        </Meta>
      </Header>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {partnerMember ? (
          <Card variant="outlined" mb="$md">
            <Text fontSize="$sm" fontWeight="600" color="$text" mb="$xs">
              Writing with {partnerMember.profile?.display_name || 'your partner'}
            </Text>
            <Text fontSize="$xs" color="$textSecondary">
              {isMyTurn ? "It's your turn to write!" : 'Waiting for your partner to write...'}
            </Text>
          </Card>
        ) : (
          <Card variant="outlined" mb="$md" style={{ backgroundColor: '#FFF3E0' }}>
            <Text fontSize="$sm" fontWeight="600" color="$text" mb="$xs">
              Waiting for your partner
            </Text>
            <Text fontSize="$xs" color="$textSecondary">
              Share this code with them: {currentStory.pairing_code}
            </Text>
          </Card>
        )}

        {chapters.length === 0 ? (
          <Card variant="outlined">
            <View style={{ alignItems: 'center', padding: 16 }}>
              <BookOpen size={48} color="#E91E63" />
              <Text fontSize="$md" fontWeight="600" color="$text" mt="$md" mb="$xs">
                Start your story
              </Text>
              <Text fontSize="$sm" color="$textSecondary" textAlign="center">
                Write the first chapter to begin your shared adventure.
              </Text>
            </View>
          </Card>
        ) : (
          chapters.map((chapter) => {
            const isMyChapter = chapter.author_id === user?.id;
            const author = currentStory.members.find((m) => m.user_id === chapter.author_id);

            return (
              <ChapterCard key={chapter.id}>
                <Card variant="elevated">
                  <ChapterNumber>
                    Chapter {chapter.chapter_number} • {isMyChapter ? 'You' : author?.profile?.display_name || 'Partner'}
                  </ChapterNumber>
                  <ChapterPreview numberOfLines={3}>
                    {chapter.ai_enhanced_content || chapter.content}
                  </ChapterPreview>
                  {chapter.context_snippet ? (
                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 4 }}>
                      <Sparkles size={12} color="#FF4081" />
                      <Text fontSize="$xs" color="$textSecondary">
                        Inspired by: "{chapter.context_snippet}"
                      </Text>
                    </View>
                  ) : null}
                </Card>
              </ChapterCard>
            );
          })
        )}
      </ScrollView>

      {partnerMember && (
        <ActionsRow>
          <Button
            flex={1}
            disabled={!isMyTurn}
            opacity={isMyTurn ? 1 : 0.5}
            onPress={() => router.push(`/write/${id}`)}
          >
            {isMyTurn ? `Write Chapter ${chapters.length + 1}` : 'Waiting...'}
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.push(`/inspirations/${id}`)}
          >
            <Heart size={20} color="#E91E63" />
          </Button>
        </ActionsRow>
      )}
    </View>
  );
}
```

**Step 2: Commit**

```bash
git add mobile/app/\(app\)/story/\[id\].tsx
git commit -m "feat: add story detail screen with chapters list"
```

---

## Task 10: Create Chapter Editor Screen

**Files:**
- Create: `mobile/app/(app)/write/[id].tsx`
- Create: `mobile/components/TextArea.tsx`

**Step 1: Create TextArea component**

```typescript
// mobile/components/TextArea.tsx
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { useState } from 'react';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, ...props }: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View mb="$sm">
      {label && (
        <Text mb="$xs" fontWeight="600" fontSize="$sm" color="$text">
          {label}
        </Text>
      )}
      <View
        borderWidth={1}
        borderColor={error ? '$error' : isFocused ? '$primary' : '$border'}
        borderRadius="$md"
        bg="$surface"
        minHeight={120}
        px="$sm"
        py="$sm"
      >
        <TextInput
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          fontSize="$md"
          color="$text"
          placeholderTextColor="$textSecondary"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{ flex: 1 }}
          {...props}
        />
      </View>
      {error && (
        <Text mt="$xs" fontSize="$xs" color="$error">
          {error}
        </Text>
      )}
    </View>
  );
}
```

**Step 2: Create chapter editor screen**

```typescript
// mobile/app/(app)/write/[id].tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStoriesStore } from '@/stores/storiesStore';
import { useAuthStore } from '@/stores/authStore';
import { useEditorStore } from '@/stores/editorStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/TextArea';
import { Card } from '@/components/Card';
import { Sparkles, Eye, ArrowLeft } from '@tamagui/lucide-icons';
import { styled } from '@tamagui/core';
import { supabase } from '@/lib/supabase';
import { Chapter } from '@/lib/types';

const Header = styled(View, {
  flexDirection: 'row',
  alignItems: 'center',
  padding: '$md',
  bg: '$surface',
  borderBottomWidth: 1,
  borderBottomColor: '$border',
});

const Title = styled(Text, {
  fontSize: '$lg',
  fontWeight: '600',
  color: '$text',
  flex: 1,
});

const ContextLabel = styled(Text, {
  fontSize: '$sm',
  fontWeight: '600',
  color: '$text',
  marginBottom: '$xs',
});

const ContextHint = styled(Text, {
  fontSize: '$xs',
  color: '$textSecondary',
  marginBottom: '$md',
});

const PreviewBadge = styled(Pressable, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$xs',
  paddingVertical: '$xs',
  paddingHorizontal: '$sm',
  borderRadius: '$md',
  bg: '$background',
  alignSelf: 'flex-start',
  marginBottom: '$sm',
});

export default function WriteChapterScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentStory } = useStoriesStore();
  const { user } = useAuthStore();
  const {
    draftContent,
    contextSnippet,
    aiEnhancedContent,
    isEnhancing,
    isSubmitting,
    setDraftContent,
    setContextSnippet,
    enhanceWithAI,
    submitChapter,
    reset,
  } = useEditorStore();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);

  useEffect(() => {
    fetchChapters();
    return () => reset();
  }, [id]);

  const fetchChapters = async () => {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('story_id', id)
      .order('chapter_number', { ascending: true });

    setChapters(data ?? []);
    setChapterNumber((data?.length ?? 0) + 1);
  };

  const handleEnhance = async () => {
    setError('');
    const result = await enhanceWithAI(id!);
    if (result.error) {
      setError(result.error);
    }
  };

  const handleSubmit = async () => {
    if (!draftContent.trim()) {
      setError('Please write something first');
      return;
    }

    const result = await submitChapter(id!, chapterNumber);
    if (result.error) {
      setError(result.error);
    } else {
      router.back();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <Header>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <ArrowLeft size={24} color="#212121" />
        </Pressable>
        <Title>Chapter {chapterNumber}</Title>
      </Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          <Card variant="outlined" mb="$md">
            <ContextLabel>Real-life Context (Optional)</ContextLabel>
            <ContextHint>
              Share something from your day that you'd like woven into the story.
            </ContextHint>
            <Input
              placeholder="Had a lovely coffee date today..."
              value={contextSnippet}
              onChangeText={setContextSnippet}
            />
          </Card>

          <TextArea
            label="Your Chapter"
            placeholder="Once upon a time..."
            value={draftContent}
            onChangeText={setDraftContent}
          />

          {error && (
            <Text color="$error" fontSize="$sm" mb="$sm">
              {error}
            </Text>
          )}

          <Button
            variant="secondary"
            onPress={handleEnhance}
            isLoading={isEnhancing}
            disabled={!draftContent.trim()}
            mb="$sm"
            icon={<Sparkles size={18} color="#fff" />}
          >
            Enhance with AI
          </Button>

          {aiEnhancedContent && (
            <>
              <PreviewBadge onPress={() => setShowPreview(!showPreview)}>
                <Eye size={16} color="#E91E63" />
                <Text fontSize="$sm" fontWeight="600" color="$primary">
                  {showPreview ? 'Hide' : 'Show'} AI Enhancement
                </Text>
              </PreviewBadge>

              {showPreview && (
                <Card variant="outlined" mb="$md" style={{ backgroundColor: '#F3E5F5' }}>
                  <Text fontSize="$xs" fontWeight="600" color="$primary" mb="$sm">
                    AI Enhanced Version
                  </Text>
                  <Text fontSize="$md" color="$text" lineHeight={22}>
                    {aiEnhancedContent}
                  </Text>
                  <Text fontSize="$xs" color="$textSecondary" mt="$sm">
                    You can edit this or use your original text.
                  </Text>
                </Card>
              )}
            </>
          )}

          <Button onPress={handleSubmit} isLoading={isSubmitting}>
            Submit Chapter
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
```

**Step 3: Commit**

```bash
git add mobile/app/\(app\)/write/\[id\].tsx mobile/components/TextArea.tsx
git commit -m "feat: add chapter editor screen with AI enhancement"
```

---

## Task 11: Create Inspiration Journal Screen

**Files:**
- Create: `mobile/app/(app)/inspirations/[id].tsx`

**Step 1: Create inspirations screen**

```typescript
// mobile/app/(app)/inspirations/[id].tsx
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useInspirationsStore } from '@/stores/inspirationsStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Plus, Trash2, ArrowLeft, Heart } from '@tamagui/lucide-icons';
import { styled } from '@tamagui/core';
import { useAuthStore } from '@/stores/authStore';
import { Inspiration } from '@/lib/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const Header = styled(View, {
  flexDirection: 'row',
  alignItems: 'center',
  padding: '$md',
  bg: '$surface',
  borderBottomWidth: 1,
  borderBottomColor: '$border',
});

const Title = styled(Text, {
  fontSize: '$lg',
  fontWeight: '600',
  color: '$text',
  flex: 1,
});

const EmptyState = styled(View, {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: '$xl',
});

const EmptyTitle = styled(Text, {
  fontSize: '$lg',
  fontWeight: '600',
  color: '$text',
  marginTop: '$md',
  marginBottom: '$sm',
});

const EmptySubtitle = styled(Text, {
  fontSize: '$sm',
  color: '$textSecondary',
  textAlign: 'center',
});

const InspirationCard = styled(Pressable, {
  marginBottom: '$sm',
});

const InspirationContent = styled(Text, {
  fontSize: '$md',
  color: '$text',
  lineHeight: 22,
  marginBottom: '$xs',
});

const InspirationMeta = styled(Text, {
  fontSize: '$xs',
  color: '$textSecondary',
});

const InputCard = styled(View, {
  padding: '$md',
  bg: '$surface',
  borderRadius: '$lg',
  marginBottom: '$md',
  borderWidth: 1,
  borderColor: '$border',
});

export default function InspirationsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { inspirations, isLoading, fetchInspirations, addInspiration, deleteInspiration } =
    useInspirationsStore();

  const [newInspiration, setNewInspiration] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (id) fetchInspirations(id);
  }, [id]);

  const handleAdd = async () => {
    if (!newInspiration.trim()) return;

    setIsAdding(true);
    const result = await addInspiration(id!, newInspiration);
    setIsAdding(false);

    if (!result.error) {
      setNewInspiration('');
      setShowInput(false);
    }
  };

  const handleDelete = async (inspiration: Inspiration) => {
    if (inspiration.user_id !== user?.id) return;
    await deleteInspiration(inspiration.id);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <Header>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <ArrowLeft size={24} color="#212121" />
        </Pressable>
        <Title>Inspiration Journal</Title>
      </Header>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Card variant="outlined" mb="$md">
          <Text fontSize="$sm" color="$textSecondary" lineHeight={20}>
            Add moments from your real life that you'd like to incorporate into your story.
            The AI will weave these into future chapters.
          </Text>
        </Card>

        {showInput ? (
          <InputCard>
            <TextInput
              multiline
              placeholder="Had a lovely picnic in the park today..."
              value={newInspiration}
              onChangeText={setNewInspiration}
              style={{
                fontSize: 16,
                color: '#212121',
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button flex={1} onPress={handleAdd} isLoading={isAdding}>
                Save
              </Button>
              <Button
                variant="ghost"
                onPress={() => {
                  setShowInput(false);
                  setNewInspiration('');
                }}
              >
                Cancel
              </Button>
            </View>
          </InputCard>
        ) : (
          <Button
            variant="secondary"
            onPress={() => setShowInput(true)}
            mb="$md"
            icon={<Plus size={18} color="#fff" />}
          >
            Add Inspiration
          </Button>
        )}

        {inspirations.length === 0 ? (
          <EmptyState>
            <Heart size={48} color="#E0E0E0" />
            <EmptyTitle>No inspirations yet</EmptyTitle>
            <EmptySubtitle>
              Add moments from your life to enrich your shared story.
            </EmptySubtitle>
          </EmptyState>
        ) : (
          inspirations.map((inspiration) => {
            const isMine = inspiration.user_id === user?.id;

            return (
              <InspirationCard key={inspiration.id}>
                <Card variant="elevated">
                  <InspirationContent>{inspiration.content}</InspirationContent>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <InspirationMeta>
                      {isMine ? 'You' : 'Partner'} • {new Date(inspiration.created_at).toLocaleDateString()}
                    </InspirationMeta>
                    {isMine && (
                      <Pressable
                        onPress={() => handleDelete(inspiration)}
                        style={{ padding: 4 }}
                      >
                        <Trash2 size={18} color="#F44336" />
                      </Pressable>
                    )}
                  </View>
                </Card>
              </InspirationCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
```

**Step 2: Commit**

```bash
git add mobile/app/\(app\)/inspirations/\[id\].tsx
git commit -m "feat: add inspiration journal screen"
```

---

## Task 12: Add README and Setup Instructions

**Files:**
- Create: `README.md`
- Create: `DEPLOYMENT.md`
- Create: `.env.example`

**Step 1: Create README**

```markdown
# Parallel Story Builder

A collaborative storytelling app for couples in long-distance relationships. Write your love story together, one chapter at a time, with AI assistance.

## Features

- **Turn-based Writing**: Take turns writing chapters - one per day
- **AI Co-writer**: Enhance your prose with Google Gemini 2.0 Flash
- **Real-life Integration**: Share inspirations from your day to weave into the story
- **Three Themes**: Romance, Fantasy Adventure, or Our Future Together
- **Real-time Sync**: See your partner's additions instantly
- **Private**: Only you and your partner can access your stories

## Tech Stack

- **Mobile**: React Native with Expo
- **UI**: Tamagui (cross-platform styling)
- **State**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI**: Google Gemini 2.0 Flash

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account
- Google AI API key

### Installation

1. Clone the repo:
\`\`\`bash
git clone <repo-url>
cd ParallelStoryBuilder
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your values:
\`\`\`
EXPO_PUBLIC_SUPABASE_URL=your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=your-project.supabase.co/functions/v1
\`\`\`

4. Run database migrations:
\`\`\`bash
npx supabase db push
\`\`\`

5. Deploy Edge Functions:
\`\`\`bash
npx supabase functions deploy ai-enhance
npx supabase functions deploy ai-twist
npx supabase functions deploy ai-continuation
\`\`\`

Set `GEMINI_API_KEY` in your Supabase dashboard for each function.

6. Start the dev server:
\`\`\`bash
npm run dev
\`\`\`

7. Scan the QR code with Expo Go on your phone.

## Project Structure

\`\`\`
ParallelStoryBuilder/
├── mobile/              # React Native app
│   ├── app/            # Expo Router pages
│   ├── components/     # Reusable UI components
│   ├── stores/         # Zustand state management
│   └── lib/            # Utilities (Supabase client, types)
├── supabase/           # Database & Edge Functions
│   ├── functions/      # Deno serverless functions
│   └── migrations/     # SQL migrations
└── docs/               # Design docs
\`\`\`

## License

MIT
```

**Step 2: Create DEPLOYMENT.md**

```markdown
# Deployment Guide

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)

2. Get your project URL and anon key from Settings > API

3. Push the database schema:
\`\`\`bash
npx supabase db push
\`\`\`

4. Deploy Edge Functions:
\`\`\`bash
npx supabase functions deploy ai-enhance
npx supabase functions deploy ai-twist
npx supabase functions deploy ai-continuation
\`\`\`

5. Add Gemini API key:
   - Go to Edge Functions in Supabase dashboard
   - For each function, add \`GEMINI_API_KEY\` secret
   - Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Mobile App Build

### iOS

1. Install EAS CLI:
\`\`\`bash
npm install -g eas-cli
\`\`\`

2. Configure app (first time):
\`\`\`bash
eas build:configure
\`\`\`

3. Build:
\`\`\`bash
eas build --platform ios
\`\`\`

### Android

\`\`\`bash
eas build --platform android
\`\`\`

## Production Checklist

- [ ] Update app IDs in \`mobile/app.json\`
- [ ] Add app icons and splash screen
- [ ] Set up production Supabase project
- [ ] Configure rate limits for AI functions
- [ ] Test on real devices
- [ ] Submit to app stores
```

**Step 3: Create root .env.example**

```bash
# .env.example (root)
EXPO_PUBLIC_SUPABASE_URL=your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=your-project.supabase.co/functions/v1
```

**Step 4: Commit**

```bash
git add README.md DEPLOYMENT.md .env.example
git commit -m "docs: add README and deployment guide"
```

---

## Summary

This implementation plan creates a complete MVP for Parallel Story Builder:

✅ Monorepo with mobile app and Supabase backend
✅ Database schema with RLS for security
✅ Authentication with email/password
✅ Story creation with 6-digit pairing codes
✅ Turn-based chapter writing
✅ AI enhancement via Gemini 2.0 Flash
✅ Inspiration journal for real-life context
✅ Real-time sync between partners
✅ Beautiful UI with Tamagui

**Total estimated tasks**: 12
**Total estimated commits**: 12

**Next Steps**: Choose execution method below.
