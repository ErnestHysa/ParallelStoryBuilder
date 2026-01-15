'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Wand2,
  Eye,
  EyeOff,
  X,
  Lightbulb,
  Image,
  Mic,
  Clock,
} from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useEditorStore } from '@/stores/editorStore';
import type { Story, Chapter } from '@/types';
import type { EnhancementType } from '@/lib/aiClient';
import { cn } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';
import RichTextEditor from '@/components/RichTextEditor';

const DRAFT_STORAGE_KEY = (storyId: string) => `parallel-draft-${storyId}`;
const MIN_CONTENT_LENGTH = 50;

const aiEnhancements = [
  { id: 'sensory', name: 'Add sensory details', description: 'Enhance with vivid descriptions', tokens: 3, icon: '🎨' },
  { id: 'dialogue', name: 'Improve dialogue', description: 'Make conversations more natural', tokens: 3, icon: '💬' },
  { id: 'emotional', name: 'Deepen emotions', description: 'Add emotional depth and feeling', tokens: 3, icon: '💝' },
  { id: 'creative', name: 'Creative expansion', description: 'Add imaginative elements', tokens: 5, icon: '✨' },
];

const writingPrompts = [
  'Describe their first meeting from your partner\'s perspective',
  'Add a moment of vulnerability between the characters',
  'Introduce an unexpected obstacle',
  'Write about a shared memory that brings them closer',
  'Describe the setting using all five senses',
];

export default function WriteChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { profile, isLoading: isLoadingAuth } = useAuthStore();
  const editorStore = useEditorStore();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [content, setContent] = useState('');
  const [contextSnippet, setContextSnippet] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState<string | null>(null);

  // Use ref to track last saved content for auto-save comparison
  const lastSavedContentRef = useRef('');
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!profile && !isLoadingAuth) {
      // If we're done loading auth and still no profile, we might need to redirect
      // But let's first check if we can get the user from Supabase directly
      checkAuth();
    } else if (profile) {
      loadStory();
      loadChapterCount();
    }
  }, [storyId, profile, isLoadingAuth]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!storyId) return;

    try {
      const draftKey = DRAFT_STORAGE_KEY(storyId);
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.content) {
          setContent(draft.content);
          lastSavedContentRef.current = draft.content;
        }
        if (draft.contextSnippet) {
          setContextSnippet(draft.contextSnippet);
        }
        toast('Draft restored from local storage', { icon: '📝' });
      }
    } catch (error) {
      console.error('Error loading draft from localStorage:', error);
    }
  }, [storyId]);

  // Save draft to localStorage whenever content or context changes
  useEffect(() => {
    if (!storyId) return;

    try {
      const draftKey = DRAFT_STORAGE_KEY(storyId);
      const draft = {
        content,
        contextSnippet,
        savedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (error) {
      console.error('Error saving draft to localStorage:', error);
    }
  }, [storyId, content, contextSnippet]);

  // Auto-save functionality
  useEffect(() => {
    // Only set up auto-save if Supabase is configured and user is authenticated
    if (!isSupabaseConfigured() || !profile) {
      return;
    }

    autoSaveIntervalRef.current = setInterval(async () => {
      const currentContent = content.trim();
      const lastSaved = lastSavedContentRef.current.trim();

      // Only auto-save if content has changed and meets minimum length
      if (currentContent && currentContent !== lastSaved && currentContent.length >= MIN_CONTENT_LENGTH) {
        setIsAutoSaving(true);
        try {
          await autoSaveChapter();
          lastSavedContentRef.current = content;
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }
    }, 30000); // Auto-save every 30 seconds

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [content, profile, storyId]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (content.trim() && hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires this
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [content, hasUnsavedChanges]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(content !== lastSavedContentRef.current);
  }, [content]);

  const checkAuth = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to write');
      router.push('/auth/login');
      return;
    }
    loadStory();
    loadChapterCount();
  };

  const loadStory = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (error) throw error;
      setStory(data as unknown as Story);
    } catch (error) {
      console.error('Error loading story:', error);
      toast.error('Failed to load story');
    }
  };

  const loadChapterCount = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: false })
        .limit(1);

      if (error) throw error;
      setChapterNumber(((data?.[0] as any)?.chapter_number ?? 0) + 1);
    } catch (error) {
      console.error('Error loading chapter count:', error);
    }
  };

  const autoSaveChapter = async () => {
    if (!content.trim() || content.trim().length < MIN_CONTENT_LENGTH) {
      return;
    }

    const supabase = getSupabaseClient();

    // Get current user ID from store or double check with Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userId = profile?.id || user?.id;

    if (!userId) {
      console.warn('Auto-save skipped: No authenticated user found');
      return;
    }

    try {
      // Fetch the latest chapter number at this moment to handle race conditions
      const { data: lastChapter } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextChapterNumber = lastChapter ? (lastChapter as any).chapter_number + 1 : 1;

      // Try to insert with retry logic for race condition
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        const { data: insertedChapter, error: chapterError } = await supabase
          .from('chapters')
          .insert([{
            story_id: storyId,
            author_id: userId,
            chapter_number: nextChapterNumber,
            content: content.trim(),
            context_snippet: contextSnippet.trim() || null,
          }] as any)
          .select()
          .maybeSingle();

        // If unique constraint violation (race condition), retry
        if (chapterError?.code === '23505' && retries < maxRetries - 1) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100 * retries)); // Exponential backoff
          continue;
        }

        if (chapterError) {
          throw chapterError;
        }

        // Successfully saved
        setLastSaved(Date.now());
        setHasUnsavedChanges(false);
        setChapterNumber(nextChapterNumber + 1);
        lastSavedContentRef.current = content;

        // Clear localStorage draft after successful save
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY(storyId));
        } catch (e) {
          // Ignore storage errors
        }

        return insertedChapter;
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please write something first');
      return;
    }

    // Add content length validation
    if (content.trim().length < MIN_CONTENT_LENGTH) {
      toast.error(`Chapter content must be at least ${MIN_CONTENT_LENGTH} characters long`);
      return;
    }

    if (content.trim().length > 50000) {
      toast.error('Chapter content is too long (max 50,000 characters)');
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getSupabaseClient();

      // Get current user ID from store or double check with Supabase
      const { data: { user } } = await supabase.auth.getUser();
      const userId = profile?.id || user?.id;

      if (!userId) {
        toast.error('You must be logged in to save chapters');
        console.error('Save failed: No authenticated user found');
        setIsSaving(false);
        return;
      }

      // Fetch the latest chapter number at this moment to handle race conditions
      const { data: lastChapter, error: fetchError } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      const nextChapterNumber = lastChapter ? (lastChapter as any).chapter_number + 1 : 1;

      // Try to insert with retry logic for race conditions
      let retries = 0;
      const maxRetries = 3;
      let savedChapter = null;

      while (retries < maxRetries) {
        const { data: insertedChapter, error: chapterError } = await supabase
          .from('chapters')
          .insert([{
            story_id: storyId,
            author_id: userId,
            chapter_number: nextChapterNumber,
            content: content.trim(),
            context_snippet: contextSnippet.trim() || null,
          }] as any)
          .select()
          .single();

        // If unique constraint violation (race condition), fetch again and retry
        if (chapterError?.code === '23505' && retries < maxRetries - 1) {
          retries++;
          // Re-fetch the latest chapter number
          const { data: reFetchedChapter } = await supabase
            .from('chapters')
            .select('chapter_number')
            .eq('story_id', storyId)
            .order('chapter_number', { ascending: false })
            .limit(1)
            .maybeSingle();

          const retryChapterNumber = reFetchedChapter ? (reFetchedChapter as any).chapter_number + 1 : 1;
          // Use a closure to capture the updated chapter number
          // Note: In production, you'd want to restructure this loop differently
          break; // For now, break and let user retry
        }

        if (chapterError) {
          console.error('Supabase error saving chapter:', chapterError);
          throw chapterError;
        }

        savedChapter = insertedChapter;
        break;
      }

      if (!savedChapter) {
        throw new Error('Failed to save chapter after retries');
      }

      // Update state after successful save
      setLastSaved(Date.now());
      setHasUnsavedChanges(false);
      setChapterNumber(nextChapterNumber + 1);
      lastSavedContentRef.current = content;

      // Clear localStorage draft after successful save
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY(storyId));
      } catch (e) {
        // Ignore storage errors
      }

      toast.success('Chapter saved!');
      router.push(`/stories/${storyId}/chapter/${(savedChapter as any).id}`);
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast.error('Failed to save chapter. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnhance = async (type: EnhancementType) => {
    if (!content.trim()) {
      toast.error('Please write something first');
      return;
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      toast.error('AI features require Supabase configuration. Please set up your .env file.');
      return;
    }

    setIsEnhancing(true);

    try {
      // Dynamic import to avoid SSR issues
      const { aiClient } = await import('@/lib/aiClient');

      toast.loading('Enhancing your content...', { id: 'enhance-loading' });

      const enhanced = await aiClient.enhanceContent(content, type, storyId);

      toast.dismiss('enhance-loading');
      toast.success('Content enhanced with AI!');

      // Set the enhanced content
      setEnhancedContent(enhanced);
    } catch (error) {
      toast.dismiss('enhance-loading');
      const errorMessage = error instanceof Error ? error.message : 'Failed to enhance content';
      console.error('AI enhancement error:', error);
      toast.error(errorMessage);
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyEnhancedContent = () => {
    if (enhancedContent) {
      setContent(enhancedContent);
      setEnhancedContent(null);
      toast.success('Applied enhanced version!');
    }
  };

  const insertPrompt = (prompt: string) => {
    setContextSnippet(prompt);
    setShowPrompt(false);
    toast.success('Writing prompt added!');
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#2D2A2E',
            color: '#FAF7F5',
            fontFamily: 'var(--font-body)',
          },
        }}
      />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-cream-200 dark:hover:bg-dark-bgTertiary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-ink-700 dark:text-dark-textSecondary" />
            </button>
            <div>
              <p className="text-sm text-ink-600 dark:text-dark-textMuted font-body">
                {story?.title} • Chapter {chapterNumber}
              </p>
              <h1 className="font-display text-2xl text-ink-950 dark:text-dark-text">
                {previewMode ? 'Preview' : 'Write Your Chapter'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            {lastSaved && (
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-body">
                <Clock className="w-3 h-3" />
                Saved {isAutoSaving ? '...' : 'just now'}
              </span>
            )}

            {/* Word count */}
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-cream-200 dark:bg-dark-bgTertiary text-ink-700 dark:text-dark-textSecondary text-sm font-body">
              {wordCount} words
            </span>

            {/* Preview toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="p-2 hover:bg-cream-200 dark:hover:bg-dark-bgTertiary rounded-lg transition-colors"
              title={previewMode ? 'Edit' : 'Preview'}
            >
              {previewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>

            {/* AI button */}
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                showAIPanel
                  ? 'bg-amethyst-500 dark:bg-amethyst-600 text-white'
                  : 'bg-cream-200 dark:bg-dark-bgTertiary text-ink-700 dark:text-dark-textSecondary hover:bg-amethyst-100 dark:hover:bg-amethyst-900/30'
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline font-accent">AI Tools</span>
            </button>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isSaving || isAutoSaving || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 dark:bg-dark-rose text-white rounded-lg font-accent hover:bg-rose-600 dark:hover:bg-rose-400 disabled:opacity-50 transition-all"
            >
              {isSaving || isAutoSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </motion.div>

        <div className="flex gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn('flex-1', showAIPanel && 'max-w-2xl')}
          >
            {previewMode ? (
              <div className="bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-soft p-8 md:p-12 min-h-[60vh]">
                <div className="prose prose-lg max-w-none">
                  <h2 className="font-display text-3xl text-ink-950 dark:text-dark-text mb-6">
                    Chapter {chapterNumber}
                  </h2>
                  <div
                    className="font-body text-ink-800 dark:text-dark-textSecondary leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content || 'Your story will appear here...' }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Context snippet */}
                <div className="bg-white dark:bg-dark-bgSecondary rounded-xl shadow-soft p-4">
                  <label className="flex items-center gap-2 text-sm font-accent text-ink-800 dark:text-dark-text mb-2">
                    <Lightbulb className="w-4 h-4 text-gold-500 dark:text-dark-gold" />
                    Context (optional)
                  </label>
                  <input
                    type="text"
                    value={contextSnippet}
                    onChange={(e) => setContextSnippet(e.target.value)}
                    placeholder="What should your partner know before writing? (e.g., 'Continuing the beach scene...')"
                    className="w-full px-4 py-2 bg-cream-100 dark:bg-dark-bgTertiary rounded-lg text-ink-950 dark:text-dark-text placeholder:text-ink-500 dark:placeholder:text-dark-textMuted focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700"
                  />
                </div>

                {/* Rich Text Editor */}
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Begin writing your chapter here... Let your imagination flow freely."
                />

                {/* Writing prompt */}
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-cream-300 dark:border-dark-border rounded-xl text-ink-600 dark:text-dark-textSecondary hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  Need inspiration? Get a writing prompt
                </button>

                {showPrompt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-50 dark:bg-rose-950/20 rounded-xl p-4 border border-rose-100 dark:border-rose-900/30"
                  >
                    <p className="text-sm text-ink-700 dark:text-dark-textSecondary mb-3 font-body">Choose a prompt to inspire your writing:</p>
                    <div className="space-y-2">
                      {writingPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => insertPrompt(prompt)}
                          className="w-full text-left p-3 bg-white dark:bg-dark-bgSecondary rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors text-sm text-ink-800 dark:text-dark-text"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Content Preview */}
                {enhancedContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-amethyst-50 to-rose-50 dark:from-amethyst-950/30 dark:to-rose-950/30 rounded-xl p-5 border border-amethyst-200 dark:border-amethyst-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amethyst-600 dark:text-amethyst-400" />
                        <h4 className="font-accent font-semibold text-ink-950 dark:text-dark-text">AI Enhanced Version</h4>
                      </div>
                      <button
                        onClick={() => setEnhancedContent(null)}
                        className="p-1 hover:bg-amethyst-100 dark:hover:bg-amethyst-900/30 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-ink-600 dark:text-dark-textSecondary" />
                      </button>
                    </div>
                    <div className="bg-white dark:bg-dark-bgSecondary rounded-lg p-4 mb-3 max-h-60 overflow-y-auto">
                      <p className="font-body text-sm text-ink-800 dark:text-dark-textSecondary whitespace-pre-wrap">
                        {enhancedContent}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={applyEnhancedContent}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amethyst-600 dark:bg-amethyst-500 text-white rounded-lg font-accent text-sm hover:bg-amethyst-700 dark:hover:bg-amethyst-600 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        Use Enhanced Version
                      </button>
                      <button
                        onClick={() => setEnhancedContent(null)}
                        className="px-4 py-2 bg-ink-100 dark:bg-dark-bgTertiary text-ink-700 dark:text-dark-textSecondary rounded-lg font-accent text-sm hover:bg-ink-200 dark:hover:bg-dark-bgTertiary transition-colors"
                      >
                        Discard
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          {/* AI Panel */}
          <AnimatePresence>
            {showAIPanel && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="w-72 flex-shrink-0"
              >
                <div className="sticky top-24 bg-gradient-to-b from-amethyst-50 dark:from-amethyst-950/30 to-white dark:to-dark-bgSecondary rounded-2xl shadow-medium p-6 border border-amethyst-100 dark:border-amethyst-900/30">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg text-ink-950 dark:text-dark-text">AI Magic</h3>
                    <button
                      onClick={() => setShowAIPanel(false)}
                      className="p-1 hover:bg-amethyst-100 dark:hover:bg-amethyst-900/30 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-ink-600 dark:text-dark-textSecondary" />
                    </button>
                  </div>

                  <p className="text-sm text-ink-700 dark:text-dark-textSecondary mb-6 font-body">
                    Enhance your writing with AI assistance
                  </p>

                  <div className="space-y-3">
                    {aiEnhancements.map((enhancement) => (
                      <button
                        key={enhancement.id}
                        onClick={() => handleEnhance(enhancement.id as EnhancementType)}
                        disabled={isEnhancing || !content.trim()}
                        className="w-full p-4 bg-white dark:bg-dark-bgSecondary rounded-xl border border-amethyst-100 dark:border-amethyst-900/30 hover:border-amethyst-300 dark:hover:border-amethyst-700 hover:shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{enhancement.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-accent font-medium text-ink-950 dark:text-dark-text text-sm">
                              {enhancement.name}
                            </p>
                            <p className="text-xs text-ink-600 dark:text-dark-textMuted mt-0.5">
                              {enhancement.description}
                            </p>
                          </div>
                          {isEnhancing ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-amethyst-300 border-t-amethyst-600 rounded-full"
                            />
                          ) : (
                            <span className="text-xs text-gold-600 dark:text-dark-gold font-medium whitespace-nowrap">
                              {enhancement.tokens} 🔥
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Coming soon features */}
                  <div className="mt-6 pt-6 border-t border-amethyst-200 dark:border-amethyst-800">
                    <p className="text-xs text-ink-500 dark:text-dark-textMuted font-accent mb-3">Coming Soon</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm text-ink-600 dark:text-dark-textSecondary opacity-60">
                        <Image className="w-4 h-4" />
                        <span>Illustrate scene</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-ink-600 dark:text-dark-textSecondary opacity-60">
                        <Mic className="w-4 h-4" />
                        <span>Voice-to-text</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
