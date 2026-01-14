// Custom hooks
export { useAccessibility } from './useAccessibility';
export {
  useCache,
  usePrefetch,
  useBatchCache,
  useCacheStats,
  useDebouncedCache,
  useCacheInvalidate,
  useCachedApi,
  useOptimisticCache,
  usePersistentCache
} from './useCache';
export { useAnalytics } from './useAnalytics';
export { useNotifications } from './useNotifications';

// Common React hooks (re-export for convenience)
export { useState, useEffect, useContext, useReducer, useCallback, useMemo, useRef, useImperativeHandle } from 'react';

// Navigation hooks from Expo Router
export { useNavigation, useRouter, useFocusEffect, useRootNavigationState } from 'expo-router';
export { useIsFocused } from '@react-navigation/native';

// Storage hooks
export { useAsyncStorage } from '@react-native-async-storage/async-storage';

// Network hooks
export { useNetInfo } from '@react-native-community/netinfo';

// Layout hooks
export { useSafeAreaInsets } from 'react-native-safe-area-context';

// Device hooks from React Native
export { useColorScheme } from 'react-native';

// Hook types
export type { CacheOptions, CacheHookReturn } from './useCache';
