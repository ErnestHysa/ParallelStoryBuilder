'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lightbulb,
  Search,
  Filter,
  Plus,
  Sparkles,
  Calendar,
  BookOpen,
  Trash2,
  Edit3,
  X,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { getIntentionsService, type Inspiration, type AISuggestion } from '@/lib/intentions';
import { cn } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';

const themeColors: Record<string, { gradient: string; bg: string; emoji: string }> = {
  romance: {
    gradient: 'from-rose-400 to-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30',
    emoji: '💕',
  },
  fantasy: {
    gradient: 'from-amethyst-400 to-amethyst-600',
    bg: 'bg-amethyst-50 dark:bg-amethyst-950/20 border-amethyst-200 dark:border-amethyst-900/30',
    emoji: '🐉',
  },
  our_future: {
    gradient: 'from-gold-400 to-gold-600',
    bg: 'bg-gold-50 dark:bg-gold-950/20 border-gold-200 dark:border-gold-900/30',
    emoji: '🌟',
  },
};

export default function AllInspirationsPage() {
  const router = useRouter();
  const intentionsService = getIntentionsService();
  const supabase = getSupabaseClient();

  const [allInspirations, setAllInspirations] = useState<(Inspiration & { story?: any })[]>([]);
  const [filteredInspirations, setFilteredInspirations] = useState<(Inspiration & { story?: any })[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedStory, setSelectedStory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedTheme, selectedStory, allInspirations]);

  const loadAllData = async () => {
    try {
      // Load all stories
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: storiesData } = await supabase
        .from('stories')
        .select('id, title, theme')
        .or(`created_by.eq.${user.id},id.in.(select story_id from story_members where user_id=${user.id})`);

      if (storiesData) {
        setStories(storiesData);

        // Load inspirations for each story
        const inspirationsPromises = storiesData.map(async (story) => {
          const storyInspirations = await intentionsService.getInspirations(story.id);
          return storyInspirations.map((insp) => ({ ...insp, story }));
        });

        const allInspirationsFlat = (await Promise.all(inspirationsPromises)).flat();
        // Sort by date (newest first)
        allInspirationsFlat.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setAllInspirations(allInspirationsFlat);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load inspirations');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allInspirations];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((insp) =>
        insp.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Theme filter
    if (selectedTheme !== 'all') {
      filtered = filtered.filter((insp) => insp.story?.theme === selectedTheme);
    }

    // Story filter
    if (selectedStory !== 'all') {
      filtered = filtered.filter((insp) => insp.story_id === selectedStory);
    }

    setFilteredInspirations(filtered);
  };

  const handleDeleteInspiration = async (inspirationId: string) => {
    try {
      await intentionsService.deleteInspiration(inspirationId);
      setAllInspirations((prev) => prev.filter((i) => i.id !== inspirationId));
      toast.success('Inspiration deleted');
    } catch (error) {
      console.error('Error deleting inspiration:', error);
      toast.error('Failed to delete inspiration');
    }
  };

  const getUniqueThemes = () => {
    const themes = new Set(stories.map((s) => s.theme));
    return Array.from(themes);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedTheme !== 'all' ? 1 : 0) +
    (selectedStory !== 'all' ? 1 : 0);

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

      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl text-ink-950 dark:text-dark-text mb-2 flex items-center gap-3">
            <Lightbulb className="w-10 h-10 text-rose-500" />
            Your Inspirations
          </h1>
          <p className="font-body text-ink-700 dark:text-dark-textSecondary">
            All your creative ideas in one place
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400 dark:text-dark-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search through your inspirations..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-bgSecondary border border-cream-200 dark:border-dark-border rounded-xl text-ink-950 dark:text-dark-text placeholder:text-ink-400 dark:placeholder:text-dark-textMuted focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-cream-100 dark:hover:bg-dark-bgTertiary rounded-full"
              >
                <X className="w-4 h-4 text-ink-400 dark:text-dark-textMuted" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-accent font-medium transition-all",
              activeFiltersCount > 0
                ? "bg-rose-500 text-white"
                : "bg-white dark:bg-dark-bgSecondary text-ink-700 dark:text-dark-text border border-cream-200 dark:border-dark-border"
            )}
          >
            <Filter className="w-5 h-5" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* New Story Button */}
          <Link
            href="/stories/new"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-xl font-accent font-medium hover:shadow-elegant transition-all"
          >
            <Plus className="w-5 h-5" />
            New Story
          </Link>
        </motion.div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 bg-white dark:bg-dark-bgSecondary rounded-xl border border-cream-200 dark:border-dark-border"
          >
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Theme Filter */}
              <div>
                <label className="block text-sm font-accent text-ink-700 dark:text-dark-text mb-2">
                  Theme
                </label>
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="w-full px-4 py-2 bg-cream-100 dark:bg-dark-bgTertiary border border-cream-200 dark:border-dark-border rounded-lg text-ink-950 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700"
                >
                  <option value="all">All Themes</option>
                  {getUniqueThemes().map((theme) => (
                    <option key={theme} value={theme}>
                      {theme === 'romance' ? '💕 Romance' : theme === 'fantasy' ? '🐉 Fantasy' : '🌟 Our Future'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Story Filter */}
              <div>
                <label className="block text-sm font-accent text-ink-700 dark:text-dark-text mb-2">
                  Story
                </label>
                <select
                  value={selectedStory}
                  onChange={(e) => setSelectedStory(e.target.value)}
                  className="w-full px-4 py-2 bg-cream-100 dark:bg-dark-bgTertiary border border-cream-200 dark:border-dark-border rounded-lg text-ink-950 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700"
                >
                  <option value="all">All Stories</option>
                  {stories.map((story) => (
                    <option key={story.id} value={story.id}>
                      {story.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTheme('all');
                  setSelectedStory('all');
                }}
                className="mt-4 text-sm text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-medium"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-6"
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <p className="font-display text-xl text-ink-950 dark:text-dark-text">
                {allInspirations.length}
              </p>
              <p className="text-sm text-ink-600 dark:text-dark-textMuted">Total Ideas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amethyst-100 dark:bg-amethyst-900/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amethyst-500" />
            </div>
            <div>
              <p className="font-display text-xl text-ink-950 dark:text-dark-text">
                {stories.length}
              </p>
              <p className="text-sm text-ink-600 dark:text-dark-textMuted">Stories</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <p className="font-display text-xl text-ink-950 dark:text-dark-text">
                {filteredInspirations.length}
              </p>
              <p className="text-sm text-ink-600 dark:text-dark-textMuted">Showing</p>
            </div>
          </div>
        </motion.div>

        {/* Inspirations Grid */}
        {filteredInspirations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16 bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-soft"
          >
            <div className="w-20 h-20 rounded-full bg-cream-100 dark:bg-dark-bgTertiary flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-10 h-10 text-ink-400 dark:text-dark-textMuted" />
            </div>
            <h3 className="font-display text-xl text-ink-950 dark:text-dark-text mb-2">
              {allInspirations.length === 0 ? 'No inspirations yet' : 'No results found'}
            </h3>
            <p className="font-body text-ink-700 dark:text-dark-textSecondary mb-6">
              {allInspirations.length === 0
                ? 'Start adding inspirations to your stories to see them here.'
                : 'Try adjusting your filters or search query.'}
            </p>
            {allInspirations.length === 0 && stories.length > 0 && (
              <Link
                href={`/stories/${stories[0].id}/inspirations`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-full font-accent hover:shadow-elegant transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Inspiration
              </Link>
            )}
            {stories.length === 0 && (
              <Link
                href="/stories/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-full font-accent hover:shadow-elegant transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Create Your First Story
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {filteredInspirations.map((inspiration, index) => {
              const themeInfo = themeColors[inspiration.story?.theme] || themeColors.our_future;

              return (
                <motion.div
                  key={inspiration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-6 rounded-2xl border shadow-soft hover:shadow-medium transition-all",
                    themeInfo.bg
                  )}
                >
                  {/* Story Link */}
                  <Link
                    href={`/stories/${inspiration.story_id}/inspirations`}
                    className="flex items-center gap-2 text-sm font-accent text-ink-600 dark:text-dark-textSecondary hover:text-rose-500 dark:hover:text-rose-400 mb-3 transition-colors"
                  >
                    {themeInfo.emoji} {inspiration.story?.title || 'Unknown Story'}
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  {/* Content */}
                  <p className="font-body text-ink-800 dark:text-dark-text text-lg leading-relaxed mb-4">
                    {inspiration.content}
                  </p>

                  {/* Media attachments */}
                  {inspiration.media && inspiration.media.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {inspiration.media.map((media, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-dark-bgSecondary rounded-full text-sm text-ink-600 dark:text-dark-textSecondary"
                        >
                          <ImageIcon className="w-3 h-3" />
                          {media.title || 'Media'}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-dark-textMuted">
                      <Calendar className="w-4 h-4" />
                      {formatDate(inspiration.created_at)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/stories/${inspiration.story_id}/inspirations`}
                        className="p-2 text-ink-400 hover:text-rose-500 dark:text-dark-textMuted dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors"
                        title="View in story"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteInspiration(inspiration.id)}
                        className="p-2 text-ink-400 hover:text-red-500 dark:text-dark-textMuted dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
                        title="Delete inspiration"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </>
  );
}
