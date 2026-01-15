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
  isEmailConfirmed: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  checkEmailConfirmation: () => Promise<boolean>;
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
      isEmailConfirmed: false,

      initialize: async () => {
        if (!isSupabaseConfigured()) {
          set({ isLoading: false });
          return;
        }

        try {
          const supabase = getSupabaseClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const isConfirmed = !!session.user.email_confirmed_at;
            set({ user: session.user, session: session.access_token, isEmailConfirmed: isConfirmed });

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

        // Clear old profile before signing in to prevent displaying wrong user data
        set({ user: null, profile: null, session: null, isEmailConfirmed: false });

        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Check if error is due to unconfirmed email
          if (error.message?.includes('Email not confirmed') || error.status === 400) {
            throw new Error('Please check your email and click the confirmation link before signing in.');
          }
          throw error;
        }

        // Check if email is confirmed
        const isConfirmed = !!data.user.email_confirmed_at;
        if (!isConfirmed) {
          set({ user: data.user, session: data.session.access_token, isEmailConfirmed: false });
          throw new Error('Please check your email and click the confirmation link before signing in.');
        }

        set({ user: data.user, session: data.session.access_token, isEmailConfirmed: true });

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
          const isConfirmed = !!data.user.email_confirmed_at;

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
            isEmailConfirmed: isConfirmed,
          });
        }
      },

      signOut: async () => {
        try {
          const supabase = getSupabaseClient();
          await supabase.auth.signOut();
          set({ user: null, profile: null, session: null, isEmailConfirmed: false });
        } catch (error) {
          console.error('Error during sign out:', error);
          // Still clear local state even if sign out fails on server
          set({ user: null, profile: null, session: null, isEmailConfirmed: false });
          throw error;
        }
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

      checkEmailConfirmation: async () => {
        const { user } = get();
        if (!user) return false;

        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const isConfirmed = !!session.user.email_confirmed_at;
          set({ isEmailConfirmed: isConfirmed, user: session.user });
          return isConfirmed;
        }

        return false;
      },
    }),
    {
      name: 'parallel-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
    }
  )
);
