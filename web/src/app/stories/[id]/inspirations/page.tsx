'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Lightbulb,
  X,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { getIntentionsService, type Inspiration, type AISuggestion, type MediaAttachment } from '@/lib/intentions';
import { cn } from '@/lib/utils';
import { MediaPicker } from '@/components/MediaPicker';
import toast, { Toaster } from 'react-hot-toast';

const themeColors: Record<string, string> = {
  romance: 'from-rose-400 to-rose-600',
  fantasy: 'from-amethyst-400 to-amethyst-600',
  our_future: 'from-gold-400 to-gold-600',
};

const themeBgColors: Record<string, string> = {
  romance: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30',
  fantasy: 'bg-amethyst-50 dark:bg-amethyst-950/20 border-amethyst-200 dark:border-amethyst-900/30',
  our_future: 'bg-gold-50 dark:bg-gold-950/20 border-gold-200 dark:border-gold-900/30',
};

export default function StoryInspirationsPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const intentionsService = getIntentionsService();
  const supabase = getSupabaseClient();

  const [story, setStory] = useState<any>(null);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newInspiration, setNewInspiration] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaAttachment[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  useEffect(() => {
    loadStoryAndInspirations();
    // Subscribe to inspirations changes
    let unsubscribe: (() => void) | undefined;
    intentionsService.subscribeToInspirations(
      storyId,
      (updatedInspirations) => {
        setInspirations(updatedInspirations);
      }
    ).then((fn) => { unsubscribe = fn; });
    return () => { unsubscribe?.(); };
  }, [storyId]);

  const loadStoryAndInspirations = async () => {
    try {
      // Load story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;
      setStory(storyData);

      // Load inspirations
      const loadedInspirations = await intentionsService.getInspirations(storyId);
      setInspirations(loadedInspirations);

      // Generate AI suggestions based on theme
      const storyTheme = (storyData as any)?.theme || 'our_future';
      const suggestions = intentionsService.getRandomSuggestions(storyTheme, 6);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load inspirations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInspiration = async () => {
    if (!newInspiration.trim()) return;

    setIsSubmitting(true);
    try {
      await intentionsService.addInspiration(storyId, newInspiration.trim(), selectedMedia);
      setNewInspiration('');
      setSelectedMedia([]);
      toast.success('Inspiration added!');
    } catch (error) {
      console.error('Error adding inspiration:', error);
      toast.error('Failed to add inspiration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInspiration = async (inspirationId: string) => {
    try {
      await intentionsService.deleteInspiration(inspirationId);
      toast.success('Inspiration deleted');
    } catch (error) {
      console.error('Error deleting inspiration:', error);
      toast.error('Failed to delete inspiration');
    }
  };

  const handleUseSuggestion = (suggestion: AISuggestion) => {
    setNewInspiration(suggestion.text);
    setShowAISuggestions(false);
  };

  const handleRefreshSuggestions = () => {
    if (story) {
      const suggestions = intentionsService.getRandomSuggestions(story.theme, 6);
      setAiSuggestions(suggestions);
      toast.success('Suggestions refreshed!');
    }
  };

  const getThemeInfo = () => {
    if (!story) return null;
    return intentionsService.getThemeInfo(story.theme);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-rose-200 dark:border-rose-900 border-t-rose-500 dark:border-t-rose-400 rounded-full"
        />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="text-center py-16">
        <h2 className="font-display text-2xl text-ink-950 dark:text-dark-text mb-4">Story not found</h2>
        <button
          onClick={() => router.back()}
          className="text-rose-500 dark:text-dark-rose hover:text-rose-600 dark:hover:text-rose-400"
        >
          Back to story
        </button>
      </div>
    );
  }

  const themeInfo = getThemeInfo();
  const gradientColor = themeColors[story.theme] || themeColors.romance;
  const bgColors = themeBgColors[story.theme] || themeBgColors.romance;

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

      <div className="space-y-8">
        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-ink-700 dark:text-dark-textSecondary hover:text-rose-500 dark:hover:text-dark-rose font-body transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Story
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className={`absolute inset-0 -mx-6 -mt-6 h-48 bg-gradient-to-br ${gradientColor} rounded-t-3xl`} />

          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{themeInfo?.emoji}</span>
              <div>
                <h1 className="font-display text-4xl md:text-display-lg text-white mb-1">
                  Inspirations
                </h1>
                <p className="text-white/90 font-body">{story.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm font-accent backdrop-blur-sm">
                {themeInfo?.label} Theme
              </span>
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm font-accent backdrop-blur-sm">
                {inspirations.length} {inspirations.length === 1 ? 'idea' : 'ideas'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Add Inspiration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "rounded-2xl p-6 border",
            bgColors
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink-950 dark:text-dark-text flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Add New Inspiration
            </h2>
            <button
              onClick={() => {
                setShowAISuggestions(!showAISuggestions);
                if (!showAISuggestions && aiSuggestions.length === 0) {
                  handleRefreshSuggestions();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-full font-accent text-sm hover:shadow-elegant transition-all"
            >
              <Sparkles className="w-4 h-4" />
              AI Suggestions
            </button>
          </div>

          <p className="font-body text-ink-700 dark:text-dark-textSecondary mb-4">
            Share ideas, prompts, or themes for your story
          </p>

          <textarea
            value={newInspiration}
            onChange={(e) => setNewInspiration(e.target.value)}
            placeholder="E.g., 'What if they meet during a thunderstorm?'"
            className="w-full px-4 py-3 bg-white dark:bg-dark-bgSecondary border border-cream-200 dark:border-dark-border rounded-xl text-ink-950 dark:text-dark-text placeholder:text-ink-400 dark:placeholder:text-dark-textMuted focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700 resize-none"
            rows={4}
            maxLength={500}
          />

          {/* Media Picker */}
          <div className="mt-4">
            <MediaPicker
              onMediaSelect={setSelectedMedia}
              selectedMedia={selectedMedia}
              maxFiles={3}
              accept="all"
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-ink-500 dark:text-dark-textMuted">
              {newInspiration.length}/500
            </span>
            <button
              onClick={handleAddInspiration}
              disabled={!newInspiration.trim() || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-full font-accent hover:shadow-elegant transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Inspiration
            </button>
          </div>
        </motion.div>

        {/* AI Suggestions */}
        <AnimatePresence>
          {showAISuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-ink-950 dark:text-dark-text flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    AI-Powered Suggestions
                  </h3>
                  <button
                    onClick={handleRefreshSuggestions}
                    className="p-2 hover:bg-white dark:hover:bg-dark-bgSecondary rounded-full transition-colors"
                    title="Refresh suggestions"
                  >
                    <RefreshCw className="w-4 h-4 text-ink-600 dark:text-dark-textSecondary" />
                  </button>
                </div>

                <p className="text-sm text-ink-600 dark:text-dark-textSecondary mb-4">
                  Click any suggestion to use it for your inspiration
                </p>

                <div className="grid gap-3">
                  {aiSuggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleUseSuggestion(suggestion)}
                      className="text-left p-4 bg-white dark:bg-dark-bgSecondary rounded-xl border border-cream-200 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-soft transition-all group"
                    >
                      <p className="font-body text-ink-800 dark:text-dark-text group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {suggestion.text}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inspirations List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-xl text-ink-950 dark:text-dark-text mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Story Inspirations ({inspirations.length})
          </h2>

          {inspirations.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-soft">
              <div className="w-20 h-20 rounded-full bg-cream-100 dark:bg-dark-bgTertiary flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-10 h-10 text-ink-400 dark:text-dark-textMuted" />
              </div>
              <h3 className="font-display text-xl text-ink-950 dark:text-dark-text mb-2">No inspirations yet</h3>
              <p className="font-body text-ink-700 dark:text-dark-textSecondary mb-6">
                Add your first inspiration to spark your creativity
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inspirations.map((inspiration, index) => (
                <motion.div
                  key={inspiration.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-soft border border-cream-200 dark:border-dark-border"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-body text-ink-800 dark:text-dark-text text-lg leading-relaxed">
                        {inspiration.content}
                      </p>
                      {inspiration.media && inspiration.media.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {inspiration.media.map((media, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3 py-1 bg-cream-100 dark:bg-dark-bgTertiary rounded-full text-sm text-ink-600 dark:text-dark-textSecondary"
                            >
                              <ImageIcon className="w-3 h-3" />
                              {media.title || 'Media'}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-ink-500 dark:text-dark-textMuted mt-3">
                        {new Date(inspiration.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteInspiration(inspiration.id)}
                      className="p-2 text-ink-400 hover:text-red-500 dark:text-dark-textMuted dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
                      title="Delete inspiration"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
