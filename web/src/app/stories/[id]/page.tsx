'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Share2,
  Users,
  Clock,
  BookOpen,
  Edit3,
  Sparkles,
  Plus,
  Settings,
  ChevronDown,
  Copy,
  Check,
  Download,
  RefreshCw,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import type { StoryWithMembers, Chapter, StoryMember, Profile } from '@/types';
import { formatDate, cn, generatePairingCode, formatPairingCode, isOldPairingCodeFormat } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';
import { ShareableCardDialog } from '@/components/ShareableCardDialog';

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

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<StoryWithMembers | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPairingCode, setShowPairingCode] = useState(false);
  const [showShareCardDialog, setShowShareCardDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    try {
      const supabase = getSupabaseClient();

      // Load story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select(`
          *,
          *,
          story_members (
            user_id,
            role,
            profile:profiles (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;

      const storyDataAny = storyData as any;
      setStory({
        ...storyDataAny,
        members: storyDataAny?.story_members?.map((m: any) => ({
          ...m,
          profile: m.profile,
        })) || [],
      } as StoryWithMembers);

      // Load chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: true });

      if (chaptersError) throw chaptersError;

      setChapters((chaptersData || []) as unknown as Chapter[]);
    } catch (error) {
      console.error('Error loading story:', error);
      toast.error('Failed to load story');
      router.push('/stories');
    } finally {
      setIsLoading(false);
    }
  };

  const copyPairingCode = () => {
    if (story?.pairing_code) {
      const formattedCode = formatPairingCode(story.pairing_code);
      navigator.clipboard.writeText(formattedCode);
      setCopied(true);
      toast.success('Pairing code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const regeneratePairingCode = async () => {
    if (!story) return;

    setIsRegenerating(true);
    try {
      const supabase = getSupabaseClient();
      const newCode = generatePairingCode();

      const { error } = await supabase
        .from('stories')
        .update({ pairing_code: newCode })
        .eq('id', story.id);

      if (error) throw error;

      // Update local state
      setStory({ ...story, pairing_code: newCode });
      toast.success('Pairing code regenerated!');
    } catch (error) {
      console.error('Error regenerating code:', error);
      toast.error('Failed to regenerate code');
    } finally {
      setIsRegenerating(false);
    }
  };

  const getPartnerName = () => {
    if (!story) return null;
    const partner = story.members.find((m: StoryMember & { profile?: Profile }) => m.user_id !== story.created_by);
    return partner?.profile?.display_name || partner?.profile?.email;
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
        <Link href="/stories" className="text-rose-500 dark:text-dark-rose hover:text-rose-600 dark:hover:text-rose-400">
          Back to your stories
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

      <div className="space-y-8">
        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-ink-700 dark:text-dark-textSecondary hover:text-rose-500 dark:hover:text-dark-rose font-body transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Stories
        </motion.button>

        {/* Story Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Hero gradient */}
          <div className={`absolute inset-0 -mx-6 -mt-6 h-64 bg-gradient-to-br ${gradientColor} rounded-t-3xl`} />

          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-5xl">{emoji}</span>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm font-accent backdrop-blur-sm">
                    {story.theme}
                  </span>
                </div>
                <h1 className="font-display text-4xl md:text-display-lg text-white mb-2">
                  {story.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  {getPartnerName() && (
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      with {getPartnerName()}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatDate(story.created_at)}
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/stories/${story.id}/write`}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-bgSecondary text-ink-950 dark:text-dark-text rounded-full font-accent font-medium hover:shadow-elegant transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  Write
                </Link>
                <button
                  onClick={() => setShowShareCardDialog(true)}
                  className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                  title="Share Story Card"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowPairingCode(!showPairingCode)}
                  className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                  title="Share Pairing Code"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pairing Code */}
            <AnimatePresence>
              {showPairingCode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-dark-bgSecondary rounded-xl p-4 shadow-elegant"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-ink-700 dark:text-dark-textSecondary font-body">
                      Share this code with your partner to invite them to your story:
                    </p>
                    {isOldPairingCodeFormat(story.pairing_code) && (
                      <button
                        onClick={regeneratePairingCode}
                        disabled={isRegenerating}
                        className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                        Update to new format
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 px-4 py-3 bg-cream-100 dark:bg-dark-bgTertiary rounded-lg font-mono text-xl tracking-wider text-ink-950 dark:text-dark-text">
                      {formatPairingCode(story.pairing_code)}
                    </code>
                    <button
                      onClick={copyPairingCode}
                      className="p-3 bg-rose-500 dark:bg-dark-rose text-white rounded-lg hover:bg-rose-600 dark:hover:bg-rose-400 transition-colors"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  {isOldPairingCodeFormat(story.pairing_code) && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      ⚠️ This story uses an old code format. Consider updating for easier sharing.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Chapters List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-ink-950 dark:text-dark-text">Chapters</h2>
            <Link
              href={`/stories/${story.id}/write`}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 dark:bg-dark-rose text-white rounded-full font-accent text-sm hover:bg-rose-600 dark:hover:bg-rose-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chapter
            </Link>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-soft">
              <div className="w-20 h-20 rounded-full bg-cream-200 dark:bg-dark-bgTertiary flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-ink-400 dark:text-dark-textMuted" />
              </div>
              <h3 className="font-display text-xl text-ink-950 dark:text-dark-text mb-2">No chapters yet</h3>
              <p className="font-body text-ink-700 dark:text-dark-textSecondary mb-6">
                Every story starts with a single word. Begin writing your first chapter.
              </p>
              <Link
                href={`/stories/${story.id}/write`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 dark:bg-dark-rose text-white rounded-full font-accent hover:bg-rose-600 dark:hover:bg-rose-400 transition-colors"
              >
                <Edit3 className="w-5 h-5" />
                Write First Chapter
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/stories/${story.id}/chapter/${chapter.id}`}>
                    <div className="group p-6 bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-soft hover:shadow-medium transition-all cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 dark:from-rose-900/30 to-amethyst-100 dark:to-amethyst-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="font-display text-xl text-rose-600 dark:text-rose-400">{chapter.chapter_number}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-lg text-ink-950 dark:text-dark-text mb-1 group-hover:text-rose-500 dark:group-hover:text-dark-rose transition-colors">
                            Chapter {chapter.chapter_number}
                          </h3>
                          <p className="font-body text-ink-600 dark:text-dark-textSecondary line-clamp-2 mb-2">
                            {chapter.content.replace(/<[^>]*>/g, '').substring(0, 200)}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-ink-500 dark:text-dark-textMuted">
                            <span>{formatDate(chapter.created_at)}</span>
                            <span>•</span>
                            <span>{Math.ceil(chapter.content.length / 200)} min read</span>
                            {chapter.ai_enhanced_content && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-amethyst-500 dark:text-amethyst-400">
                                  <Sparkles className="w-3 h-3" />
                                  AI Enhanced
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-ink-400 dark:text-dark-textMuted group-hover:text-ink-600 dark:group-hover:text-dark-text transition-colors rotate-[-90deg]" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Share Card Dialog */}
      <ShareableCardDialog
        open={showShareCardDialog}
        onClose={() => setShowShareCardDialog(false)}
        story={{
          id: story.id,
          title: story.title,
          theme: story.theme,
          created_at: story.created_at,
          pairing_code: story.pairing_code,
        }}
        chapters={chapters.map(chapter => ({
          id: chapter.id,
          content: chapter.content,
          ai_enhanced_content: chapter.ai_enhanced_content,
          chapter_number: chapter.chapter_number,
          author_id: chapter.author_id,
          created_at: chapter.created_at,
        }))}
      />
    </>
  );
}
