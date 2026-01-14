# Contributing Guide

Thank you for your interest in contributing to Parallel Story Builder! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When filing a bug report, include:

- **Title**: Clear and descriptive
- **Description**: What happened and what you expected
- **Steps to reproduce**: numbered steps
- **Environment**: OS, device, app version
- **Screenshots**: If applicable

**Example:**

```
Title: App crashes when creating a story with special characters

Description:
When I enter a story title with emoji, the app crashes.

Steps to reproduce:
1. Tap "Create New Story"
2. Enter title: "My Story 💕"
3. Select "Romance" theme
4. Tap "Create Story"
5. App crashes

Environment:
- iPhone 12 Pro
- iOS 17.2
- App version 1.0.0
```

### Suggesting Enhancements

We welcome enhancement suggestions! Please:

1. Check if the idea has already been suggested
2. Describe the enhancement clearly
3. Explain why it would be useful
4. Provide examples if possible

### Pull Requests

We welcome pull requests! Here's how to contribute:

#### 1. Set Up Your Development Environment

```bash
# Fork the repository
# Clone your fork
git clone https://github.com/your-username/parallel-story-builder.git
cd parallel-story-builder
cd mobile
npm install
```

#### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

#### 3. Make Your Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- Commit with clear messages

#### 4. Test Your Changes

```bash
# Run type checking
npx tsc --noEmit

# Run linter
npm run lint

# Test on simulator/emulator
npm start
```

#### 5. Submit Your Pull Request

- Push to your fork
- Create a pull request with a clear description
- Link any related issues
- Request review from maintainers

## Development Guidelines

### Code Style

We use TypeScript and follow these conventions:

```typescript
// ✅ Good
import { View, Text } from 'react-native';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/stores/authStore';

export function MyScreen() {
  const { user } = useAuthStore();

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user.email}</Text>
      <Button onPress={handlePress}>Continue</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
});
```

### Component Guidelines

- Use functional components with hooks
- Accept `props` as a typed interface
- Use `StyleSheet.create` for styles
- Include accessibility props

```typescript
interface MyComponentProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

export function MyComponent({ title, onPress, disabled }: MyComponentProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}
```

### Store Guidelines

When adding to a Zustand store:

1. Define the state interface
2. Implement actions with error handling
3. Update TypeScript types

```typescript
// Add new state
interface MyState {
  newValue: string;
  setNewValue: (value: string) => void;
}

// Add to store
export const useMyStore = create<MyState>((set) => ({
  newValue: '',
  setNewValue: (value: string) => {
    set({ newValue: value });
  },
}));
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | `kebab-case` | `my-component.tsx` |
| Components | `PascalCase` | `MyComponent` |
| Functions | `camelCase` | `handleSubmit` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_CHAPTERS` |
| Interfaces | `PascalCase` | `UserProfile` |
| Types | `PascalCase` | `Theme` |

## Project Structure

When adding new features, place files in the appropriate directory:

```
mobile/
├── app/                 # New screens go here
│   └── (app)/
│       └── new-feature.tsx
├── components/          # New reusable components go here
│   └── NewComponent.tsx
├── stores/              # New state management goes here
│   └── newFeatureStore.ts
└── lib/                 # New utilities go here
    └── newHelper.ts
```

## Testing

### Write Tests For:

- Complex utility functions
- Store logic
- Critical user flows

### Test Location:

Place tests next to the file they test:

```
stores/
├── authStore.ts
└── authStore.test.ts
```

### Example Test:

```typescript
import { describe, it, expect } from '@jest/globals';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  it('initializes with no user', () => {
    const { user } = useAuthStore.getState();
    expect(user).toBeNull();
  });

  it('signs in user with valid credentials', async () => {
    const { signIn } = useAuthStore.getState();
    // Mock supabase call
    await signIn('test@example.com', 'password');
    // Assert user is logged in
  });
});
```

## Documentation

When adding features:

1. **Update types** in `lib/types.ts` with new data models
2. **Update API.md** with new endpoints or state
3. **Update ARCHITECTURE.md** for significant architectural changes
4. **Add comments** for complex logic

```typescript
/**
 * Creates a new story with the given title and theme.
 * Generates a unique 6-character pairing code for sharing.
 *
 * @param title - The story title
 * @param theme - The story theme (romance, fantasy, our_future)
 * @returns The ID of the created story
 * @throws Error if user is not authenticated
 */
async function createStory(title: string, theme: Theme): Promise<string> {
  // ...
}
```

## Commit Messages

Follow conventional commit format:

```
feat: add story deletion feature
fix: prevent duplicate chapter submission
docs: update API documentation
refactor: simplify auth store logic
test: add tests for chapter submission
```

## Getting Help

If you need help:

1. Check existing documentation
2. Search existing issues and discussions
3. Ask a question in a new discussion
4. Join our Discord server (if available)

## Recognition

Contributors will be recognized in:
- The CONTRIBUTORS file
- Release notes for significant contributions
- Project documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Parallel Story Builder! 💕
