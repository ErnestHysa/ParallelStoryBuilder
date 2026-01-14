import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cacheManager, CacheItem, createCacheKey } from '../lib/cacheManager';

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
  persist?: boolean;
  keyPrefix?: string;
}

export interface CacheHookReturn<T = any> {
  data: T | null;
  isLoading: boolean;
  error: any | null;
  set: (value: T) => void;
  get: () => T | null;
  remove: () => void;
  clear: () => void;
  refetch: () => Promise<void>;
  isStale: boolean;
  size: number;
}

/**
 * React hook for using the cache manager
 */
export function useCache<T = any>(
  key: string,
  options: CacheOptions = {}
): CacheHookReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const [isStale, setIsStale] = useState(false);
  const optionsRef = useRef(options);

  // Update ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Check if data is stale
  useEffect(() => {
    const cachedData = cacheManager.get<T>(key);
    if (cachedData) {
      const item = cacheManager as any;
      const timestamp = (cachedData as any)._timestamp || Date.now();
      const ttl = optionsRef.current.ttl;

      if (ttl && Date.now() - timestamp > ttl) {
        setIsStale(true);
      } else {
        setIsStale(false);
      }
    }
  }, [key, optionsRef.current.ttl]);

  // Set cache value
  const set = useCallback((value: T) => {
    const { ttl } = optionsRef.current;
    const item: CacheItem<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      size: JSON.stringify(value).length * 2, // Rough size estimate
    };

    cacheManager.set(key, value, { ttl, size: item.size });
    setData(value);
    setIsStale(false);
    setError(null);
  }, [key]);

  // Get cached value
  const get = useCallback((): T | null => {
    const value = cacheManager.get<T>(key);
    setData(value);
    return value;
  }, [key]);

  // Remove cached value
  const remove = useCallback(() => {
    cacheManager.delete(key);
    setData(null);
    setIsStale(true);
    setError(null);
  }, [key]);

  // Clear cache
  const clear = useCallback(() => {
    cacheManager.clear();
    setData(null);
    setIsStale(true);
    setError(null);
  }, []);

  // Refetch data
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would typically fetch from an API
      // For now, we'll just simulate a fetch
      await new Promise(resolve => setTimeout(resolve, 100));

      // After refetch, the data is fresh
      setIsStale(false);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  // Size of cache
  const size = cacheManager.size();

  return useMemo(() => ({
    data,
    isLoading,
    error,
    set,
    get,
    remove,
    clear,
    refetch,
    isStale,
    size,
  }), [data, isLoading, error, set, get, remove, clear, refetch, isStale, size]);
}

/**
 * Hook for prefetching cache data
 */
export function usePrefetch() {
  const prefetch = useCallback(async (
    key: string,
    fetchFn: () => Promise<any>,
    options: CacheOptions = {}
  ) => {
    if (!cacheManager.has(key)) {
      try {
        const data = await fetchFn();
        cacheManager.set(key, data, {
          ttl: options.ttl,
          size: JSON.stringify(data).length * 2,
        });
      } catch (error) {
        console.warn(`Failed to prefetch ${key}:`, error);
      }
    }
  }, []);

  const prefetchPattern = useCallback(async (
    pattern: RegExp,
    keys: string[],
    fetchFn: (key: string) => Promise<any>,
    options: CacheOptions = {}
  ) => {
    cacheManager.prefetch(pattern, keys, async (key) => {
      try {
        const data = await fetchFn(key);
        cacheManager.set(key, data, {
          ttl: options.ttl,
          size: JSON.stringify(data).length * 2,
        });
      } catch (error) {
        console.warn(`Failed to prefetch ${key}:`, error);
      }
    });
  }, []);

  return { prefetch, prefetchPattern };
}

/**
 * Hook for batch cache operations
 */
export function useBatchCache<T = any>() {
  const batchSet = useCallback((entries: Array<{ key: string; value: T; options?: CacheOptions }>) => {
    cacheManager.batchSet(entries.map(entry => ({
      key: entry.key,
      data: entry.value,
      options: {
        ttl: entry.options?.ttl,
        size: JSON.stringify(entry.value).length * 2,
      },
    })));
  }, []);

  const batchGet = useCallback((keys: string[]): (T | null)[] => {
    return cacheManager.batchGet<T>(keys);
  }, []);

  return { batchSet, batchGet };
}

/**
 * Hook for cache statistics
 */
export function useCacheStats() {
  const [stats, setStats] = useState(cacheManager.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheManager.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

/**
 * Hook for debounced cache updates
 */
export function useDebouncedCache<T = any>(key: string, delay: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const set = useCallback((value: T) => {
    setDebouncedValue(value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      cacheManager.set(key, value, { size: JSON.stringify(value).length * 2 });
    }, delay);
  }, [key, delay]);

  const get = useCallback((): T | null => {
    clearTimeout(timeoutRef.current);
    return cacheManager.get<T>(key);
  }, [key]);

  // Sync with cache changes
  useEffect(() => {
    const cachedValue = cacheManager.get<T>(key);
    if (cachedValue !== debouncedValue) {
      setDebouncedValue(cachedValue);
    }
  }, [key, debouncedValue]);

  return { data: debouncedValue, set, get };
}

/**
 * Hook for cache invalidation patterns
 */
export function useCacheInvalidate() {
  const invalidateByPrefix = useCallback((prefix: string) => {
    const keys = cacheManager.keys();
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        cacheManager.delete(key);
      }
    });
  }, []);

  const invalidateByPattern = useCallback((pattern: RegExp) => {
    const keys = cacheManager.keys();
    keys.forEach(key => {
      if (pattern.test(key)) {
        cacheManager.delete(key);
      }
    });
  }, []);

  return { invalidateByPrefix, invalidateByPattern };
}

/**
 * Hook for cached API calls
 */
export function useCachedApi<T = any>(
  key: string,
  apiCall: () => Promise<T>,
  options: CacheOptions & { refetchOnWindowFocus?: boolean; refetchOnReconnect?: boolean } = {}
) {
  const { data, isLoading, error, set, remove, refetch, isStale } = useCache<T>(key, options);
  const { prefetch } = usePrefetch();

  // Auto-fetch on mount
  useEffect(() => {
    const initialFetch = async () => {
      if (!data || isStale) {
        try {
          const result = await apiCall();
          set(result);
        } catch (err) {
          console.error('[useCachedApi] Error fetching data:', err);
        }
      }
    };

    initialFetch();
  }, [key, data, isStale, apiCall, set]);

  // Refetch on window focus - not applicable in React Native
  // Prefetch for likely next items
  const prefetchNext = useCallback((nextKeys: string[], fetchFn: (key: string) => Promise<T>) => {
    for (const nextKey of nextKeys) {
      prefetch(nextKey, () => fetchFn(nextKey), options);
    }
  }, [prefetch, options]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate: remove,
    isStale,
    prefetchNext,
  };
}

/**
 * Hook for optimistic cache updates
 */
export function useOptimisticCache<T = any>(key: string) {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const updateOptimistically = useCallback((updateFn: (current: T | null) => T) => {
    const currentValue = cacheManager.get<T>(key);
    const newValue = updateFn(currentValue);

    // Update cache immediately
    cacheManager.set(key, newValue, { size: JSON.stringify(newValue).length * 2 });
    setOptimisticData(newValue);
    setIsOptimistic(true);

    return newValue;
  }, [key]);

  const revert = useCallback(() => {
    const cachedValue = cacheManager.get<T>(key);
    setOptimisticData(cachedValue);
    setIsOptimistic(false);
  }, [key]);

  const confirm = useCallback((finalValue: T) => {
    cacheManager.set(key, finalValue, { size: JSON.stringify(finalValue).length * 2 });
    setOptimisticData(finalValue);
    setIsOptimistic(false);
  }, [key]);

  return {
    data: optimisticData,
    isOptimistic,
    updateOptimistically,
    revert,
    confirm,
  };
}

/**
 * Hook for cache persistence
 */
export function usePersistentCache<T = any>(key: string, storageKey?: string) {
  const { data, set, remove, ...rest } = useCache<T>(key);
  const storageKeyRef = useRef(storageKey || `persistent:${key}`);

  // Load from persistent storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKeyRef.current);
      if (stored) {
        const parsed = JSON.parse(stored);
        set(parsed);
      }
    } catch (error) {
      console.warn('Failed to load from persistent storage:', error);
    }
  }, [set]);

  // Save to persistent storage when data changes
  useEffect(() => {
    if (data !== null) {
      try {
        localStorage.setItem(storageKeyRef.current, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save to persistent storage:', error);
      }
    }
  }, [data]);

  // Clear from persistent storage
  const persistentClear = useCallback(() => {
    try {
      localStorage.removeItem(storageKeyRef.current);
    } catch (error) {
      console.warn('Failed to clear from persistent storage:', error);
    }
    remove();
  }, [remove]);

  return {
    data,
    set,
    remove: persistentClear,
    ...rest,
  };
}