# Parallel Story Builder - Design Document

**Date:** 2026-01-10
**Status:** ✅ Implementation Complete
**Last Updated:** 2026-01-14

## Overview

A collaborative, AI-assisted storytelling app designed exclusively for couples in long-distance relationships. Couples co-author an ongoing interactive story where each person adds chapters together. The AI acts as a smart co-writer: fills in descriptive gaps, suggests improvements, and keeps the tone romantic/playful.

## Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Email + Password Auth | ✅ Complete | Via Supabase Auth |
| 6-digit Pairing Code | ✅ Complete | Auto-generated |
| Turn-based Writing | ✅ Complete | With turn tracking |
| Three Core Themes | ✅ Complete | Romance 💕, Fantasy 🐉, Our Future 🌟 |
| AI Co-writer (Gemini) | ✅ Complete | Via Supabase Edge Functions |
| Demo Mode | ✅ Complete | Works without any setup |
| Inspiration Journal | ✅ Complete | Share ideas with partner |
| Real-time Sync | ✅ Complete | Via Supabase Real-time |
| Mobile UI | ✅ Complete | React Native with Expo |

## Tech Stack

| Component | Technology | Status |
|-----------|------------|--------|
| **Mobile Framework** | React Native (Expo 51) | ✅ |
| **Navigation** | Expo Router 3.5 | ✅ |
| **State Management** | Zustand 4.5 | ✅ |
| **UI Styling** | React Native StyleSheet | ✅ |
| **Backend/Database** | Supabase (PostgreSQL) | ✅ |
| **Auth** | Supabase Auth | ✅ |
| **AI Provider** | Google Gemini 2.0 Flash | ✅ |
| **Real-time** | Supabase Real-time | ✅ |
| **Serverless** | Supabase Edge Functions | ✅ |

**Note:** Tamagui was removed in favor of React Native StyleSheet for simpler styling.

## Architecture

```
┌─────────────────────┐
│  React Native App   │
│     (Expo Router)   │
│   StyleSheet Styles │
└──────────┬──────────┘
           │
           ├──► Supabase Auth (Authentication)
           ├──► Supabase DB (Queries + Real-time)
           └──► Supabase Edge Functions (AI calls)
                      │
                      └──► Gemini API
```

### Why This Architecture?

- **Supabase-first**: No separate backend server to manage
- **Built-in real-time**: Chapters appear instantly as partner writes
- **Row Level Security**: Data security at database level
- **Edge Functions**: Run close to users globally
- **Demo Mode**: Try without any setup

## Database Schema

### Profiles (extends Supabase Auth)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Stories (shared narratives)
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('romance', 'fantasy', 'our_future')),
  created_by UUID REFERENCES profiles(id),
  pairing_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  current_turn UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Story Members (couples paired to stories)
```sql
CREATE TABLE story_members (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('creator', 'partner')),
  turn_order INT CHECK (turn_order IN (1, 2)),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (story_id, user_id)
);
```

### Chapters (individual story segments)
```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  chapter_number INT NOT NULL,
  content TEXT NOT NULL,
  ai_enhanced_content TEXT,
  context_snippet TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(story_id, chapter_number)
);
```

### Inspirations (context journal)
```sql
CREATE TABLE inspirations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/functions/v1/ai-enhance` | POST | Polish chapter text with AI |

All database operations go through Supabase client directly.

## AI Integration with Gemini 2.0 Flash

### Content Enhancement

```
System: "You are a romantic co-writer helping a couple write their shared story.
Enhance the following text with sensory details, emotional depth, and vivid imagery
while preserving the user's voice and plot. Keep it playful and romantic."
User: [chapter content + optional context snippet]
```

### Rate Limiting

- 10 AI requests per day per user
- Prevents abuse and manages API costs
- ~$0.075 per 1M tokens (Gemini 2.0 Flash)

## Mobile App Screens

1. **Entry** → Auto-redirect to auth or app
2. **Login/Register** → Email/password authentication
3. **Home** → List of stories, create/join buttons
4. **Story Detail** → Chapter timeline, write button
5. **Chapter Editor** → Rich text, AI enhance, preview
6. **Inspiration Journal** → Timeline of entries

## State Management (Zustand Stores)

```typescript
// stores/authStore.ts
- user: StoredUser | null
- profile: Profile | null
- isConfigured: boolean
- signIn(), signOut(), signUp()

// stores/storiesStore.ts
- stories: StoryWithMembers[]
- currentStory: StoryWithMembers | null
- fetchStories(), createStory(), joinStory()

// stores/editorStore.ts
- draftContent: string
- contextSnippet: string | null
- aiEnhanced: string | null
- setDraft(), enhanceWithAI(), submit()

// stores/inspirationsStore.ts
- inspirations: Inspiration[]
- fetchInspirations(), addInspiration(), delete()

// stores/demoStore.ts (NEW)
- Complete demo mode data
- Works without Supabase configuration
```

## UI/UX Design

### Design Tokens

```typescript
// Colors
colors = {
  primary: '#E91E63',      // Romantic pink
  primaryDark: '#C2185B',
  secondary: '#9C27B0',    // Deep purple
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  error: '#F44336',
}

// Spacing (px)
spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }

// Typography
fontSizes = { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32 }

// Border Radius
radii = { sm: 4, md: 8, lg: 12, xl: 16 }
```

### Components

| Component | Variants | Purpose |
|-----------|----------|---------|
| **Button** | primary, secondary, ghost, danger | Actions |
| **Card** | elevated, outlined, flat | Content containers |
| **Input** | default | Text entry |
| **TextArea** | default | Multi-line text |
| **LoadingSpinner** | small, large | Loading states |

### Accessibility

- Semantic component structure
- Proper ARIA labels for screen readers
- Touch targets >=44px
- WCAG AA+ contrast ratios
- Focus states on interactive elements

## Real-Time Subscriptions

```typescript
supabase
  .channel(`story:${storyId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chapters',
    filter: `story_id=eq.${storyId}`
  }, (payload) => {
    // Handle new chapter from partner
  })
  .subscribe()
```

## Security (RLS Policies)

- Users can only view their own profile
- Users can only view stories they're members of
- Chapters: readable by story members, editable only by author
- Inspirations: visible within story, editable by creator

## Deployment

- **Mobile App**: Expo EAS Build → App Store + Google Play
- **Backend**: Supabase Cloud (free tier)
- **Environment**: Supabase dashboard for secrets

## Files Reference

```
mobile/
├── app/                    # Expo Router pages
│   ├── index.tsx           # Entry point with redirect
│   ├── _layout.tsx          # Root layout
│   ├── (auth)/              # Auth screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/               # Main app screens
│       ├── _layout.tsx      # App layout with routes
│       ├── index.tsx        # Home / Stories list
│       ├── create-story.tsx
│       ├── join-story.tsx
│       ├── story/[id].tsx
│       ├── write/[id].tsx
│       └── inspirations/[id].tsx
├── components/             # Reusable UI
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── TextArea.tsx
│   └── LoadingSpinner.tsx
├── stores/                 # Zustand stores
│   ├── authStore.ts
│   ├── storiesStore.ts
│   ├── editorStore.ts
│   ├── inspirationsStore.ts
│   └── demoStore.ts        # Demo mode data
└── lib/                    # Utilities
    ├── supabase.ts         # Client config
    └── types.ts            # TypeScript definitions
```

---

*Design approved. Implementation complete. Ready for production deployment.*
