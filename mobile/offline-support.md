# Offline Support System

## Overview

The offline support system for Parallel Story Builder ensures that users can continue using the app even when they don't have an internet connection. When connectivity is restored, pending actions are automatically synced to the server.

## Components

### 1. OfflineStorage (`lib/offlineStorage.ts`)

An AsyncStorage wrapper with TTL support for caching data offline.

**Features:**
- TTL-based expiration
- Key prefixing for namespacing
- Automatic cleanup of expired items
- Generic storage with typed utilities

**Usage:**
```typescript
import { offlineStorage } from '@/lib/offlineStorage';

// Cache user data
await offlineStorage.setItem('userProfile', userData, {
  ttl: 24 * 60 * 60 * 1000 // 24 hours
});

// Retrieve cached data
const cachedUser = await offlineStorage.getItem('userProfile');
```

### 2. OfflineStore (`stores/offlineStore.ts`)

Zustand store for managing offline action queue and synchronization.

**Features:**
- Action queuing with retry logic
- Automatic sync on connection restore
- Persistent queue storage
- Status tracking for each action

**Usage:**
```typescript
import { useOfflineStore } from '@/stores/offlineStore';
import { offlineActions } from '@/stores/offlineStore';

// Check connection status
const { isConnected } = useOfflineStore();

// Queue an action for offline sync
await offlineActions.createChapter(chapterData);
```

### 3. NetworkListener (`lib/networkListener.ts`)

Real-time network monitoring using @react-native-community/netinfo.

**Features:**
- Automatic connection state updates
- Internet reachability checking
- Network state hooks for components

**Usage:**
```typescript
import { useNetworkState } from '@/lib/networkListener';

// In component
const { isConnected } = useNetworkState();
```

### 4. OfflineBanner (`components/OfflineBanner.tsx`)

Network status indicator component.

**Features:**
- Shows connection status
- Displays action queue count
- Manual sync trigger
- Expandable queue details

### 5. ErrorBoundary (`components/ErrorBoundary.tsx`)

React error boundary with fallback UI and error recovery.

**Features:**
- Catches JavaScript errors
- Retry mechanism
- Custom error fallbacks
- Error classification

### 6. ErrorHandling (`lib/errorHandling.ts`)

Comprehensive error handling utilities.

**Features:**
- AppError class with severity levels
- Error categorization
- Global error handlers
- Retry mechanisms

### 7. Sentry Integration (`lib/sentry.ts`)

Error reporting with Sentry.

**Features:**
- Error capture
- Breadcrumb logging
- Performance monitoring
- Custom event tracking

## Integrated Features

### Story Creation
Stories are created offline with:
- Local state management
- Temporary ID generation
- Automatic sync when online

### Story Joining
Joining stories includes:
- Offline queue support
- Local validation
- Sync on connection restore

### Profile Updates
Profile updates are:
- Applied locally immediately
- Queued for sync when offline
- Merged with server data

## Implementation Details

### Queue Management
- Actions are queued with metadata
- Max retry limit (3 attempts)
- Exponential backoff for retries
- Status tracking (pending/failed/synced)

### Data Synchronization
- Automatic sync on connection restore
- Manual sync option via banner
- Conflict resolution strategy
- Optimistic UI updates

### Error Recovery
- Retry with different strategies
- User-friendly error messages
- Graceful degradation
- Detailed error reporting

## Usage Examples

### Creating a Chapter Offline
```typescript
try {
  await storiesStore.createChapter(chapterData);
} catch (error) {
  if (error.message.includes('queued for offline sync')) {
    // User is shown the offline banner
    // Chapter is created locally and synced later
  }
}
```

### Handling Network Changes
```typescript
const { isConnected } = useNetworkState();

if (!isConnected) {
  // Show offline mode UI
  // Disable non-essential features
}
```

### Error Boundary Protection
```typescript
<ErrorBoundary fallback={ErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

## Configuration

### Sentry
Update `lib/sentry.ts` with your DSN:
```typescript
const SENTRY_DSN = 'your-sentry-dsn';
```

### Network Listener
The network listener is automatically started in `_layout.tsx`.

### Offline Storage
Storage instances can be configured with different TTLs:
```typescript
export const userStorage = new OfflineStorage({
  prefix: 'user_',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
});
```

## Testing

### Offline Scenarios
1. Disable network during operations
2. Verify actions are queued
3. Restore connection and verify sync
4. Check queue persistence across app restarts

### Error Handling
1. Trigger JavaScript errors
2. Verify error boundaries catch them
3. Test retry mechanisms
4. Verify error reporting

### Performance
1. Measure sync performance
2. Test queue handling with many actions
3. Verify cache expiration works
4. Check memory usage