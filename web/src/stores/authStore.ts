import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';
import { getSupabaseClient } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: string | null;
  isLoading: boolean;
  isConfigured: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return url !== '' && !url.includes('your-project') && key !== '' && !key.includes('your-anon');
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      isLoading: true,
      isConfigured: isSupabaseConfigured(),

      initialize: async () => {
        if (!isSupabaseConfigured()) {
          set({ isLoading: false });
          return;
        }

        try {
          const supabase = getSupabaseClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            set({ user: session.user, session: session.access_token });

            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            set({ profile: profile as Profile | null });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      signIn: async (email: string, password: string) => {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase is not configured. Please set up your .env file.');
        }

        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        set({ user: data.user, session: data.session.access_token });

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({ profile: profile as Profile | null });
      },

      signUp: async (email: string, password: string, displayName: string) => {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase is not configured. Please set up your .env file.');
        }

        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              email: data.user.email!,
              display_name: displayName,
            }] as any);

          if (profileError) throw profileError;

          set({
            user: data.user,
            profile: {
              id: data.user.id,
              email: data.user.email!,
              display_name: displayName,
              avatar_url: null,
              created_at: new Date().toISOString(),
            },
            session: data.session?.access_token || null,
          });
        }
      },

      signOut: async () => {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        set({ user: null, profile: null, session: null });
      },

      refreshProfile: async () => {
        const { user } = get();
        if (!user || !isSupabaseConfigured()) return;

        const supabase = getSupabaseClient();
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          set({ profile: data as unknown as Profile });
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        const { user } = get();
        if (!user || !isSupabaseConfigured()) {
          throw new Error('User not authenticated or Supabase not configured');
        }

        const supabase = getSupabaseClient();
        const { error } = await supabase
          .from('profiles')
          .update(updates as any)
          .eq('id', user.id);

        if (error) throw error;

        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        }));
      },
    }),
    {
      name: 'parallel-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
    }
  )
);
