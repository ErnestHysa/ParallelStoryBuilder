import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { offlineActions } from './offlineStore';
import { Profile, NotificationPreferences } from '@/lib/types';
import { useTokenStore } from './tokenStore';
import { useNotificationsStore } from './notificationsStore';
import { AppError as AppErrorClass } from '@/lib/errorHandling';

// Simplified user type to avoid issues with Supabase User object
type StoredUser = {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
};

interface AuthState {
  user: StoredUser | null;
  profile: Profile | null;
  session: Session | null;
  isConfigured: boolean;

  // Token and notification states
  tokenBalance: number;
  notificationsEnabled: boolean;

  // Methods
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  verifyEmail: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;

  // Token balance integration
  fetchTokenBalance: () => Promise<void>;
  updateNotificationPreferences: (preferences: NotificationPreferences) => Promise<void>;
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

// Notification preferences interface
interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  storyUpdates: boolean;
  aiFeatures: boolean;
  marketing: boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isConfigured: isSupabaseConfigured(),
  tokenBalance: 0,
  notificationsEnabled: true,

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

        // Fetch token balance
        await get().fetchTokenBalance();
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

    // Fetch token balance
    await get().fetchTokenBalance();
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
        .insert([{
          id: data.user.id,
          email: data.user.email!,
          display_name: displayName,
        }]);

      if (profileError) throw profileError;

      set({ user: toStoredUser(data.user), profile: {
        id: data.user.id,
        email: data.user.email!,
        display_name: displayName,
        avatar_url: null,
        created_at: new Date().toISOString(),
      }});

      // Initialize token balance
      useTokenStore.getState().setBalance(100); // Starting balance
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    set({ user: null, profile: null, session: null, tokenBalance: 0 });
    useTokenStore.getState().reset();
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

  verifyEmail: async (email: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your .env file.');
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: process.env.EXPO_PUBLIC_REDIRECT_URL || 'app://',
      },
    });

    if (error) throw error;
  },

  resendVerificationEmail: async () => {
    const { user } = get();
    if (!user || !isSupabaseConfigured()) {
      throw new Error('No user found or Supabase is not configured.');
    }

    // Note: reauthenticate was deprecated, use getUser instead
    await supabase.auth.refreshSession();

    if (error) throw error;
  },

  forgotPassword: async (email: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your .env file.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: process.env.EXPO_PUBLIC_REDIRECT_URL || 'app://',
    });

    if (error) throw error;
  },

  resetPassword: async (token: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your .env file.');
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set up your .env file.');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  // Add update profile method with offline support
  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get();
    if (!user || !isSupabaseConfigured()) {
      throw new Error('User not authenticated or Supabase not configured');
    }

    try {
      // Try to update online first
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      }));

    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.updateProfile(user.id, updates);

        // Update local state for immediate UI feedback
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        }));

        throw new AppErrorClass('Profile update queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE', {
          updates,
        });
      }

      throw error;
    }
  },

  // Token balance integration
  fetchTokenBalance: async () => {
    const { user } = get();
    if (!user || !isSupabaseConfigured()) return;

    try {
      const { data } = await supabase
        .from('user_tokens')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (data) {
        set({ tokenBalance: data.balance });
        // Update token store
        useTokenStore.getState().setBalance(data.balance);
      }
    } catch (error: any) {
      // In demo mode or if table doesn't exist, set default
      if (error.code === 'PGRST116') {
        set({ tokenBalance: 100 }); // Default balance for demo
        useTokenStore.getState().setBalance(100);
      }
      console.error('Error fetching token balance:', error);
    }
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences: NotificationPreferences) => {
    const { user } = get();
    if (!user || !isSupabaseConfigured()) {
      throw new Error('User not authenticated or Supabase not configured');
    }

    try {
      // Try to update online first
      const { error } = await supabase
        .from('user_preferences')
        .update({
          notification_preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      set({ notificationsEnabled: preferences.inApp || preferences.push });

      // Update notifications store
      useNotificationsStore.getState().updatePreferences(preferences);

    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.updatePreferences(user.id, { notification_preferences: preferences });

        // Update local state for immediate UI feedback
        set({ notificationsEnabled: preferences.inApp || preferences.push });
        useNotificationsStore.getState().updatePreferences(preferences);

        throw new AppErrorClass('Notification preferences queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE', {
          preferences,
        });
      }

      throw error;
    }
  },
}));