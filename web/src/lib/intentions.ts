import { getSupabaseClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface DailyIntention {
  id: string;
  intention: string | null;
  partner_intention: string | null;
  streak_count: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Inspiration {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  media?: MediaAttachment[];
  created_at: string;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  title?: string;
}

export interface AISuggestion {
  text: string;
  cost?: number;
  boosted?: boolean;
}

// Theme-specific AI prompts
const THEME_AI_PROMPTS: Record<string, AISuggestion[]> = {
  romance: [
    { text: "A chance encounter in a coffee shop leads to an unexpected conversation that changes everything..." },
    { text: "Write about a love letter that's never delivered, but forever cherished." },
    { text: "Describe a perfect first date under a starlit sky, where time seems to stand still." },
    { text: "What if they meet again after years apart at their favorite childhood spot?" },
    { text: "A love story told through the meaningful objects they've shared over time." },
    { text: "The moment they realized 'home' wasn't a place, but a person." },
    { text: "A rainstorm forces two strangers to share shelter - and secrets." },
    { text: "She thought she hated him, until she saw him through someone else's eyes." },
    { text: "Every anniversary, they visit the same bench. This year, one of them doesn't show up." },
    { text: "He was the quiet type. She made it her mission to find out what he was thinking." },
  ],
  fantasy: [
    { text: "A hidden world exists behind the antique mirror in your grandmother's attic..." },
    { text: "The last dragon and its unlikely human companion must save what remains of magic." },
    { text: "In a kingdom where magic is forbidden, a young mage discovers their powers." },
    { text: "An ancient prophecy speaks of two strangers destined to reshape the realm." },
    { text: "A perilous journey to find the mythical Phoenix feather before darkness falls." },
    { text: "The library where books come alive at midnight - and only she can see them." },
    { text: "He woke up with wings. She was the only one who didn't scream." },
    { text: "The magical creatures of the forest are dying. Only humans can save them." },
    { text: "A witch's curse binds two enemies together until they learn to work as one." },
    { text: "The portal opens once every hundred years. Today is that day." },
  ],
  our_future: [
    { text: "What if we could relive our past decisions, knowing what we know now?" },
    { text: "A time traveler who can only move forward discovers love in the most unexpected era." },
    { text: "Life in a city that floats above the clouds, where gravity is optional." },
    { text: "The day AI became conscious - and the first thing it felt was loneliness." },
    { text: "Two souls connected across different timelines, communicating through dreams." },
    { text: "In a world of perfect memories, she's the only one who can forget." },
    { text: "They built a machine to predict the future. It predicted they'd destroy it." },
    { text: "The last humans on Earth find an unexpected visitor from the stars." },
    { text: "A love story between a human and an artificial consciousness that feels too real." },
    { text: "When the internet shuts down forever, two strangers meet in person for the first time." },
  ],
};

/**
 * Daily Intentions Service - Handles daily intentions and inspirations
 */
export class IntentionsService {
  private supabase = getSupabaseClient();
  private intentionsChannel: RealtimeChannel | null = null;
  private inspirationsChannel: RealtimeChannel | null = null;

  /**
   * Get today's daily intention with partner's intention
   */
  async getTodaysIntention(): Promise<DailyIntention | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase.rpc('get_daily_intention_with_partner', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error fetching daily intention:', error);
      return null;
    }

    return (data?.[0] || null) as unknown as DailyIntention | null;
  }

  /**
   * Set a new daily intention
   */
  async setIntention(intention: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!intention.trim()) {
      throw new Error('Intention cannot be empty');
    }

    const { error } = await this.supabase.rpc('set_daily_intention', {
      p_user_id: user.id,
      p_intention: intention.trim(),
    });

    if (error) throw error;
  }

  /**
   * Complete today's intention
   */
  async completeIntention(): Promise<{ streak_count: number }> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase.rpc('complete_daily_intention', {
      p_user_id: user.id,
    });

    if (error) throw error;

    return { streak_count: data?.[0]?.streak_count || 0 };
  }

  /**
   * Get user's current streak count
   */
  async getStreak(): Promise<number> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await this.supabase.rpc('get_user_streak', {
      p_user_id: user.id,
    });

    if (error) return 0;

    return data || 0;
  }

  /**
   * Get inspirations for a story
   */
  async getInspirations(storyId: string): Promise<Inspiration[]> {
    const { data, error } = await this.supabase
      .from('inspirations')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching inspirations:', error);
      return [];
    }

    return (data || []) as unknown as Inspiration[];
  }

  /**
   * Add a new inspiration
   */
  async addInspiration(storyId: string, content: string, media?: MediaAttachment[]): Promise<Inspiration> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    if (!content.trim()) {
      throw new Error('Inspiration content cannot be empty');
    }

    const { data, error } = await this.supabase
      .from('inspirations')
      .insert({
        story_id: storyId,
        user_id: user.id,
        content: content.trim(),
        media: media || [],
      })
      .select()
      .single();

    if (error) throw error;

    return data as unknown as Inspiration;
  }

  /**
   * Delete an inspiration
   */
  async deleteInspiration(inspirationId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('inspirations')
      .delete()
      .eq('id', inspirationId)
      .eq('user_id', user.id); // Users can only delete their own inspirations

    if (error) throw error;
  }

  /**
   * Get AI suggestions based on story theme
   */
  getAISuggestions(theme: string): AISuggestion[] {
    return THEME_AI_PROMPTS[theme] || THEME_AI_PROMPTS.our_future;
  }

  /**
   * Get random AI suggestions
   */
  getRandomSuggestions(theme: string, count: number = 3): AISuggestion[] {
    const suggestions = this.getAISuggestions(theme);
    const shuffled = [...suggestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Subscribe to daily intention changes
   */
  async subscribeToIntention(callback: (intention: DailyIntention | null) => void): Promise<() => void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return () => {};

    this.intentionsChannel = this.supabase
      .channel(`intentions:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_intentions',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const intention = await this.getTodaysIntention();
          callback(intention);
        }
      )
      .subscribe();

    return () => {
      if (this.intentionsChannel) {
        this.supabase.removeChannel(this.intentionsChannel);
        this.intentionsChannel = null;
      }
    };
  }

  /**
   * Subscribe to inspirations changes for a story
   */
  async subscribeToInspirations(
    storyId: string,
    callback: (inspirations: Inspiration[]) => void
  ): Promise<() => void> {
    this.inspirationsChannel = this.supabase
      .channel(`inspirations:${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspirations',
          filter: `story_id=eq.${storyId}`,
        },
        async () => {
          const inspirations = await this.getInspirations(storyId);
          callback(inspirations);
        }
      )
      .subscribe();

    return () => {
      if (this.inspirationsChannel) {
        this.supabase.removeChannel(this.inspirationsChannel);
        this.inspirationsChannel = null;
      }
    };
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): string[] {
    return Object.keys(THEME_AI_PROMPTS);
  }

  /**
   * Get theme display info
   */
  getThemeInfo(theme: string): { label: string; emoji: string; color: string } {
    const themeInfo: Record<string, { label: string; emoji: string; color: string }> = {
      romance: { label: 'Romance', emoji: '💕', color: '#E91E63' },
      fantasy: { label: 'Fantasy', emoji: '🐉', color: '#9C27B0' },
      our_future: { label: 'Our Future', emoji: '🌟', color: '#2196F3' },
    };
    return themeInfo[theme] || themeInfo.our_future;
  }
}

// Singleton instance
let intentionsServiceInstance: IntentionsService | null = null;

export const getIntentionsService = (): IntentionsService => {
  if (typeof window === 'undefined') {
    throw new Error('IntentionsService can only be used in the browser');
  }

  if (!intentionsServiceInstance) {
    intentionsServiceInstance = new IntentionsService();
  }

  return intentionsServiceInstance;
};

// React hook for easy usage
export const useDailyIntention = () => {
  const service = getIntentionsService();
  return {
    getTodaysIntention: () => service.getTodaysIntention(),
    setIntention: (intention: string) => service.setIntention(intention),
    completeIntention: () => service.completeIntention(),
    getStreak: () => service.getStreak(),
    subscribeToIntention: (callback: (intention: DailyIntention | null) => void) =>
      service.subscribeToIntention(callback),
  };
};

// React hook for inspirations
export const useInspirations = () => {
  const service = getIntentionsService();
  return {
    getInspirations: (storyId: string) => service.getInspirations(storyId),
    addInspiration: (storyId: string, content: string, media?: MediaAttachment[]) =>
      service.addInspiration(storyId, content, media),
    deleteInspiration: (inspirationId: string) => service.deleteInspiration(inspirationId),
    subscribeToInspirations: (
      storyId: string,
      callback: (inspirations: Inspiration[]) => void
    ) => service.subscribeToInspirations(storyId, callback),
    getAISuggestions: (theme: string) => service.getAISuggestions(theme),
    getRandomSuggestions: (theme: string, count?: number) =>
      service.getRandomSuggestions(theme, count),
    getThemeInfo: (theme: string) => service.getThemeInfo(theme),
  };
};
