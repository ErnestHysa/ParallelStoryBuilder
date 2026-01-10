import { create } from 'zustand';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Story, StoryWithMembers, Chapter, Theme } from '@/lib/types';

interface StoriesState {
  stories: StoryWithMembers[];
  currentStory: StoryWithMembers | null;
  isLoading: boolean;
  error: string | null;
  currentChapter: Chapter | null;
  subscription: RealtimeChannel | null;
  fetchStories: () => Promise<void>;
  fetchStory: (storyId: string) => Promise<void>;
  createStory: (theme: Theme) => Promise<string>;
  joinStory: (pairingCode: string) => Promise<void>;
  setCurrentStory: (story: StoryWithMembers | null) => void;
  subscribeToStory: (storyId: string) => Promise<void>;
  unsubscribe: () => void;
  fetchLatestChapter: (storyId: string) => Promise<void>;
}

const generatePairingCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const useStoriesStore = create<StoriesState>((set, get) => ({
  stories: [],
  currentStory: null,
  isLoading: false,
  error: null,
  currentChapter: null,
  subscription: null,

  fetchStories: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('story_members')
        .select(`
          story_id,
          user_id,
          role,
          turn_order,
          joined_at,
          story:stories(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // For each story, fetch members with profiles
      const storiesWithMembers = await Promise.all(
        (data || []).map(async (member: any) => {
          const { data: membersData } = await supabase
            .from('story_members')
            .select(`
              *,
              profile:profiles(*)
            `)
            .eq('story_id', member.story_id);

          return {
            ...member.story,
            members: membersData || [],
          };
        })
      );

      set({ stories: storiesWithMembers });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error fetching stories:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStory: async (storyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;

      const { data: membersData } = await supabase
        .from('story_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('story_id', storyId);

      const storyWithMembers = {
        ...storyData,
        members: membersData || [],
      };

      set({ currentStory: storyWithMembers });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error fetching story:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createStory: async (theme: Theme) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const pairingCode = generatePairingCode();

    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .insert({
        created_by: user.id,
        theme,
        pairing_code: pairingCode,
        status: 'active',
        current_turn: user.id,
      })
      .select()
      .single();

    if (storyError) throw storyError;

    const { error: memberError } = await supabase
      .from('story_members')
      .insert({
        story_id: storyData.id,
        user_id: user.id,
        role: 'creator',
        turn_order: 1,
      });

    if (memberError) throw memberError;

    return storyData.id;
  },

  joinStory: async (pairingCode: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('pairing_code', pairingCode)
      .single();

    if (storyError) throw storyError;

    if (!storyData) {
      throw new Error('Invalid pairing code');
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('story_members')
      .select('*')
      .eq('story_id', storyData.id)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      throw new Error('Already a member of this story');
    }

    // Check if story already has two members
    const { data: allMembers } = await supabase
      .from('story_members')
      .select('*')
      .eq('story_id', storyData.id);

    if (allMembers && allMembers.length >= 2) {
      throw new Error('Story already has two members');
    }

    const { error: memberError } = await supabase
      .from('story_members')
      .insert({
        story_id: storyData.id,
        user_id: user.id,
        role: 'partner',
        turn_order: 2,
      });

    if (memberError) throw memberError;
  },

  setCurrentStory: (story: StoryWithMembers | null) => {
    set({ currentStory: story });
  },

  subscribeToStory: async (storyId: string) => {
    const { subscription: existingSub } = get();

    if (existingSub) {
      existingSub.unsubscribe();
    }

    const channel = supabase
      .channel(`story:${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chapters',
          filter: `story_id=eq.${storyId}`,
        },
        async (payload) => {
          // Refresh story when new chapter is added
          await get().fetchStory(storyId);
          await get().fetchLatestChapter(storyId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`,
        },
        async () => {
          // Refresh story when current_turn changes
          await get().fetchStory(storyId);
        }
      )
      .subscribe();

    set({ subscription: channel });
  },

  unsubscribe: () => {
    const { subscription } = get();

    if (subscription) {
      subscription.unsubscribe();
      set({ subscription: null });
    }
  },

  fetchLatestChapter: async (storyId: string) => {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // PGRST116 = no rows returned (expected when story not found)
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      set({ currentChapter: data });
    } catch (error) {
      console.error('Error fetching latest chapter:', error);
    }
  },
}));
