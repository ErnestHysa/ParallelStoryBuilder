# Architecture Documentation

This document describes the architecture and design patterns used in Parallel Story Builder.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
│                      (Expo + Router)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Screens   │  │ Components  │  │     Zustand Stores  │ │
│  │  (app/*.tsx) │  │ (components/)│  │     (stores/)       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                      │             │
│         └────────────────┴──────────────────────┘             │
│                              │                                │
├──────────────────────────────┼───────────────────────────────┤
│                              │                                │
│  ┌───────────────────────────▼─────────────────────────────┐ │
│  │                    Supabase Client                        │ │
│  │              (Auth + Database + Real-time)               │ │
│  └───────────────────────────┬─────────────────────────────┘ │
│                              │                                │
├──────────────────────────────┼───────────────────────────────┤
│                              │                                │
│  ┌───────────────────────────▼─────────────────────────────┐ │
│  │                    Supabase Cloud                         │ │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐ │ │
│  │  │ PostgreSQL  │ │    Auth      │ │  Edge Functions  │ │ │
│  │  │   (Tables)  │ │  (Sessions)  │ │   (AI Calls)     │ │ │
│  │  └─────────────┘ └──────────────┘ └──────────────────┘ │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │ Gemini 2.0 AI │
                      └───────────────┘
```

## Design Principles

### 1. Demo-First Architecture

The app is designed to work without any backend setup:

```typescript
// Auto-detect configuration
const isConfigured = isSupabaseConfigured();

// Use appropriate store
const data = isConfigured
  ? useStoriesStore.getState().stories
  : useDemoStore.getState().stories;
```

Benefits:
- Users can try the app immediately
- Development is faster without backend setup
- UI can be built and tested independently

### 2. Unidirectional Data Flow

Following React best practices:

```
User Action → Store Method → API Call → State Update → Re-render
```

Example:

```typescript
// User clicks "Create Story"
const handleCreate = async () => {
  // Store method
  const storyId = await createStory(title, theme);

  // API call (inside store)
  // State update (inside store)

  // Re-render automatic
  router.back();
};
```

### 3. Type Safety

Every piece of data is typed:

```typescript
// Database types
export interface Story {
  id: string;
  title: string;
  theme: Theme;
  // ...
}

// Store types
interface StoriesState {
  stories: StoryWithMembers[];
  createStory: (title: string, theme: Theme) => Promise<string>;
}

// Component props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  onPress?: () => void;
}
```

### 4. Separation of Concerns

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Screens** | UI composition, user interaction | HomeScreen, StoryDetailScreen |
| **Components** | Reusable UI elements | Button, Card, Input |
| **Stores** | Business logic, state management | authStore, storiesStore |
| **Lib** | Utilities, configurations | supabase client, types |

## State Management

### Zustand Pattern

Zustand is used for global state due to its simplicity:

```typescript
// Create store
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  signIn: async (email, password) => {
    const { data } = await supabase.auth.signIn({ email, password });
    set({ user: data.user });
  },
}));

// Use in component
function LoginScreen() {
  const { signIn } = useAuthStore();
  // ...
}
```

### Local vs Global State

| State Type | Storage | Example |
|------------|---------|---------|
| **Global** | Zustand store | User auth, stories list |
| **Screen-local** | useState | Form input, modal visibility |
| **Navigation** | Expo Router | Current route, params |

## Routing Structure

Expo Router uses file-based routing:

```
app/
├── _layout.tsx           # Root layout
├── index.tsx             # Entry point (redirects)
├── (auth)/               # Auth group (protected when logged in)
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
└── (app)/                # App group (protected when logged out)
    ├── _layout.tsx
    ├── index.tsx         # Home / Stories list
    ├── create-story.tsx
    ├── join-story.tsx
    ├── story/[id].tsx
    ├── write/[id].tsx
    └── inspirations/[id].tsx
```

**Route groups** `(auth)` and `(app)` are for organization only - they don't affect URLs.

## Component Architecture

### Component Hierarchy

```
AppLayout (Stack Navigator)
├── AuthLayout (Stack Navigator)
│   ├── LoginScreen
│   └── RegisterScreen
└── MainLayout (Stack Navigator)
    ├── HomeScreen
    │   ├── Button
    │   ├── Card
    │   └── LoadingSpinner
    ├── CreateStoryScreen
    ├── StoryDetailScreen
    └── ...
```

### Component Props Pattern

All components use explicit props with TypeScript:

```typescript
interface CardProps {
  variant?: 'elevated' | 'outlined' | 'flat';
  children: React.ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function Card({ variant, children, ... }: CardProps) {
  // ...
}
```

### Accessibility

All interactive elements have accessibility props:

```typescript
<TouchableOpacity
  onPress={handlePress}
  accessibilityLabel="Delete story"
  accessibilityHint="Removes this story permanently"
  accessibilityRole="button"
  accessibilityState={{ disabled: isLoading }}
>
```

## Data Layer

### Supabase Client

Configured with TypeScript types:

```typescript
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: secureStorageAdapter,
      autoRefreshToken: true,
    },
  }
);
```

### Query Patterns

**Single item:**

```typescript
const { data, error } = await supabase
  .from('stories')
  .select('*')
  .eq('id', storyId)
  .single();
```

**List with relations:**

```typescript
const { data } = await supabase
  .from('story_members')
  .select(`
    *,
    profile:profiles(*)
  `)
  .eq('story_id', storyId);
```

**Real-time subscription:**

```typescript
const channel = supabase
  .channel(`story:${storyId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chapters',
    filter: `story_id=eq.${storyId}`
  }, (payload) => {
    // Handle update
  })
  .subscribe();

// Cleanup
return () => {
  channel.unsubscribe();
};
```

## Error Handling

### Error Boundaries

The app uses React's error boundaries (via Expo):

```typescript
// In _layout.tsx
<ErrorBoundary fallback={ErrorScreen}>
  <Stack />
</ErrorBoundary>
```

### Try-Catch Pattern

All async operations use try-catch:

```typescript
const handleSubmit = async () => {
  setIsLoading(true);
  setError('');

  try {
    await createStory(title, theme);
    router.back();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
  } finally {
    setIsLoading(false);
  }
};
```

### User-Friendly Messages

Technical errors are converted to user-friendly messages:

```typescript
// Store
if (!user) {
  throw new Error('User not authenticated');
}

// Screen
} catch (err) {
  Alert.alert('Authentication Error', 'Please sign in to continue');
}
```

## Performance Optimizations

### Memoization

Expensive computations are memoized:

```typescript
const themeInfo = useMemo(() => THEME_INFO[story.theme], [story.theme]);
```

### Lazy Loading

Routes are loaded on demand (Expo Router default).

### List Optimization

FlatList is used for long lists (when implemented):

```typescript
<FlatList
  data={stories}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <StoryCard story={item} />}
/>
```

## Security

### Row Level Security (RLS)

All database tables have RLS policies:

```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

### Secure Storage

Auth sessions are stored using Expo SecureStore:

```typescript
class SecureStorageAdapter {
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }
}
```

### Environment Variables

Sensitive data is never hardcoded:

```typescript
// ✅ Good
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;

// ❌ Bad
const url = 'https://xxxxx.supabase.co';
```

## Testing Strategy

### Unit Tests

For pure functions and utilities:

```typescript
describe('generatePairingCode', () => {
  it('generates a 6-character code', () => {
    const code = generatePairingCode();
    expect(code).toHaveLength(6);
  });
});
```

### Integration Tests

For store logic:

```typescript
it('creates a story and updates the store', async () => {
  const { createStory, stories } = useStoriesStore.getState();
  await createStory('Test Story', 'romance');
  expect(stories).toHaveLength(1);
});
```

### E2E Tests

For critical user flows (using Expo Detox):

```typescript
it('allows creating a story', async () => {
  await element(by.id('create-story-button')).tap();
  await element(by.id('story-title')).typeText('My Story');
  await element(by.id('submit-button')).tap();
  await expect(element(by.text('My Story'))).toBeVisible();
});
```

## Deployment

### Mobile App

Built with Expo EAS:

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Backend

Supabase handles deployment:
- Database migrations via SQL Editor or CLI
- Edge Functions via Supabase CLI
- Environment secrets via dashboard

## Contributing

When adding new features:

1. **Add types first** in `lib/types.ts`
2. **Update store** if state is needed
3. **Create component** if new UI is needed
4. **Add screen** if new route is needed
5. **Add tests** for business logic
6. **Update docs** (this file, API.md)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.
