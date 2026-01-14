import LRUCache from 'lru-cache';

export interface CacheItem<T = unknown> {
  data: T;
  timestamp: number;
  ttl?: number;
  size: number;
}

export interface CacheOptions {
  maxItems?: number;
  maxSize?: number;
  defaultTTL?: number;
}

export class CacheManager {
  private cache: InstanceType<typeof LRUCache<string, CacheItem>>;
  private memoryPressureThreshold = 0.8; // 80% of memory usage
  private memoryPressureInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: CacheOptions = {}) {
    const {
      maxItems = 1000,
      maxSize = 50 * 1024 * 1024, // 50MB default max size
      defaultTTL = 5 * 60 * 1000, // 5 minutes default TTL
    } = options;

    this.cache = new LRUCache<string, CacheItem>({
      max: maxItems,
      maxSize,
      sizeCalculation: (value: CacheItem) => value.size,
      ttl: (_key: string, value: CacheItem) => value.ttl || defaultTTL,
      dispose: (value: CacheItem, _key: string, reason: string) => {
        // Cleanup when items are evicted
        if (reason === 'evict') {
          console.log(`Cache item evicted due to memory pressure: ${value.data}`);
        }
      },
    });

    // Start memory pressure monitoring
    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring() {
    this.memoryPressureInterval = setInterval(() => {
      if (typeof navigator !== 'undefined' && 'memory' in navigator) {
        const memory = (navigator as any).memory;
        const used = memory.usedJSHeapSize;
        const total = memory.jsHeapSizeLimit;
        const usage = used / total;

        if (usage > this.memoryPressureThreshold) {
          console.warn(`High memory pressure detected: ${(usage * 100).toFixed(2)}%`);
          // Aggressively clear cache under memory pressure
          this.clear();
        }
      }
    }, 5000); // Check every 5 seconds
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item is expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set<T>(key: string, data: T, options: { ttl?: number; size?: number } = {}): void {
    const { ttl, size = this.estimateSize(data) } = options;

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      size,
    };

    this.cache.set(key, item);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  private estimateSize(data: any): number {
    // Simple size estimation
    const json = JSON.stringify(data);
    return json.length * 2; // Rough estimate considering UTF-16 encoding
  }

  // Prefetch likely keys with a pattern
  prefetch(pattern: RegExp, keys: string[], fetchFn: (key: string) => Promise<any>): void {
    const matchedKeys = keys.filter(key => pattern.test(key));

    // Use setTimeout to avoid blocking the main thread
    setTimeout(async () => {
      for (const key of matchedKeys) {
        if (!this.has(key)) {
          try {
            const data = await fetchFn(key);
            this.set(key, data, { ttl: 5 * 60 * 1000 }); // 5 minutes TTL
          } catch (error) {
            console.warn(`Failed to prefetch ${key}:`, error);
          }
        }
      }
    }, 0);
  }

  // Batch get operations
  batchGet<T>(keys: string[]): (T | null)[] {
    return keys.map(key => this.get<T>(key));
  }

  // Batch set operations
  batchSet<T>(entries: Array<{ key: string; data: T; options?: { ttl?: number; size?: number } }>): void {
    entries.forEach(({ key, data, options }) => {
      this.set(key, data, options);
    });
  }

  // Get statistics
  getStats() {
    return {
      size: this.size(),
      maxSize: this.cache.maxSize,
      oldest: this.cache.oldest?.key,
      newest: this.cache.newest?.key,
      isStale: () => {
        const oldestItem = this.cache.oldest?.value;
        return oldestItem && oldestItem.ttl && Date.now() - oldestItem.timestamp > oldestItem.ttl;
      },
    };
  }

  // Cleanup stale items
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    this.cache.forEach((value, key) => {
      if (value.ttl && now - value.timestamp > value.ttl) {
        this.cache.delete(key);
        removed++;
      }
    });

    return removed;
  }

  // Graceful shutdown
  destroy(): void {
    if (this.memoryPressureInterval) {
      clearInterval(this.memoryPressureInterval);
    }
    this.clear();
  }
}

// Create a singleton instance
export const cacheManager = new CacheManager();

// Utility for creating cache keys
export function createCacheKey(prefix: string, ...args: any[]): string {
  return `${prefix}:${args.join(':')}`;
}