import { create } from 'zustand';
import type { EnhancementType } from '@/lib/aiClient';

interface EditorState {
  // Content state
  content: string;
  contextSnippet: string | null;
  aiEnhancedContent: string | null;

  // Loading states
  isEnhancing: boolean;
  isSubmitting: boolean;

  // Error state
  error: string | null;

  // AI enhancement state
  selectedEnhancement: EnhancementType | null;

  // Methods
  setContent: (content: string) => void;
  setContextSnippet: (snippet: string | null) => void;
  enhanceWithAI: (type: EnhancementType, storyId?: string) => Promise<string>;
  applyEnhancedContent: () => void;
  clearEnhancedContent: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  content: '',
  contextSnippet: null,
  aiEnhancedContent: null,
  isEnhancing: false,
  isSubmitting: false,
  error: null,
  selectedEnhancement: null,

  setContent: (content: string) => {
    set({ content });
  },

  setContextSnippet: (snippet: string | null) => {
    set({ contextSnippet: snippet });
  },

  enhanceWithAI: async (type: EnhancementType, storyId?: string) => {
    const { content } = get();

    if (!content.trim()) {
      set({ error: 'Please write some content first' });
      throw new Error('Content is required for AI enhancement');
    }

    set({ isEnhancing: true, error: null, selectedEnhancement: type });

    try {
      // Dynamic import to avoid SSR issues
      const { aiClient } = await import('@/lib/aiClient');

      const enhancedContent = await aiClient.enhanceContent(content, type, storyId);

      set({
        aiEnhancedContent: enhancedContent,
        isEnhancing: false,
      });

      return enhancedContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enhance content';
      set({
        error: errorMessage,
        isEnhancing: false,
      });
      throw error;
    }
  },

  applyEnhancedContent: () => {
    const { aiEnhancedContent } = get();
    if (aiEnhancedContent) {
      set({
        content: aiEnhancedContent,
        aiEnhancedContent: null,
        selectedEnhancement: null,
      });
    }
  },

  clearEnhancedContent: () => {
    set({
      aiEnhancedContent: null,
      selectedEnhancement: null,
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  reset: () => {
    set({
      content: '',
      contextSnippet: null,
      aiEnhancedContent: null,
      isEnhancing: false,
      isSubmitting: false,
      error: null,
      selectedEnhancement: null,
    });
  },
}));
