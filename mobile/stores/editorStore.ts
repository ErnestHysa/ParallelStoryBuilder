import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Chapter } from '@/lib/types';

interface EditorState {
  draftContent: string;
  contextSnippet: string | null;
  isEnhancing: boolean;
  isSubmitting: boolean;
  aiEnhancedContent: string | null;
  setDraftContent: (content: string) => void;
  setContextSnippet: (snippet: string | null) => void;
  enhanceWithAI: (storyId: string) => Promise<void>;
  submitChapter: (storyId: string) => Promise<void>;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  draftContent: '',
  contextSnippet: null,
  isEnhancing: false,
  isSubmitting: false,
  aiEnhancedContent: null,

  setDraftContent: (content: string) => {
    set({ draftContent: content });
  },

  setContextSnippet: (snippet: string | null) => {
    set({ contextSnippet: snippet });
  },

  enhanceWithAI: async (storyId: string) => {
    const { draftContent } = get();

    if (!draftContent.trim()) {
      throw new Error('Cannot enhance empty content');
    }

    set({ isEnhancing: true });

    try {
      const { data, error } = await supabase.functions.invoke<{ enhancedContent: string }>('ai-enhance', {
        body: {
          content: draftContent,
          storyId,
        },
      });

      if (error) throw error;

      set({ aiEnhancedContent: data.enhancedContent });
    } catch (error: unknown) {
      console.error('Error enhancing content:', error);
      throw error;
    } finally {
      set({ isEnhancing: false });
    }
  },

  submitChapter: async (storyId: string) => {
    const { draftContent, contextSnippet, aiEnhancedContent } = get();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!draftContent.trim()) {
      throw new Error('Cannot submit empty chapter');
    }

    set({ isSubmitting: true });

    try {
      // Get the current chapter number
      const { data: lastChapter } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: false })
        .limit(1)
        .single();

      const nextChapterNumber = lastChapter ? lastChapter.chapter_number + 1 : 1;

      // Insert the new chapter
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          story_id: storyId,
          author_id: user.id,
          chapter_number: nextChapterNumber,
          content: draftContent,
          ai_enhanced_content: aiEnhancedContent,
          context_snippet: contextSnippet,
        })
        .select()
        .single();

      if (chapterError) throw chapterError;

      // Get all members to determine next turn
      const { data: members } = await supabase
        .from('story_members')
        .select('*')
        .eq('story_id', storyId)
        .order('turn_order', { ascending: true });

      if (members && members.length === 2) {
        const currentMember = members.find((m) => m.user_id === user.id);
        const nextMember = members.find((m) => m.user_id !== user.id);

        if (nextMember) {
          // Update current_turn in stories table
          await supabase
            .from('stories')
            .update({
              current_turn: nextMember.user_id,
            })
            .eq('id', storyId);
        }
      }

      // Reset the editor state
      set({
        draftContent: '',
        contextSnippet: null,
        aiEnhancedContent: null,
      });

      return chapterData;
    } catch (error) {
      console.error('Error submitting chapter:', error);
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  reset: () => {
    set({
      draftContent: '',
      contextSnippet: null,
      isEnhancing: false,
      isSubmitting: false,
      aiEnhancedContent: null,
    });
  },
}));
