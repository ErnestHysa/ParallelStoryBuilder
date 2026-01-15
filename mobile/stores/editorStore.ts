import React from 'react';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { aiClient } from '@/lib/aiClient';
import { Chapter, MediaAttachment, DraftState } from '@/lib/types';
import { useTokenStore } from './tokenStore';
import { useStoriesStore } from './storiesStore';
import { useEffect } from 'react';

// Get Supabase URL for direct fetch calls
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface EditorState {
  // Existing state
  draftContent: string;
  contextSnippet: string | null;
  isEnhancing: boolean;
  isSubmitting: boolean;
  aiEnhancedContent: string | null;
  selectedText: string;
  currentContent: string;

  // AI methods state
  isAnalyzing: boolean;
  isGeneratingCover: boolean;
  isCreatingAvatar: boolean;
  isTransformingStyle: boolean;
  aiResults: any;
  aiCostTracker: number;

  // Rich text content support
  contentHistory: DraftState[];
  undoStack: string[];
  redoStack: string[];
  autoSaveTimer: NodeJS.Timeout | null;
  lastSavedAt: number | null;

  // Media attachments
  mediaAttachments: MediaAttachment[];
  isUploadingMedia: boolean;
  uploadProgress: number;

  // Enhanced AI tools
  aiStylePresets: string[];
  aiCharacterConsistency: Record<string, any>;
  aiPromptSuggestions: string[];

  // Token cost tracking
  tokenCosts: Record<string, number>;
  dailyTokenUsage: number;
  monthlyTokenUsage: number;

  // Offline draft saving
  localDrafts: Record<string, DraftState>;
  isSyncingDrafts: boolean;

  // Additional properties for compatibility
  selectedFormat: string | null;
  setFormat: (format: string) => void;

  // Existing methods
  setDraftContent: (content: string) => void;
  setContextSnippet: (snippet: string | null) => void;
  enhanceWithAI: (storyId: string) => Promise<void>;
  submitChapter: (storyId: string) => Promise<void>;

  // New AI methods
  setSelectedText: (text: string) => void;
  updateCurrentContent: (content: string) => void;
  analyzeNarrative: (storyId: string, chapterId?: string) => Promise<void>;
  generateCoverArt: (request: any) => Promise<void>;
  createCharacterAvatar: (request: any) => Promise<void>;
  transformSelectedStyle: (style: string) => Promise<void>;
  checkCharacterConsistency: (storyId: string) => Promise<void>;
  clearAIResults: () => void;
  reset: () => void;

  // Rich text methods
  insertMedia: (media: MediaAttachment) => void;
  removeMedia: (mediaId: string) => void;
  applyFormatting: (format: string) => void;
  undo: () => void;
  redo: () => void;
  saveDraft: (storyId: string) => Promise<void>;
  loadDraft: (draftId: string) => void;
  deleteDraft: (draftId: string) => Promise<void>;

  // Auto-save methods
  startAutoSave: (storyId: string, interval?: number) => void;
  stopAutoSave: () => void;
  syncDrafts: () => Promise<void>;

  // Enhanced AI methods
  applyStylePreset: (preset: string, content: string) => Promise<string>;
  generateCharacterProfile: (characterName: string) => Promise<any>;
  getStyleSuggestions: () => Promise<string[]>;
  maintainCharacterVoice: (characterId: string, content: string) => Promise<string>;
}

// Draft state type
interface DraftState {
  id: string;
  storyId: string;
  chapterId: string;
  content: string;
  contextSnippet: string | null;
  createdAt: number;
  updatedAt: number;
  isAutoSaved: boolean;
}

// Supported media types
interface MediaFile {
  uri: string;
  type: 'image' | 'audio' | 'video';
  filename: string;
  size: number;
  mimeType: string;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Existing state
  draftContent: '',
  contextSnippet: null,
  isEnhancing: false,
  isSubmitting: false,
  aiEnhancedContent: null,
  selectedText: '',
  currentContent: '',
  isAnalyzing: false,
  isGeneratingCover: false,
  isCreatingAvatar: false,
  isTransformingStyle: false,
  aiResults: null,
  aiCostTracker: 0,

  // Rich text content support
  contentHistory: [],
  undoStack: [],
  redoStack: [],
  autoSaveTimer: null,
  lastSavedAt: null,

  // Media attachments
  mediaAttachments: [],
  isUploadingMedia: false,
  uploadProgress: 0,

  // Enhanced AI tools
  aiStylePresets: [
    'classic_narrative',
    'modern_dialogue',
    'poetic_prose',
    'suspense_thriller',
    'romantic_drama',
    'fantasy_epic',
    'scifi_futuristic'
  ],
  aiCharacterConsistency: {},
  aiPromptSuggestions: [],

  // Token cost tracking
  tokenCosts: {},
  dailyTokenUsage: 0,
  monthlyTokenUsage: 0,

  // Offline draft saving
  localDrafts: {},
  isSyncingDrafts: false,

  // Additional properties for compatibility
  selectedFormat: null,
  setFormat: (format: string) => {
    set({ selectedFormat: format });
  },

  setDraftContent: (content: string) => {
    const { undoStack } = get();
    set({
      draftContent: content,
      undoStack: [...undoStack, content],
      redoStack: [],
    });

    // Track character count for potential AI suggestions
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > 500) {
      // Analyze narrative structure for longer content
      get().analyzeNarrative('', '');
    }
  },

  setContextSnippet: (snippet: string | null) => {
    set({ contextSnippet: snippet });
  },

  setSelectedText: (text: string) => {
    set({ selectedText: text });
  },

  updateCurrentContent: (content: string) => {
    set({ currentContent: content });
  },

  undo: () => {
    const { undoStack, draftContent } = get();
    if (undoStack.length > 1) {
      const newUndoStack = [...undoStack];
      const previousContent = newUndoStack[newUndoStack.length - 2];
      newUndoStack.pop();

      set({
        draftContent: previousContent,
        undoStack: newUndoStack,
        redoStack: [draftContent, ...get().redoStack],
      });
    }
  },

  redo: () => {
    const { redoStack, draftContent } = get();
    if (redoStack.length > 0) {
      const newRedoStack = [...redoStack];
      const nextContent = newRedoStack[0];
      newRedoStack.shift();

      set({
        draftContent: nextContent,
        undoStack: [...get().undoStack, draftContent],
        redoStack: newRedoStack,
      });
    }
  },

  enhanceWithAI: async (storyId: string) => {
    const { draftContent } = get();
    const tokenStore = useTokenStore.getState();

    if (!draftContent.trim()) {
      throw new Error('Cannot enhance empty content');
    }

    // Deduct tokens for AI enhancement
    const enhancementCost = 2;
    if (tokenStore.balance < enhancementCost) {
      throw new Error('Insufficient tokens for AI enhancement');
    }
    tokenStore.deductTokens(enhancementCost);

    set({ isEnhancing: true });

    try {
      // Get the current session to explicitly pass the auth token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be logged in to use AI features');
      }

      // Use direct fetch instead of supabase.functions.invoke
      // Pass userId directly in request body to bypass PKCE JWT validation issues
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          content: draftContent,
          storyId,
          features: ['grammar', 'style', 'tone', 'clarity'],
          userId: session.user.id,  // Pass userId directly to bypass JWT auth
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI enhancement error: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'AI enhancement failed');
      }

      set({
        aiEnhancedContent: data.data.enhancedContent,
        aiCostTracker: get().aiCostTracker + enhancementCost,
        tokenCosts: {
          ...get().tokenCosts,
          enhancement: (get().tokenCosts.enhancement || 0) + enhancementCost,
        }
      });

      // Auto-save enhanced content
      await get().saveDraft(storyId);

    } catch (error: unknown) {
      console.error('Error enhancing content:', error);
      throw error;
    } finally {
      set({ isEnhancing: false });
    }
  },

  submitChapter: async (storyId: string) => {
    const { draftContent, contextSnippet, aiEnhancedContent, mediaAttachments } = get();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!draftContent.trim()) {
      throw new Error('Cannot submit empty chapter');
    }

    set({ isSubmitting: true });

    try {
      // Insert the new chapter with retry logic for duplicate chapter_number errors
      // On each retry, re-query the database to get the latest chapter number
      let chapterData;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        // Re-fetch the latest chapter number on each retry to handle concurrent submissions
        const { data: lastChapter, error: fetchError } = await supabase
          .from('chapters')
          .select('chapter_number')
          .eq('story_id', storyId)
          .order('chapter_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        const nextChapterNumber = lastChapter ? lastChapter.chapter_number + 1 : 1;

        try {
          const { data: insertedChapter, error: chapterError } = await supabase
            .from('chapters')
            .insert({
              story_id: storyId,
              author_id: user.id,
              chapter_number: nextChapterNumber,
              content: draftContent,
              ai_enhanced_content: aiEnhancedContent,
              context_snippet: contextSnippet,
              media_attachments: mediaAttachments,
            })
            .select()
            .single();

          if (chapterError) {
            // If it's a unique constraint violation on chapter_number, retry
            if (chapterError.code === '23505' && retries < maxRetries - 1) {
              retries++;
              continue;
            }
            throw chapterError;
          }

          chapterData = insertedChapter;
          break;
        } catch (err) {
          // On duplicate constraint violation, retry
          if (err && typeof err === 'object' && 'code' in err && err.code === '23505' && retries < maxRetries - 1) {
            retries++;
            continue;
          }
          if (retries < maxRetries - 1) {
            retries++;
            continue;
          }
          throw err;
        }
      }

      if (!chapterData) {
        throw new Error('Failed to insert chapter after multiple retries');
      }

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

      // Update stories store to refresh current story
      const storiesStore = useStoriesStore.getState();
      await storiesStore.fetchStory(storyId);

      // Reset the editor state
      set({
        draftContent: '',
        contextSnippet: null,
        aiEnhancedContent: null,
        mediaAttachments: [],
        undoStack: [],
        redoStack: [],
        lastSavedAt: null,
      });

      return chapterData;
    } catch (error) {
      console.error('Error submitting chapter:', error);
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // New AI Methods
  analyzeNarrative: async (storyId: string, chapterId?: string) => {
    const { currentContent } = get();
    const { data: { user } } = await supabase.auth.getUser();
    const tokenStore = useTokenStore.getState();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Deduct tokens for analysis
    const analysisCost = 1;
    if (tokenStore.balance < analysisCost) {
      throw new Error('Insufficient tokens for narrative analysis');
    }
    tokenStore.deductTokens(analysisCost);

    set({ isAnalyzing: true, aiResults: null });

    try {
      const result = await aiClient.analyzeNarrative({
        storyContent: currentContent,
        userId: user.id,
        storyId: storyId,
        chapterId: chapterId,
        includeDetailedBreakdown: true,
        features: ['structure', 'tone', 'character_development', 'plot_progression'],
      });

      set({
        aiResults: result,
        aiCostTracker: get().aiCostTracker + (result.estimated_cost || analysisCost),
        tokenCosts: {
          ...get().tokenCosts,
          analysis: (get().tokenCosts.analysis || 0) + (result.estimated_cost || analysisCost),
        }
      });

      // Update daily and monthly token usage
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      set((state) => ({
        dailyTokenUsage: state.dailyTokenUsage + (result.estimated_cost || analysisCost),
        monthlyTokenUsage: state.monthlyTokenUsage + (result.estimated_cost || analysisCost),
      }));

    } catch (error) {
      console.error('Error analyzing narrative:', error);
      set({
        aiResults: { error: error instanceof Error ? error.message : 'Failed to analyze narrative' },
        isAnalyzing: false
      });
      throw error;
    }
  },

  generateCoverArt: async (request: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const tokenStore = useTokenStore.getState();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Deduct tokens for cover art generation
    const coverCost = 5;
    if (tokenStore.balance < coverCost) {
      throw new Error('Insufficient tokens for cover art generation');
    }
    tokenStore.deductTokens(coverCost);

    set({ isGeneratingCover: true, aiResults: null });

    try {
      const result = await aiClient.generateCoverArt({
        ...request,
        userId: user.id,
        style: request.style || 'illustration',
        quality: 'high'
      });

      set({
        aiResults: result,
        aiCostTracker: get().aiCostTracker + coverCost,
        tokenCosts: {
          ...get().tokenCosts,
          coverArt: (get().tokenCosts.coverArt || 0) + coverCost,
        }
      });
    } catch (error) {
      console.error('Error generating cover art:', error);
      set({
        aiResults: { error: error instanceof Error ? error.message : 'Failed to generate cover art' },
        isGeneratingCover: false
      });
      throw error;
    }
  },

  createCharacterAvatar: async (request: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const tokenStore = useTokenStore.getState();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Deduct tokens for avatar creation
    const avatarCost = 3;
    if (tokenStore.balance < avatarCost) {
      throw new Error('Insufficient tokens for avatar creation');
    }
    tokenStore.deductTokens(avatarCost);

    set({ isCreatingAvatar: true, aiResults: null });

    try {
      const result = await aiClient.generateCharacterAvatar({
        ...request,
        userId: user.id,
        style: request.style || 'realistic',
        quality: 'high'
      });

      set({
        aiResults: result,
        aiCostTracker: get().aiCostTracker + avatarCost,
        tokenCosts: {
          ...get().tokenCosts,
          characterAvatar: (get().tokenCosts.characterAvatar || 0) + avatarCost,
        }
      });
    } catch (error) {
      console.error('Error creating character avatar:', error);
      set({
        aiResults: { error: error instanceof Error ? error.message : 'Failed to create character avatar' },
        isCreatingAvatar: false
      });
      throw error;
    }
  },

  transformSelectedStyle: async (style: string) => {
    const { selectedText, currentContent } = get();
    const { data: { user } } = await supabase.auth.getUser();
    const tokenStore = useTokenStore.getState();

    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!selectedText) {
      throw new Error('No text selected for style transformation');
    }

    // Deduct tokens for style transformation
    const transformCost = 1;
    if (tokenStore.balance < transformCost) {
      throw new Error('Insufficient tokens for style transformation');
    }
    tokenStore.deductTokens(transformCost);

    set({ isTransformingStyle: true, aiResults: null });

    try {
      const result = await aiClient.transferStyle({
        text: selectedText,
        targetStyle: style as any,
        preserveMeaning: true,
        userId: user.id,
        storyId: '', // This would be passed from the story context
        chapterId: ''
      });

      // Replace selected text with transformed text
      const newContent = currentContent.replace(selectedText, result.transformed_text);
      set({ currentContent: newContent, selectedText: '' });

      set({
        aiResults: result,
        aiCostTracker: get().aiCostTracker + transformCost,
        tokenCosts: {
          ...get().tokenCosts,
          styleTransform: (get().tokenCosts.styleTransform || 0) + transformCost,
        }
      });
    } catch (error) {
      console.error('Error transforming style:', error);
      set({
        aiResults: { error: error instanceof Error ? error.message : 'Failed to transform style' },
        isTransformingStyle: false
      });
      throw error;
    }
  },

  checkCharacterConsistency: async (storyId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const tokenStore = useTokenStore.getState();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Deduct tokens for consistency check
    const consistencyCost = 1;
    if (tokenStore.balance < consistencyCost) {
      throw new Error('Insufficient tokens for character consistency check');
    }
    tokenStore.deductTokens(consistencyCost);

    set({ isAnalyzing: true, aiResults: null });

    try {
      const result = await aiClient.checkCharacterConsistency({
        storyId: storyId,
        userId: user.id,
        action: 'analyze'
      });

      set({
        aiCharacterConsistency: result,
        aiCostTracker: get().aiCostTracker + consistencyCost,
        tokenCosts: {
          ...get().tokenCosts,
          consistencyCheck: (get().tokenCosts.consistencyCheck || 0) + consistencyCost,
        }
      });
    } catch (error) {
      console.error('Error checking character consistency:', error);
      set({
        aiResults: { error: error instanceof Error ? error.message : 'Failed to check character consistency' },
        isAnalyzing: false
      });
      throw error;
    }
  },

  // Rich text methods
  insertMedia: (media: MediaAttachment) => {
    set((state) => ({
      mediaAttachments: [...state.mediaAttachments, media],
      draftContent: state.draftContent + `\n\n[Media: ${media.filename}]`
    }));
  },

  removeMedia: (mediaId: string) => {
    set((state) => ({
      mediaAttachments: state.mediaAttachments.filter(m => m.id !== mediaId),
    }));
  },

  applyFormatting: (format: string, content: string) => {
    const { selectedText, draftContent } = get();
    const textToFormat = content || selectedText;
    if (!textToFormat) return;

    const formattedText = `**${textToFormat}**`; // Bold as default
    const newContent = draftContent.replace(textToFormat, formattedText);
    set({ draftContent: newContent, selectedText: formattedText, selectedFormat: format });
  },

  saveDraft: async (storyId: string) => {
    const { draftContent, contextSnippet } = get();
    const tokenStore = useTokenStore.getState();

    // Deduct tokens for saving
    const saveCost = 0.1;
    if (tokenStore.balance >= saveCost) {
      tokenStore.deductTokens(saveCost);
    }

    const draft: DraftState = {
      id: `draft_${Date.now()}`,
      storyId,
      chapterId: '',
      content: draftContent,
      contextSnippet,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isAutoSaved: true,
    };

    // Save to local storage
    set((state) => ({
      localDrafts: {
        ...state.localDrafts,
        [draft.id]: draft,
      },
      lastSavedAt: Date.now(),
    }));

    // Sync to server if online
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('drafts')
          .insert({
            id: draft.id,
            user_id: user.id,
            story_id: storyId,
            content: draftContent,
            context_snippet: contextSnippet,
            is_auto_saved: true,
          });
      }
    } catch (error) {
      console.error('Error syncing draft:', error);
    }
  },

  loadDraft: (draftId: string) => {
    const { localDrafts } = get();
    const draft = localDrafts[draftId];

    if (draft) {
      set({
        draftContent: draft.content,
        contextSnippet: draft.contextSnippet,
        lastSavedAt: draft.updatedAt,
      });
    }
  },

  deleteDraft: async (draftId: string) => {
    // Delete from local storage
    set((state) => {
      const newDrafts = { ...state.localDrafts };
      delete newDrafts[draftId];
      return { localDrafts: newDrafts };
    });

    // Delete from server if online
    try {
      await supabase
        .from('drafts')
        .delete()
        .eq('id', draftId);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  },

  startAutoSave: (storyId: string, interval = 30000) => {
    // Clear existing timer
    if (get().autoSaveTimer) {
      clearInterval(get().autoSaveTimer);
    }

    // Set new timer
    const timer = setInterval(() => {
      get().saveDraft(storyId);
    }, interval);

    set({ autoSaveTimer: timer });
  },

  stopAutoSave: () => {
    if (get().autoSaveTimer) {
      clearInterval(get().autoSaveTimer);
      set({ autoSaveTimer: null });
    }
  },

  syncDrafts: async () => {
    set({ isSyncingDrafts: true });

    try {
      const { localDrafts } = get();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Sync unsynced drafts
      const unsyncedDrafts = Object.values(localDrafts).filter(d => !d.isAutoSaved);

      for (const draft of unsyncedDrafts) {
        await supabase
          .from('drafts')
          .upsert({
            id: draft.id,
            user_id: user.id,
            story_id: draft.storyId,
            content: draft.content,
            context_snippet: draft.contextSnippet,
            is_auto_saved: draft.isAutoSaved,
          });
      }

      // Fetch latest drafts from server
      const { data: serverDrafts } = await supabase
        .from('drafts')
        .select('*')
        .eq('user_id', user.id);

      // Merge with local drafts (server wins for conflicts)
      const mergedDrafts = { ...localDrafts };
      if (serverDrafts) {
        serverDrafts.forEach(serverDraft => {
          mergedDrafts[serverDraft.id] = {
            id: serverDraft.id,
            storyId: serverDraft.story_id,
            chapterId: serverDraft.chapter_id || '',
            content: serverDraft.content,
            contextSnippet: serverDraft.context_snippet,
            createdAt: new Date(serverDraft.created_at).getTime(),
            updatedAt: new Date(serverDraft.updated_at).getTime(),
            isAutoSaved: serverDraft.is_auto_saved,
          };
        });
      }

      set({ localDrafts: mergedDrafts });
    } catch (error) {
      console.error('Error syncing drafts:', error);
    } finally {
      set({ isSyncingDrafts: false });
    }
  },

  // Enhanced AI methods
  applyStylePreset: async (preset: string, content: string) => {
    const tokenStore = useTokenStore.getState();
    const presetCost = 1;

    if (tokenStore.balance < presetCost) {
      throw new Error('Insufficient tokens for style preset');
    }
    tokenStore.deductTokens(presetCost);

    try {
      const result = await aiClient.applyStylePreset({
        content,
        preset,
        userId: (await supabase.auth.getUser()).data.user?.id || '',
      });

      set({
        aiCostTracker: get().aiCostTracker + presetCost,
        tokenCosts: {
          ...get().tokenCosts,
          stylePreset: (get().tokenCosts.stylePreset || 0) + presetCost,
        }
      });

      return result.transformedContent;
    } catch (error) {
      console.error('Error applying style preset:', error);
      throw error;
    }
  },

  generateCharacterProfile: async (characterName: string) => {
    const tokenStore = useTokenStore.getState();
    const profileCost = 2;

    if (tokenStore.balance < profileCost) {
      throw new Error('Insufficient tokens for character profile');
    }
    tokenStore.deductTokens(profileCost);

    try {
      const result = await aiClient.generateCharacterProfile({
        name: characterName,
        userId: (await supabase.auth.getUser()).data.user?.id || '',
      });

      set({
        aiCostTracker: get().aiCostTracker + profileCost,
        tokenCosts: {
          ...get().tokenCosts,
          characterProfile: (get().tokenCosts.characterProfile || 0) + profileCost,
        }
      });

      return result;
    } catch (error) {
      console.error('Error generating character profile:', error);
      throw error;
    }
  },

  getStyleSuggestions: async () => {
    try {
      const result = await aiClient.getStyleSuggestions();
      set({ aiPromptSuggestions: result.suggestions });
      return result.suggestions;
    } catch (error) {
      console.error('Error getting style suggestions:', error);
      return [];
    }
  },

  maintainCharacterVoice: async (characterId: string, content: string) => {
    const tokenStore = useTokenStore.getState();
    const voiceCost = 1;

    if (tokenStore.balance < voiceCost) {
      throw new Error('Insufficient tokens for voice maintenance');
    }
    tokenStore.deductTokens(voiceCost);

    try {
      const result = await aiClient.maintainCharacterVoice({
        characterId,
        content,
        userId: (await supabase.auth.getUser()).data.user?.id || '',
      });

      set({
        aiCostTracker: get().aiCostTracker + voiceCost,
        tokenCosts: {
          ...get().tokenCosts,
          voiceMaintenance: (get().tokenCosts.voiceMaintenance || 0) + voiceCost,
        }
      });

      return result.transformedContent;
    } catch (error) {
      console.error('Error maintaining character voice:', error);
      throw error;
    }
  },

  clearAIResults: () => {
    set({ aiResults: null });
  },

  reset: () => {
    set({
      draftContent: '',
      contextSnippet: null,
      isEnhancing: false,
      isSubmitting: false,
      aiEnhancedContent: null,
      selectedText: '',
      currentContent: '',
      isAnalyzing: false,
      isGeneratingCover: false,
      isCreatingAvatar: false,
      isTransformingStyle: false,
      aiResults: null,
      aiCostTracker: 0,
      mediaAttachments: [],
      isUploadingMedia: false,
      uploadProgress: 0,
      undoStack: [],
      redoStack: [],
      autoSaveTimer: null,
      lastSavedAt: null,
      selectedFormat: null,
    });

    // Stop auto-save
    get().stopAutoSave();
  },

  }));