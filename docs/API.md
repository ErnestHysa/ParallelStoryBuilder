# API Documentation

This document describes the data models, stores, and API endpoints used in Parallel Story Builder.

## Data Models

### Profile

User profile information extending Supabase Auth.

```typescript
interface Profile {
  id: string;           // UUID from auth.users
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;   // ISO timestamp
}
```

### Story

Story metadata and configuration.

```typescript
type Theme = 'romance' | 'fantasy' | 'our_future';
type StoryStatus = 'active' | 'paused' | 'completed';

interface Story {
  id: string;
  title: string;
  theme: Theme;
  created_by: string;   // User ID of creator
  pairing_code: string; // 6-character code
  status: StoryStatus;
  current_turn: string | null;  // User ID whose turn it is
  created_at: string;
}
```

### StoryMember

Represents a user's membership in a story.

```typescript
type MemberRole = 'creator' | 'partner';

interface StoryMember {
  story_id: string;
  user_id: string;
  role: MemberRole;
  turn_order: 1 | 2 | null;  // Determines writing order
  joined_at: string;
}
```

### Chapter

Individual story segments written by users.

```typescript
interface Chapter {
  id: string;
  story_id: string;
  author_id: string;
  chapter_number: number;
  content: string;                 // Original content
  ai_enhanced_content: string | null;  // AI improved version
  context_snippet: string | null;  // Optional context for partner/AI
  created_at: string;
}
```

### Inspiration

Shared ideas and prompts for a story.

```typescript
interface Inspiration {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
```

### StoryWithMembers

Composite type for story with member information.

```typescript
interface StoryWithMembers extends Story {
  members: (StoryMember & {
    profile: Profile;
  })[];
}
```

## Zustand Stores

### authStore

Manages user authentication state.

```typescript
interface AuthState {
  user: StoredUser | null;
  profile: Profile | null;
  session: Session | null;
  isConfigured: boolean;

  initialize(): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}
```

**Usage:**

```typescript
import { useAuthStore } from '@/stores/authStore';

function MyComponent() {
  const { user, signIn, signOut } = useAuthStore();
  // ...
}
```

### storiesStore

Manages stories and chapters.

```typescript
interface StoriesState {
  stories: StoryWithMembers[];
  currentStory: StoryWithMembers | null;
  isLoading: boolean;
  error: string | null;
  currentChapter: Chapter | null;

  fetchStories(): Promise<void>;
  fetchStory(storyId: string): Promise<void>;
  createStory(title: string, theme: Theme): Promise<string>;
  joinStory(pairingCode: string): Promise<void>;
  subscribeToStory(storyId: string): Promise<void>;
  unsubscribe(): void;
  fetchLatestChapter(storyId: string): Promise<void>;
}
```

**Usage:**

```typescript
import { useStoriesStore } from '@/stores/storiesStore';

function StoryList() {
  const { stories, fetchStories, isLoading } = useStoriesStore();

  useEffect(() => {
    fetchStories();
  }, []);

  // ...
}
```

### editorStore

Manages chapter writing and AI enhancement.

```typescript
interface EditorState {
  draftContent: string;
  contextSnippet: string | null;
  isEnhancing: boolean;
  isSubmitting: boolean;
  aiEnhancedContent: string | null;

  setDraftContent(content: string): void;
  setContextSnippet(snippet: string | null): void;
  enhanceWithAI(storyId: string): Promise<void>;
  submitChapter(storyId: string): Promise<void>;
  reset(): void;
}
```

**Usage:**

```typescript
import { useEditorStore } from '@/stores/editorStore';

function WriteChapter() {
  const { draftContent, setDraftContent, enhanceWithAI } = useEditorStore();

  const handleEnhance = async () => {
    await enhanceWithAI(storyId);
  };

  // ...
}
```

### inspirationsStore

Manages inspiration journal entries.

```typescript
interface InspirationsState {
  inspirations: Inspiration[];
  isLoading: boolean;
  error: string | null;

  fetchInspirations(storyId: string): Promise<void>;
  addInspiration(storyId: string, content: string): Promise<void>;
  deleteInspiration(inspirationId: string): Promise<void>;
}
```

### demoStore

Provides demo mode data when Supabase is not configured.

```typescript
interface DemoState {
  stories: Story[];
  chapters: Record<string, Chapter[]>;
  inspirations: Inspiration[];
  isDemoMode: boolean;

  getStories(): Story[];
  getStory(id: string): Story | undefined;
  createStory(title: string, theme: Theme): Story;
  deleteStory(id: string): void;
  getChapters(storyId: string): Chapter[];
  addChapter(storyId: string, content: string): Chapter;
  updateChapter(storyId: string, chapterId: string, content: string): void;
  getInspirations(storyId: string): Inspiration[];
  addInspiration(storyId: string, content: string): void;
  deleteInspiration(id: string): void;
}
```

## Supabase Edge Functions

### POST /functions/v1/ai-enhance

Enhances chapter content with AI.

**Request:**

```typescript
{
  "content": string;      // The chapter text to enhance
  "storyId": string;      // Story ID for context
}
```

**Response:**

```typescript
{
  "enhancedContent": string;  // AI-improved version
}
```

**Rate Limit:** 10 requests per user per day

## Real-Time Subscriptions

The app subscribes to real-time updates for:

### New Chapters

```typescript
supabase
  .channel(`story:${storyId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chapters',
    filter: `story_id=eq.${storyId}`
  }, (payload) => {
    // New chapter added by partner
    // Refresh story and chapters
  })
  .subscribe();
```

### Story Updates

```typescript
supabase
  .channel(`story:${storyId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'stories',
    filter: `id=eq.${storyId}`
  }, (payload) => {
    // Story updated (e.g., turn changed)
    // Refresh story details
  })
  .subscribe();
```

## Error Handling

All async functions use try-catch and throw descriptive errors:

```typescript
try {
  await createStory(title, theme);
} catch (error) {
  // Error message is user-friendly
  // Display in alert or error message
}
```

Common errors:
- `"User not authenticated"` - User needs to sign in
- `"Invalid pairing code"` - Code doesn't match any story
- `"Story already has two members"` - Story is full
- `"Already a member of this story"` - User already joined
- `"Cannot enhance empty content"` - Write something first
- `"Rate limit exceeded"` - Too many AI requests today

## Type Safety

The app uses TypeScript throughout. All database types are defined in:

```typescript
// mobile/lib/types.ts
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: ...; Update: ...; };
      stories: { Row: Story; Insert: ...; Update: ...; };
      // ...
    };
  };
};
```

This provides autocomplete and type checking when using the Supabase client.
