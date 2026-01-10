import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';

// Simplified user type to avoid issues with Supabase User object
type StoredUser = {
  id: string;
  email: string;
};

interface AuthState {
  user: StoredUser | null;
  profile: Profile | null;
  session: Session | null;
  isConfigured: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const toStoredUser = (user: User | null): StoredUser | null => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || '',
  };
};

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  return url !== '' && !url.includes('your-project') && key !== '' && !key.includes('your-anon');
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isConfigured: isSupabaseConfigured(),

  initialize: async () => {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured - running in demo mode');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: toStoredUser(session.user), session });

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({ profile });
      }
    } catch (error: unknown) {
      console.error('Error initializing auth:', error);
    }
  },

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your .env file.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    set({ user: toStoredUser(data.user), session: data.session });

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    set({ profile });
  },

  signUp: async (email: string, password: string, displayName: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your .env file.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          display_name: displayName,
        });

      if (profileError) throw profileError;

      set({ user: toStoredUser(data.user), profile: {
        id: data.user.id,
        email: data.user.email!,
        display_name: displayName,
        avatar_url: null,
        created_at: new Date().toISOString(),
      }});
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    set({ user: null, profile: null, session: null });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user || !isSupabaseConfigured()) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      set({ profile: data });
    }
  },
}));
