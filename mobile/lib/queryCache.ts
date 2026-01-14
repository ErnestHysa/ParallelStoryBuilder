import { cacheManager, createCacheKey } from './cacheManager';
import { SupabaseClient } from '@supabase/supabase-js';

export interface QueryCacheOptions {
  staleTime?: number;
  gcTime?: number;
  retryCount?: number;
  retryDelay?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchOnMount?: boolean;
}

export interface QueryResult<T = any> {
  data: T | null;
  error: any | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  status: 'loading' | 'success' | 'error';
  refetch: () => Promise<QueryResult<T>>;
  isStale: boolean;
}

export interface QueryKey {
  queryKey: string[];
  options?: QueryCacheOptions;
}

export class QueryCache {
  private supabase: SupabaseClient;
  private queries = new Map<string, QueryResult<any>>();
  private subscribers = new Map<string, Set<() => void>>();
  private refetchTimers = new Map<string, NodeJS.Timeout>();
  private isOnline = navigator.onLine;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;

    // Set up online/offline listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.refetchStaleQueries();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Set up focus/refetch listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        if (this.isOnline) {
          this.refetchStaleQueries();
        }
      });

      window.addEventListener('reconnect', () => {
        if (this.isOnline) {
          this.refetchStaleQueries();
        }
      });
    }
  }

  /**
   * Fetch data with caching and automatic refetching
   */
  async fetch<T = any>(
    queryKey: string[],
    queryFn: () => Promise<T>,
    options: QueryCacheOptions = {}
  ): Promise<QueryResult<T>> {
    const cacheKey = createCacheKey('query', ...queryKey);
    const cacheOptions: QueryCacheOptions = {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retryCount: 3,
      retryDelay: 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      ...options,
    };

    // Check if we have cached data that's not stale
    const cachedData = cacheManager.get<T>(cacheKey);
    if (cachedData && !this.isStale(cachedData, cacheOptions.staleTime!)) {
      return this.createResult<T>({
        data: cachedData,
        error: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
        status: 'success',
        queryKey,
        options: cacheOptions,
        refetch: () => this.fetch(queryKey, queryFn, cacheOptions),
        isStale: false,
      });
    }

    // If already loading, return existing query
    const existingQuery = this.queries.get(cacheKey);
    if (existingQuery && existingQuery.isLoading) {
      return existingQuery;
    }

    // Start loading
    this.queries.set(cacheKey, this.createResult({
      data: cachedData,
      error: null,
      isLoading: true,
      isSuccess: false,
      isError: false,
      status: 'loading',
      queryKey,
      options: cacheOptions,
      refetch: () => this.fetch(queryKey, queryFn, cacheOptions),
      isStale: true,
    }));

    // Notify subscribers
    this.notifySubscribers(cacheKey);

    try {
      const data = await this.executeWithRetry(queryFn, cacheOptions.retryCount!, cacheOptions.retryDelay!);

      // Update cache
      cacheManager.set(cacheKey, data, {
        ttl: cacheOptions.gcTime,
      });

      // Update query result
      const result = this.createResult({
        data,
        error: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
        status: 'success',
        queryKey,
        options: cacheOptions,
        refetch: () => this.fetch(queryKey, queryFn, cacheOptions),
        isStale: false,
      });

      this.queries.set(cacheKey, result);
      this.notifySubscribers(cacheKey);

      return result;
    } catch (error) {
      // Update query result with error
      const result = this.createResult({
        data: cachedData,
        error,
        isLoading: false,
        isSuccess: false,
        isError: true,
        status: 'error',
        queryKey,
        options: cacheOptions,
        refetch: () => this.fetch(queryKey, queryFn, cacheOptions),
        isStale: true,
      });

      this.queries.set(cacheKey, result);
      this.notifySubscribers(cacheKey);

      return result;
    }
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    delay: number
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }

    throw lastError;
  }

  /**
   * Invalidate specific query
   */
  invalidateQuery(queryKey: string[]): void {
    const cacheKey = createCacheKey('query', ...queryKey);
    cacheManager.delete(cacheKey);
    this.queries.delete(cacheKey);
    this.notifySubscribers(cacheKey);
  }

  /**
   * Invalidate queries matching a pattern
   */
  invalidateQueries(predicate: (key: string[]) => boolean): void {
    cacheManager.keys().forEach(key => {
      const queryKey = key.replace('query:', '').split(':');
      if (predicate(queryKey)) {
        cacheManager.delete(key);
        this.queries.delete(key);
        this.notifySubscribers(key);
      }
    });
  }

  /**
   * Prefetch data
   */
  async prefetch<T = any>(
    queryKey: string[],
    queryFn: () => Promise<T>,
    options: QueryCacheOptions = {}
  ): Promise<void> {
    const cacheKey = createCacheKey('query', ...queryKey);

    // Don't prefetch if data is already cached and fresh
    if (cacheManager.has(cacheKey)) {
      return;
    }

    // Start prefetching in background
    this.fetch(queryKey, queryFn, options).catch(error => {
      console.warn('Prefetch failed:', error);
    });
  }

  /**
   * Cancel all ongoing queries
   */
  cancelAllQueries(): void {
    this.refetchTimers.forEach(timer => clearTimeout(timer));
    this.refetchTimers.clear();
  }

  /**
   * Subscribe to query changes
   */
  subscribe(queryKey: string[], callback: () => void): () => void {
    const cacheKey = createCacheKey('query', ...queryKey);
    let subscribers = this.subscribers.get(cacheKey);

    if (!subscribers) {
      subscribers = new Set();
      this.subscribers.set(cacheKey, subscribers);
    }

    subscribers.add(callback);

    return () => {
      subscribers?.delete(callback);
      if (subscribers?.size === 0) {
        this.subscribers.delete(cacheKey);
      }
    };
  }

  /**
   * Notify all subscribers of a query
   */
  private notifySubscribers(cacheKey: string): void {
    const subscribers = this.subscribers.get(cacheKey);
    if (subscribers) {
      subscribers.forEach(callback => callback());
    }
  }

  /**
   * Create a standardized query result
   */
  private createResult<T>(config: {
    data: T | null;
    error: any | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    status: 'loading' | 'success' | 'error';
    queryKey: string[];
    options: QueryCacheOptions;
    refetch: () => Promise<QueryResult<T>>;
    isStale: boolean;
  }): QueryResult<T> {
    const baseResult = {
      ...config,
      subscribe: (callback: () => void) => this.subscribe(config.queryKey, callback),
    };

    // Add derived properties
    Object.defineProperty(baseResult, 'isStale', {
      get: () => {
        const cachedData = cacheManager.get<T>(createCacheKey('query', ...config.queryKey));
        return !cachedData || this.isStale(cachedData, config.options.staleTime!);
      },
      enumerable: true,
    });

    return baseResult as QueryResult<T>;
  }

  /**
   * Check if cached data is stale
   */
  private isStale(data: any, staleTime: number): boolean {
    const timestamp = (data as any)._timestamp || Date.now();
    return Date.now() - timestamp > staleTime;
  }

  /**
   * Refetch stale queries
   */
  private refetchStaleQueries(): void {
    this.queries.forEach((query, cacheKey) => {
      if (query.isStale && query.status === 'success') {
        // Debounce refetches
        if (!this.refetchTimers.has(cacheKey)) {
          this.refetchTimers.set(
            cacheKey,
            setTimeout(() => {
              query.refetch().catch(console.error);
              this.refetchTimers.delete(cacheKey);
            }, 1000)
          );
        }
      }
    });
  }

  /**
   * Get query result
   */
  getQuery<T>(queryKey: string[]): QueryResult<T> | undefined {
    const cacheKey = createCacheKey('query', ...queryKey);
    return this.queries.get(cacheKey);
  }

  /**
   * Get all active queries
   */
  getQueries(): Array<{ key: string; result: QueryResult<any> }> {
    return Array.from(this.queries.entries()).map(([key, result]) => ({
      key,
      result,
    }));
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.queries.clear();
    this.subscribers.clear();
    this.refetchTimers.forEach(timer => clearTimeout(timer));
    this.refetchTimers.clear();
    cacheManager.clear();
  }
}

// Supabase-specific query helpers
export const createSupabaseQuery = <T>(
  supabase: SupabaseClient,
  table: string,
  options: {
    select?: string;
    eq?: Record<string, any>;
    neq?: Record<string, any>;
    gt?: Record<string, any>;
    gte?: Record<string, any>;
    lt?: Record<string, any>;
    lte?: Record<string, any>;
    like?: Record<string, any>;
    ilike?: Record<string, any>;
    order?: string;
    ascending?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) => {
  return async () => {
    let query = supabase.from(table).select(options.select || '*');

    // Apply filters
    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (options.neq) {
      Object.entries(options.neq).forEach(([key, value]) => {
        query = query.neq(key, value);
      });
    }

    if (options.gt) {
      Object.entries(options.gt).forEach(([key, value]) => {
        query = query.gt(key, value);
      });
    }

    if (options.gte) {
      Object.entries(options.gte).forEach(([key, value]) => {
        query = query.gte(key, value);
      });
    }

    if (options.lt) {
      Object.entries(options.lt).forEach(([key, value]) => {
        query = query.lt(key, value);
      });
    }

    if (options.lte) {
      Object.entries(options.lte).forEach(([key, value]) => {
        query = query.lte(key, value);
      });
    }

    if (options.like) {
      Object.entries(options.like).forEach(([key, value]) => {
        query = query.like(key, `%${value}%`);
      });
    }

    if (options.ilike) {
      Object.entries(options.ilike).forEach(([key, value]) => {
        query = query.ilike(key, `%${value}%`);
      });
    }

    // Apply ordering
    if (options.order) {
      query = query.order(options.order, {
        ascending: options.ascending ?? true,
      });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as T[];
  };
};

// Create global query cache instance
export let queryCache: QueryCache;

// Initialize with Supabase client
export function initializeQueryCache(supabase: SupabaseClient): QueryCache {
  queryCache = new QueryCache(supabase);
  return queryCache;
}