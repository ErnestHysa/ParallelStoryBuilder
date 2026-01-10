import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Inspiration } from '@/lib/types';

interface InspirationsState {
  inspirations: Inspiration[];
  isLoading: boolean;
  error: string | null;
  fetchInspirations: (storyId: string) => Promise<void>;
  addInspiration: (storyId: string, content: string) => Promise<void>;
  deleteInspiration: (inspirationId: string) => Promise<void>;
}

export const useInspirationsStore = create<InspirationsState>((set, get) => ({
  inspirations: [],
  isLoading: false,
  error: null,

  fetchInspirations: async (storyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('inspirations')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ inspirations: data || [] });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error fetching inspirations:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addInspiration: async (storyId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!content.trim()) {
      throw new Error('Inspiration content cannot be empty');
    }

    try {
      const { data, error } = await supabase
        .from('inspirations')
        .insert({
          story_id: storyId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        inspirations: [data, ...state.inspirations],
      }));
    } catch (error: any) {
      console.error('Error adding inspiration:', error);
      throw error;
    }
  },

  deleteInspiration: async (inspirationId: string) => {
    try {
      const { error } = await supabase
        .from('inspirations')
        .delete()
        .eq('id', inspirationId);

      if (error) throw error;

      set((state) => ({
        inspirations: state.inspirations.filter((insp) => insp.id !== inspirationId),
      }));
    } catch (error: any) {
      console.error('Error deleting inspiration:', error);
      throw error;
    }
  },
}));
