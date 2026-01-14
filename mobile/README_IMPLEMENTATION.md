# Mobile Implementation Guide - Parallel Story Builder

## Introduction

This document provides a comprehensive guide for the mobile implementation of Parallel Story Builder, a collaborative storytelling application for couples and friends built with Expo and React Native.

## Quick Start

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account (for production features)
- iOS/Android simulator or physical device

### 1. Setup Environment
```bash
cd mobile
npm install
```

### 2. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Supabase credentials
nano .env
```

### 3. Run the App
```bash
# Start development server
npx expo start

# Or with tunnel for remote access
npx expo start --tunnel

# For specific platforms
npx expo start --ios
npx expo start --android
```

## Project Architecture

### Core Components

#### 1. App Layout (`app/(app)/_layout.tsx`)
- **Navigation**: Expo Router-based file system routing
- **Error Handling**: DefaultErrorBoundary wrapper
- **Network Status**: OfflineBanner for connectivity
- **Biometric Lock**: Security lock when offline
- **Global Styles**: Consistent theming

#### 2. Home Screen (`app/(app)/index.tsx`)
- Story list with filtering
- Quick actions (create, join)
- Story statistics
- Floating action button

#### 3. Story Editor (`app/(app)/write/[id].tsx`)
- Rich text editing
- AI-powered suggestions
- Media attachments
- Auto-save with debouncing
- Version history

#### 4. Relationship Features
- Daily intentions tracker
- Question system
- Milestone celebration
- Partner insights

### State Management with Zustand

All state is managed through specialized Zustand stores:

#### authStore.ts
```typescript
// Handles authentication, profiles, and user settings
const { user, profile, signIn, signUp, signOut } = useAuthStore();
```

#### storiesStore.ts
```typescript
// Manages stories, chapters, and collaboration
const { stories, currentStory, createStory, joinStory } = useStoriesStore();
```

#### editorStore.ts
```typescript
// Controls editor state and AI features
const { content, aiSuggestions, autoSave } = useEditorStore();
```

#### relationshipStore.ts
```typescript
// Manages relationship features
const { questions, milestones, dailyIntention } = useRelationshipStore();
```

## Key Features Implementation

### 1. Authentication Flow

```typescript
// Demo mode support
if (!isSupabaseConfigured) {
  // Use mock data and offline functionality
  return <DemoLogin />;
}

// Real authentication
const { signIn } = useAuthStore();
await signIn(email, password);
```

### 2. Story Creation and Editing

```typescript
// Create new story
const { createStory } = useStoriesStore();
await createStory({
  title: "Our Love Story",
  description: "A journey through our relationship",
  isPrivate: true,
});

// Edit with AI assistance
const { generateContent } = useEditorStore();
const suggestion = await generateContent(prompt);
```

### 3. Real-time Collaboration

```typescript
// Real-time subscriptions
const storyChannel = supabase
  .channel(`story:${storyId}`)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chapters' }, handleUpdate)
  .subscribe();

// Presence indicators
const { updatePresence } = usePresenceStore();
updatePresence(storyId, 'typing');
```

### 4. Media Management

```typescript
// Upload images
const { uploadImage } = useStoriesStore();
const url = await uploadImage(image, storyId);

// Attach to chapter
await addMediaAttachment({
  url,
  type: 'image',
  caption: 'Our first date'
});
```

## Testing Features

### 1. Unit Testing with Jest
```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### 2. Manual Testing Checklist

#### Authentication
- [ ] Email/password sign up
- [ ] Social login (if configured)
- [ ] Profile update
- [ ] Password reset
- [ ] Biometric lock
- [ ] Demo mode fallback

#### Story Features
- [ ] Create new story
- [ ] Join existing story
- [ ] Edit chapters
- [ ] Add media attachments
- [ ] Auto-save functionality
- [ ] Offline editing

#### Relationship Features
- [ ] Set daily intention
- [ ] Ask questions
- [ ] Create milestones
- [ ] View insights

#### AI Features
- [ ] Generate story content
- [ ] Get suggestions
- [ ] Style transfer
- [ ] Token usage tracking

### 3. Demo Mode Testing

The app includes a comprehensive demo mode that works without Supabase configuration:

```bash
# Test with no Supabase setup
cp .env.example .env  # Keep empty
npx expo start
```

Demo mode features:
- Full app functionality
- Mock user data
- Story creation and editing
- All relationship features
- AI suggestions with mock data
- Token economy simulation
- Achievement system

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear Expo cache
npx expo start --clear

# Reset node modules
rm -rf node_modules
npm install
```

#### 2. Network Errors
```bash
# Check Supabase configuration
echo $EXPO_PUBLIC_SUPABASE_URL

# Test connectivity
curl $EXPO_PUBLIC_SUPABASE_URL
```

#### 3. iOS Simulator Issues
```bash
# Reset simulator
xcrun simctl erase all

# Open specific simulator
xcrun simctl boot "iPhone 14"
```

#### 4. Android Emulator Problems
```bash
# Clear Android cache
adb shell pm clear com.parallelstorybuilder

# Restart emulator
emulator @android_emulator_name -wipe-data
```

### Debug Mode

Enable debugging features:
```typescript
// In any component
import { useDemoStore } from '@/stores/demoStore';

const { debugMode } = useDemoStore();

// Toggle debug mode
await toggleDebugMode();
```

### Performance Monitoring

Check app performance:
```bash
# React DevTools Profiler
# Enable in Expo dev menu: Shake device → Dev Settings → Profiler

# Performance metrics
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs();
```

## Platform-Specific Guides

### iOS Development

1. **Requirements**
   - macOS
   - Xcode 14+
   - iOS 16.0+

2. **Build for iOS**
```bash
npx expo build:ios
```

3. **iOS Specific Features**
   - Face ID authentication
   - Share sheet integration
   - Photo library access
   - Background app refresh

### Android Development

1. **Requirements**
   - Android Studio
   - Android API 33+
   - NDK (for native modules)

2. **Build for Android**
```bash
npx expo build:android
```

3. **Android Specific Features**
   - Fingerprint authentication
   - File system access
   - Background sync
   - Adaptive icons

## Deployment Guide

### 1. Expo EAS Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform all --profile production
```

### 2. App Store Submission

#### iOS App Store
1. Create App Store Connect account
2. Generate distribution certificates
3. Archive and upload via Xcode
4. Fill out app information
5. Submit for review

#### Android Play Store
1. Create Google Play Console account
2. Generate signed APK/AAB
3. Upload app bundle
4. Complete store listing
5. Submit for review

### 3. Environment Configuration for Production

```env
# Production environment
EXPO_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=prod-key
EXPO_PUBLIC_SENTRY_DSN=prod-sentry-dsn
```

## Best Practices

### 1. Code Organization
- Use absolute imports (`@/components/`)
- Keep components small and focused
- Use TypeScript for type safety
- Follow naming conventions

### 2. Performance
- Use FlatList/FlashList for lists
- Optimize images with Fast Image
- Implement lazy loading
- Debounce expensive operations

### 3. Accessibility
- Add accessibility labels
- Support dynamic type
- Ensure color contrast
- Test with VoiceOver

### 4. Error Handling
- Show user-friendly messages
- Log errors for debugging
- Implement fallback UI
- Handle edge cases

### 5. Security
- Store sensitive data securely
- Validate all inputs
- Use HTTPS only
- Implement proper auth flow

## Contributing

### Development Workflow
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request
5. Code review process

### Code Style
```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

## Support

For issues and questions:
1. Check troubleshooting section
2. Search existing issues
3. Create new issue with detailed description
4. Include device logs and environment info

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Guide](https://reactnative.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Expo Router](https://docs.expo.dev/routing/introduction/)