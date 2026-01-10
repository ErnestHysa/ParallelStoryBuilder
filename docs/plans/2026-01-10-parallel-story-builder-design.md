# Parallel Story Builder - Design Document

**Date:** 2026-01-10
**Status:** Design Approved

## Overview

A collaborative, AI-assisted storytelling app designed exclusively for couples in long-distance relationships. Couples co-author an ongoing interactive story where each person adds one chapter per day. The AI acts as a smart co-writer: fills in descriptive gaps, suggests plot twists inspired by real-life updates, and keeps the tone romantic/playful.

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Mobile Framework** | React Native (Expo) |
| **State Management** | Zustand |
| **UI Library** | Tamagui |
| **Backend/Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Email/Password) |
| **AI Provider** | Google Gemini 2.0 Flash |
| **Real-time** | Supabase Real-time Subscriptions |
| **Serverless** | Supabase Edge Functions |

## Architecture

```
┌─────────────────────┐
│  React Native App   │
│   (Expo + Tamagui)  │
└──────────┬──────────┘
           │
           ├──► Supabase Auth (Authentication)
           ├──► Supabase DB (Queries + Real-time)
           ├──► Supabase Storage (Media)
           └──► Supabase Edge Functions (AI calls)
                      │
                      └──► Gemini API
```

### Why This Architecture?

- **Supabase-first**: No separate backend server to manage/deploy
- **Built-in real-time**: Chapters appear instantly as partner writes
- **Row Level Security**: Data security at database level
- **Edge Functions**: Run close to users globally, scalable

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

## API Endpoints (via Supabase Edge Functions)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/functions/v1/ai-enhance` | POST | Polish chapter text with AI |
| `/functions/v1/ai-twist` | POST | Generate plot twist suggestions |
| `/functions/v1/ai-continuation` | POST | Suggest narrative beats |

All database operations go through Supabase client directly.

## AI Integration with Gemini 2.0 Flash

### 1. Content Enhancement
```
System: "You are a romantic co-writer helping a couple write their shared story.
Enhance the following text with sensory details, emotional depth, and vivid imagery
while preserving the user's voice and plot. Keep it playful and romantic."
User: [chapter content + optional context snippet]
```

### 2. Plot Twist Suggestions
```
System: "Given this story context, suggest 2-3 plot twists that would surprise
and delight a couple. Each should be 1-2 sentences. Consider their real-life
context if provided."
User: [recent chapters + context snippet]
```

### 3. Inspiration Integration
```
System: "A couple shared this real-life moment: '[snippet]'. Suggest 2-3
playful ways to incorporate this into their [theme] story as a subplot,
metaphor, or scene. Keep it meaningful and not cheesy."
User: [snippet + story theme + recent context]
```

### Rate Limiting
- Cache AI responses for 24 hours
- Limit: 10 AI calls per user per day
- Cost: ~$0.075 per 1M tokens (Gemini 2.0 Flash)

## Mobile App Screens

1. **Auth Flow** - Welcome, Login, Register, Onboarding
2. **Home/Dashboard** - List of stories, create new FAB, turn indicators
3. **Story Detail** - Chapter timeline, write button, partner status
4. **Chapter Editor** - Rich text, context input, AI enhance, preview
5. **Inspiration Journal** - Timeline of entries, add/delete
6. **Story Creation Wizard** - Choose theme, name story, get pairing code

## State Management (Zustand Stores)

```typescript
// stores/authStore.ts
- user: User | null
- session: Session | null
- signIn(), signOut(), signUp()

// stores/storiesStore.ts
- stories: Story[]
- currentStory: Story | null
- fetchStories(), createStory(), joinStory()

// stores/editorStore.ts
- draftContent: string
- contextSnippet: string
- aiEnhanced: string | null
- setDraft(), enhanceWithAI(), submit()

// stores/inspirationsStore.ts
- inspirations: Inspiration[]
- fetchInspirations(), addInspiration(), delete()
```

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

## MVP Features

| Feature | Status |
|---------|--------|
| Email + Password Auth | ✅ Include |
| 6-digit Pairing Code | ✅ Include |
| Turn-based Daily Writing | ✅ Include |
| Three Core Themes | ✅ Include |
| AI Co-writer (Gemini) | ✅ Include |
| Pre-chapter Context Field | ✅ Include |
| Inspiration Journal | ✅ Include |
| Voice Narration | ⏳ Post-MVP |
| Branching Narratives | ⏳ Post-MVP |
| Export E-books | ⏳ Post-MVP |
| Illustrated Artwork | ⏳ Post-MVP |

## Project Structure

```
ParallelStoryBuilder/
├── mobile/                  # React Native app (Expo)
│   ├── app/                 # Expo Router files
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand stores
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client config
│   │   └── api.ts           # Edge function calls
│   └── assets/              # Images, fonts
├── supabase/
│   ├── functions/
│   │   ├── ai-enhance/      # Edge function
│   │   ├── ai-twist/        # Edge function
│   │   └── ai-continuation/ # Edge function
│   └── migrations/          # SQL migrations
└── docs/                    # Design docs, API specs
```

## Deployment

- **Mobile App**: Expo EAS Build → App Store + Google Play
- **Backend**: Supabase Cloud (free tier)
- **Environment**: Supabase dashboard for secrets (Gemini API key)

---

## UI/UX Guidelines

### Design Principles

**Accessibility First**
- Semantic component structure
- Proper ARIA labels for screen readers
- Keyboard navigation support
- WCAG AA+ contrast ratios
- Clear focus states on all interactive elements

**Visual Hierarchy**
- Consistent typography scale (12/14/16/18/24/32px)
- Consistent spacing using 4px/8px/16px/24px/32px scale
- Clear primary/secondary/tertiary action hierarchy
- Generous whitespace for breathing room

**Responsive Design**
- Mobile-first approach
- Touch targets >=44px (iOS) / 48px (Android)
- Safe area considerations for notched devices
- Adaptive layouts for different screen sizes

**Component Consistency**
- Unified button styles (primary/secondary/ghost)
- Consistent input fields with same padding/borders
- Card components with consistent shadows/radius
- Reusable color tokens (primary/secondary/accent)

### Design Tokens

```typescript
// Colors
colors = {
  primary: '#E91E63',      // Romantic pink
  primaryDark: '#C2185B',
  secondary: '#9C27B0',    // Deep purple
  accent: '#FF4081',       // Highlight
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
}

// Spacing (px)
spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

// Typography
fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
}

// Border Radius
radii = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
}
```

### Component Standards

**Buttons**
- Minimum height: 44px
- Padding: 12px horizontal
- Border radius: 8px
- Font weight: 600
- Smooth scale animation on press (0.97)
- Loading state with spinner

**Inputs**
- Minimum height: 44px
- Padding: 12px horizontal
- Border: 1px solid #E0E0E0
- Focus ring: 2px primary color
- Clear error messages

**Cards**
- Border radius: 16px
- Subtle shadow: 0 2px 8px rgba(0,0,0,0.08)
- Padding: 16px
- Smooth fade-in animation

**Micro-interactions**
- Button press: scale(0.97)
- Card hover: elevation increase
- Page transitions: smooth fade
- Loading: skeleton screens

### Animation Standards

```typescript
// Timing
durations = {
  fast: 150,    // Button feedback
  normal: 200,  // Hover states
  slow: 300,    // Page transitions
}

// Easing
easings = {
  ease: 'ease',
  in: 'ease-in',
  out: 'ease-out',
  inOut: 'ease-in-out',
}
```
