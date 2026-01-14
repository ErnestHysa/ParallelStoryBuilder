import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineStorageOptions {
  ttl?: number; // Time to live in milliseconds
  prefix?: string; // Key prefix for namespacing
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl?: number;
}

export class OfflineStorage {
  private prefix: string;

  constructor(private options: OfflineStorageOptions = {}) {
    this.prefix = options.prefix || 'offline_';
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private isExpired(item: CachedData<any>): boolean {
    if (!item.ttl) return false;
    return Date.now() - item.timestamp > item.ttl;
  }

  async setItem<T>(key: string, data: T, options?: OfflineStorageOptions): Promise<void> {
    const storageKey = this.getKey(key);
    const cacheItem: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl || this.options.ttl,
    };

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.error(`Failed to set item ${key} in offline storage:`, error);
      throw new Error(`Failed to cache data: ${key}`);
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    const storageKey = this.getKey(key);

    try {
      const item = await AsyncStorage.getItem(storageKey);
      if (!item) return null;

      const cacheItem: CachedData<T> = JSON.parse(item);

      if (this.isExpired(cacheItem)) {
        await this.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error(`Failed to get item ${key} from offline storage:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    const storageKey = this.getKey(key);

    try {
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Failed to remove item ${key} from offline storage:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith(this.prefix));

      if (offlineKeys.length > 0) {
        await AsyncStorage.multiRemove(offlineKeys);
      }
    } catch (error) {
      console.error('Failed to clear offline storage:', error);
    }
  }

  async getKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('Failed to get offline storage keys:', error);
      return [];
    }
  }

  async cleanupExpired(): Promise<number> {
    let removedCount = 0;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith(this.prefix));

      for (const key of offlineKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const cacheItem: CachedData<any> = JSON.parse(item);
          if (this.isExpired(cacheItem)) {
            await AsyncStorage.removeItem(key);
            removedCount++;
          }
        }
      }

      return removedCount;
    } catch (error) {
      console.error('Failed to cleanup expired items:', error);
      return 0;
    }
  }
}

// Create a singleton instance for the app
export const offlineStorage = new OfflineStorage({
  prefix: 'psb_',
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days default TTL
});

// Utility functions for common data types
export const offlineCache = {
  user: offlineStorage,
  stories: offlineStorage,
  chapters: offlineStorage,
  drafts: offlineStorage,
};

// Create storage instances with specific TTLs
export const userStorage = new OfflineStorage({
  prefix: 'user_',
  ttl: 24 * 60 * 60 * 1000, // 24 hours
});

export const storyStorage = new OfflineStorage({
  prefix: 'story_',
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const chapterStorage = new OfflineStorage({
  prefix: 'chapter_',
  ttl: 3 * 24 * 60 * 60 * 1000, // 3 days
});