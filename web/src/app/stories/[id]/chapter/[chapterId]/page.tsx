'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit3,
  Clock,
  User,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Story, Chapter } from '@/types';
import { formatDate } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';

const themeColors: Record<string, string> = {
  romance: 'from-rose-400 to-rose-600',
  fantasy: 'from-amethyst-400 to-amethyst-600',
  our_future: 'from-gold-400 to-gold-600',
};

const themeEmojis: Record<string, string> = {
  romance: '💕',
  fantasy: '🐉',
  our_future: '🌟',
};

export default function ChapterViewPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthStore();
  const storyId = params.id as string;
  const chapterId = params.chapterId as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authorName, setAuthorName] = useState<string>('');

  useEffect(() => {
    loadChapter();
  }, [storyId, chapterId]);

  const loadChapter = async () => {
    try {
      const supabase = getSupabaseClient();

      // Load story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;
      setStory(storyData as unknown as Story);

      // Load chapter
      const { data: chapterData, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .eq('story_id', storyId)
        .single();

      if (chapterError) throw chapterError;
      setChapter(chapterData as unknown as Chapter);

      // Load author info
      if (chapterData) {
        const { data: authorData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', (chapterData as any).author_id)
          .single();

        setAuthorName((authorData as any)?.display_name || 'Unknown Author');
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
      toast.error('Failed to load chapter');
      router.push(`/stories/${storyId}`);
    } finally {
      setIsLoading(false);
    }
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

  if (!chapter || !story) {
    return (
      <div className="text-center py-16">
        <h2 className="font-display text-2xl text-ink-950 dark:text-dark-text mb-4">Chapter not found</h2>
        <Link
          href={`/stories/${storyId}`}
          className="text-rose-500 dark:text-dark-rose hover:text-rose-600 dark:hover:text-rose-400"
        >
          Back to story
        </Link>
      </div>
    );
  }

  const gradientColor = themeColors[story.theme] || themeColors.romance;
  const emoji = themeEmojis[story.theme] || '📖';

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

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link
              href={`/stories/${storyId}`}
              className="p-2 hover:bg-cream-200 dark:hover:bg-dark-bgTertiary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-ink-700 dark:text-dark-textSecondary" />
            </Link>
            <div>
              <p className="text-sm text-ink-600 dark:text-dark-textMuted font-body flex items-center gap-2">
                <span>{emoji}</span>
                <span>{story.title}</span>
              </p>
              <h1 className="font-display text-2xl text-ink-950 dark:text-dark-text">
                Chapter {chapter.chapter_number}
              </h1>
            </div>
          </div>

          <Link
            href={`/stories/${storyId}/write`}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 dark:bg-dark-rose text-white rounded-lg font-accent hover:bg-rose-600 dark:hover:bg-rose-400 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            Write Next
          </Link>
        </motion.div>

        {/* Chapter Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Chapter Header */}
          <div className={`bg-gradient-to-br ${gradientColor} rounded-t-3xl p-8 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <span className="px-4 py-2 bg-white/20 rounded-full text-lg font-display">
                {chapter.chapter_number}
              </span>
              <h2 className="font-display text-3xl">Chapter {chapter.chapter_number}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {authorName}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {formatDate(chapter.created_at)}
              </span>
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {Math.ceil(chapter.content.length / 200)} min read
              </span>
              {chapter.ai_enhanced_content && (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Enhanced
                </span>
              )}
            </div>
          </div>

          {/* Context Snippet */}
          {chapter.context_snippet && (
            <div className="bg-cream-100 dark:bg-dark-bgTertiary px-8 py-4 border-b border-cream-200 dark:border-dark-border">
              <p className="text-sm text-ink-700 dark:text-dark-textSecondary italic">
                &ldquo;{chapter.context_snippet}&rdquo;
              </p>
            </div>
          )}

          {/* Content */}
          <div className="bg-white dark:bg-dark-bgSecondary rounded-b-3xl shadow-soft p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <div
                className="font-body text-ink-800 dark:text-dark-textSecondary leading-loose text-lg"
                dangerouslySetInnerHTML={{ __html: chapter.content }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <Link
              href={`/stories/${storyId}`}
              className="flex items-center gap-2 text-ink-700 dark:text-dark-textSecondary hover:text-rose-500 dark:hover:text-dark-rose font-body transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Story
            </Link>

            <Link
              href={`/stories/${storyId}/write`}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500 dark:bg-dark-rose text-white rounded-full font-accent hover:bg-rose-600 dark:hover:bg-rose-400 hover:shadow-elegant transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Continue Writing
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
