import { getSupabaseClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  privacy?: {
    show_online_status?: boolean;
    show_activity_status?: boolean;
    allow_direct_messages?: boolean;
    allow_story_invitations?: boolean;
    allow_profile_visibility?: 'everyone' | 'partners' | 'none';
    allow_story_sharing?: boolean;
  };
  notifications?: {
    email_digest?: boolean;
    push_notifications?: boolean;
    sound_effects?: boolean;
    story_updates?: boolean;
    collaboration_alerts?: boolean;
    new_chapter?: boolean;
    partner_joined?: boolean;
    daily_intention?: boolean;
    weekly_highlights?: boolean;
    ai_reminder?: boolean;
    email_new_chapter?: boolean;
    email_weekly?: boolean;
    email_marketing?: boolean;
  };
  security?: {
    session_timeout?: number;
    auto_lock?: boolean;
    two_factor_enabled?: boolean;
    biometric_enabled?: boolean;
  };
}

export interface NotificationSettings {
  new_chapter: boolean;
  partner_joined: boolean;
  daily_intention: boolean;
  weekly_highlights: boolean;
  ai_reminder: boolean;
  email_new_chapter: boolean;
  email_weekly: boolean;
  email_marketing: boolean;
  push_enabled: boolean;
}

export interface SecuritySettings {
  session_timeout: number;
  auto_lock: boolean;
  two_factor_enabled: boolean;
  biometric_enabled: boolean;
}

export interface PrivacySettings {
  show_online_status: boolean;
  allow_profile_visibility: 'everyone' | 'partners' | 'none';
  allow_story_sharing: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  language: string;
  preferences: UserPreferences;
  last_password_changed?: string;
  phone?: string;
}

/**
 * Settings Service - Handles all settings operations with backend sync
 */
export class SettingsService {
  private supabase = getSupabaseClient();
  private preferencesChannel: RealtimeChannel | null = null;

  /**
   * Get current user profile with preferences
   */
  async getProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as unknown as UserProfile;
  }

  /**
   * Update user profile (display name, avatar)
   */
  async updateProfile(updates: {
    display_name?: string;
    avatar_url?: string | null;
  }): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
  }

  /**
   * Update user preferences (backend synced)
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current preferences
    const { data: current } = await this.supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    const currentPrefs = ((current as any)?.preferences as UserPreferences) || {};

    // Deep merge preferences
    const mergedPrefs = this.deepMerge(currentPrefs, preferences);

    const { error } = await this.supabase
      .from('profiles')
      .update({ preferences: mergedPrefs })
      .eq('id', user.id);

    if (error) throw error;
  }

  /**
   * Deep merge utility for preferences
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key]) && this.isObject(target[key])) {
          output[key] = this.deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Update notification preferences using backend function
   */
  async updateNotificationPreferences(settings: NotificationSettings): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase.rpc('update_notification_preferences', {
      p_user_id: user.id,
      p_new_chapter: settings.new_chapter,
      p_partner_joined: settings.partner_joined,
      p_daily_intention: settings.daily_intention,
      p_weekly_highlights: settings.weekly_highlights,
      p_ai_reminder: settings.ai_reminder,
      p_email_new_chapter: settings.email_new_chapter,
      p_email_weekly: settings.email_weekly,
      p_email_marketing: settings.email_marketing,
      p_push_enabled: settings.push_enabled,
    });

    if (error) throw error;
  }

  /**
   * Update security preferences using backend function
   */
  async updateSecurityPreferences(settings: SecuritySettings): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase.rpc('update_security_preferences', {
      p_user_id: user.id,
      p_session_timeout: settings.session_timeout,
      p_auto_lock: settings.auto_lock,
      p_two_factor_enabled: settings.two_factor_enabled,
      p_biometric_enabled: settings.biometric_enabled,
    });

    if (error) {
      // If function doesn't exist yet, fall back to direct update
      console.warn('RPC function not available, using direct update');
      await this.updatePreferences({
        security: settings,
      });
    }
  }

  /**
   * Update privacy preferences using backend function
   */
  async updatePrivacyPreferences(settings: PrivacySettings): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase.rpc('update_privacy_preferences', {
      p_user_id: user.id,
      p_show_online_status: settings.show_online_status,
      p_allow_profile_visibility: settings.allow_profile_visibility,
      p_allow_story_sharing: settings.allow_story_sharing,
    });

    if (error) {
      // If function doesn't exist yet, fall back to direct update
      console.warn('RPC function not available, using direct update');
      await this.updatePreferences({
        privacy: settings,
      });
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Verify current password first
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user?.email) throw new Error('No email found');

    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  }

  /**
   * Enable two-factor authentication
   */
  async enable2FA(phone: string): Promise<{ qrCode: string; secret: string }> {
    // This would integrate with Supabase's 2FA/TOTP
    // For now, we'll store the phone number
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('profiles')
      .update({ phone })
      .eq('id', user.id);

    if (error) throw error;

    // TODO: Integrate with actual TOTP generation
    // Returning mock data for now
    return {
      qrCode: `otpauth://totp/Parallel:${user.email}?secret=mocksecret&issuer=Parallel`,
      secret: 'mocksecret',
    };
  }

  /**
   * Disable two-factor authentication
   */
  async disable2FA(): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('profiles')
      .update({ phone: null })
      .eq('id', user.id);

    if (error) throw error;
  }

  /**
   * Enable biometric authentication (WebAuthn)
   */
  async enableBiometric(): Promise<void> {
    if (!navigator.credentials) {
      throw new Error('Biometric authentication not supported on this device');
    }

    // Register WebAuthn credential
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // For now, we'll store a flag in preferences
    await this.updatePreferences({
      security: {
        biometric_enabled: true,
      },
    });
  }

  /**
   * Disable biometric authentication
   */
  async disableBiometric(): Promise<void> {
    await this.updatePreferences({
      security: {
        biometric_enabled: false,
      },
    });
  }

  /**
   * Reset to default preferences
   */
  async resetPreferences(): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase.rpc('reset_user_preferences', {
      p_user_id: user.id,
    });

    if (error) {
      console.warn('RPC function not available, resetting manually');
      await this.updatePreferences(this.getDefaultPreferences());
    }
  }

  /**
   * Get default preferences
   */
  getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      language: 'en',
      privacy: {
        show_online_status: true,
        show_activity_status: true,
        allow_direct_messages: true,
        allow_story_invitations: true,
        allow_profile_visibility: 'everyone',
        allow_story_sharing: false,
      },
      notifications: {
        email_digest: false,
        push_notifications: true,
        sound_effects: true,
        story_updates: true,
        collaboration_alerts: true,
        new_chapter: true,
        partner_joined: true,
        daily_intention: true,
        weekly_highlights: true,
        ai_reminder: true,
        email_new_chapter: false,
        email_weekly: false,
        email_marketing: false,
      },
      security: {
        session_timeout: 30,
        auto_lock: true,
        two_factor_enabled: false,
        biometric_enabled: false,
      },
    };
  }

  /**
   * Export all user data
   */
  async exportUserData(): Promise<Blob> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch all user data
    const [profile, stories, chapters, relationships, storyMembers] = await Promise.all([
      this.supabase.from('profiles').select('*').eq('id', user.id).single(),
      this.supabase.from('stories').select('*').eq('created_by', user.id),
      this.supabase.from('chapters').select('*').eq('author_id', user.id),
      this.supabase.from('relationships').select('*').or(`user_1.eq.${user.id},user_2.eq.${user.id}`),
      this.supabase.from('story_members').select('*').eq('user_id', user.id),
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        ...((profile.data || {}) as any),
      },
      stories: stories.data || [],
      chapters: chapters.data || [],
      relationships: relationships.data || [],
      story_members: storyMembers.data || [],
    };

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<void> {
    // Verify password first
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user?.email) throw new Error('No email found');

    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInError) {
      throw new Error('Incorrect password');
    }

    // Try using RPC function first
    const { error: rpcError } = await this.supabase.rpc('delete_user_account', {
      p_user_id: user.id,
    });

    if (rpcError) {
      console.warn('RPC function not available, deleting manually');
      // Manual deletion as fallback
      await this.manualDeleteAccount(user.id);
    }

    // Sign out
    await this.supabase.auth.signOut();
  }

  /**
   * Manual account deletion fallback
   */
  private async manualDeleteAccount(userId: string): Promise<void> {
    // Delete in correct order due to foreign keys
    await this.supabase.from('story_members').delete().eq('user_id', userId);
    await this.supabase.from('chapters').delete().eq('author_id', userId);
    await this.supabase.from('stories').delete().eq('created_by', userId);
    await this.supabase.from('relationships').delete().or(`user_1.eq.${userId},user_2.eq.${userId}`);
    await this.supabase.from('inspirations').delete().eq('user_id', userId);
    await this.supabase.from('daily_intentions').delete().eq('user_id', userId);
    await this.supabase.from('profiles').delete().eq('id', userId);
  }

  /**
   * Subscribe to preferences changes
   */
  async subscribeToPreferences(callback: (preferences: UserPreferences) => void): Promise<() => void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return () => {};

    this.preferencesChannel = this.supabase
      .channel(`preferences:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newPrefs = (payload.new as any)?.preferences;
          if (newPrefs) {
            callback(newPrefs);
          }
        }
      )
      .subscribe();

    return () => {
      if (this.preferencesChannel) {
        this.supabase.removeChannel(this.preferencesChannel);
        this.preferencesChannel = null;
      }
    };
  }

  /**
   * Load notification settings from backend
   */
  async loadNotificationSettings(): Promise<NotificationSettings> {
    const profile = await this.getProfile();
    const prefs = profile?.preferences as UserPreferences;
    const notifs = prefs?.notifications;

    return {
      new_chapter: notifs?.new_chapter ?? true,
      partner_joined: notifs?.partner_joined ?? true,
      daily_intention: notifs?.daily_intention ?? true,
      weekly_highlights: notifs?.weekly_highlights ?? true,
      ai_reminder: notifs?.ai_reminder ?? true,
      email_new_chapter: notifs?.email_new_chapter ?? false,
      email_weekly: notifs?.email_weekly ?? false,
      email_marketing: notifs?.email_marketing ?? false,
      push_enabled: notifs?.push_notifications ?? false,
    };
  }

  /**
   * Load security settings from backend
   */
  async loadSecuritySettings(): Promise<SecuritySettings> {
    const profile = await this.getProfile();
    const prefs = profile?.preferences as UserPreferences;
    const security = prefs?.security;

    return {
      session_timeout: security?.session_timeout ?? 30,
      auto_lock: security?.auto_lock ?? true,
      two_factor_enabled: security?.two_factor_enabled ?? false,
      biometric_enabled: security?.biometric_enabled ?? false,
    };
  }

  /**
   * Load privacy settings from backend
   */
  async loadPrivacySettings(): Promise<PrivacySettings> {
    const profile = await this.getProfile();
    const prefs = profile?.preferences as UserPreferences;
    const privacy = prefs?.privacy;

    return {
      show_online_status: privacy?.show_online_status ?? true,
      allow_profile_visibility: privacy?.allow_profile_visibility ?? 'everyone',
      allow_story_sharing: privacy?.allow_story_sharing ?? false,
    };
  }
}

// Singleton instance
let settingsServiceInstance: SettingsService | null = null;

export const getSettingsService = (): SettingsService => {
  if (typeof window === 'undefined') {
    throw new Error('SettingsService can only be used in the browser');
  }

  if (!settingsServiceInstance) {
    settingsServiceInstance = new SettingsService();
  }

  return settingsServiceInstance;
};
