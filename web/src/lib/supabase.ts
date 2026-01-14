import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate that credentials are set (unless in demo mode)
const isDemoMode = !supabaseUrl || supabaseUrl.includes('your-project') || !supabaseAnonKey || supabaseAnonKey.includes('your-anon');

// Export function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !isDemoMode;
};

if (!isDemoMode && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Use demo mode placeholders if not configured
const finalSupabaseUrl = isDemoMode ? 'https://demo.placeholder.supabase.co' : supabaseUrl;
const finalSupabaseAnonKey = isDemoMode ? 'demo-key' : supabaseAnonKey;

// Create browser client
export const createBrowserClient = () =>
  createClient<Database>(finalSupabaseUrl, finalSupabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

// Singleton browser client
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient can only be used in the browser');
  }

  if (!browserClient) {
    browserClient = createBrowserClient();
  }

  return browserClient;
};

// Export a function to check configuration status (for use in components)
export const checkSupabaseConfigured = (): boolean => {
  return isSupabaseConfigured();
};
