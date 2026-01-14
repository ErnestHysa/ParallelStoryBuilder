import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

// Fallback values in case .env is not loaded
const FALLBACK_SUPABASE_URL = 'https://aljlohdswvemsxlvayvp.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_F6Qb9Wv_yN6g8yipRXrQOw_NXsMd80u';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Some features may not work.');
}

// Create browser client
export const createBrowserClient = () =>
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
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

export const supabase = typeof window === 'undefined'
  ? null
  : createBrowserClient();
