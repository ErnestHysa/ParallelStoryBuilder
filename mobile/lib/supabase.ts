import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from './types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Secure storage adapter for session persistence
// Note: Using a simple in-memory cache for synchronous getItem
class SecureStorageAdapter {
  private cache: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.cache[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.cache[key] = value;
    await SecureStore.setItemAsync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    delete this.cache[key];
    await SecureStore.deleteItemAsync(key);
  }

  // Initialize cache on app start
  async initialize(): Promise<void> {
    try {
      // Load any existing session into cache
      const session = await SecureStore.getItemAsync('supabase.session');
      if (session) {
        this.cache['supabase.session'] = session;
      }
    } catch {
      // Ignore errors during initialization
    }
  }
}

const storageAdapter = new SecureStorageAdapter();

// Initialize storage asynchronously
storageAdapter.initialize().catch(() => {
  // Ignore initialization errors
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
