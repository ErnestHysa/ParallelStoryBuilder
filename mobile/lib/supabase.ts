import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from './types';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate that credentials are set (unless in demo mode)
const isDemoMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseAnonKey || supabaseAnonKey.includes('your-anon');

// Export function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !isDemoMode;
};

if (!isDemoMode && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Supabase credentials are not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

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

// Create Supabase client (with placeholder values for demo mode)
// In demo mode, the client won't make actual API calls
export const supabase = isDemoMode
  ? createClient<Database>('https://demo.placeholder.supabase.co', 'demo-key', {
      auth: {
        storage: storageAdapter as any,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
