'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  BookOpen,
  Users,
  Clock,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/lib/supabase';
import type { StoryWithMembers, StoryMember, Profile } from '@/types';
import { formatDate, cn } from '@/lib/utils';
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

export default function StoriesPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [stories, setStories] = useState<StoryWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'completed'>('all');

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('stories')
        .select(`
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
        // RLS ensures users only see their own stories
        // .or(`created_by.eq.${profile?.id},members.user_id.eq.${profile?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match StoryWithMembers type
      const transformedStories = (data || []).map((story: any) => ({
        ...story,
        members: story.story_members?.map((m: any) => ({
          ...m,
          profile: m.profile,
        })) || [],
      })) as StoryWithMembers[];

      setStories(transformedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
      toast.error('Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStories = stories.filter((story) => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || story.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'paused': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'completed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  const getPartnerName = (story: StoryWithMembers) => {
    const partner = story.members.find((m: StoryMember & { profile?: Profile }) => m.user_id !== profile?.id);
    return partner?.profile?.display_name || partner?.profile?.email || 'Unknown';
  };

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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-display-md text-ink-950 dark:text-dark-text mb-2">
              Your Stories
            </h1>
            <p className="font-body text-ink-700 dark:text-dark-textSecondary text-lg">
              Continue writing your love stories together
            </p>
          </div>
          <Link
            href="/stories/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-full font-accent font-medium hover:shadow-elegant hover:scale-105 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            New Story
          </Link>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-600 dark:text-dark-textMuted" />
            <input
              type="text"
              placeholder="Search your stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-600 dark:text-dark-textMuted" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input-field pl-12 pr-10 appearance-none cursor-pointer"
            >
              <option value="all">All Stories</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </motion.div>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="aspect-[3/4] rounded-2xl bg-cream-200 dark:bg-dark-bgTertiary animate-pulse"
              />
            ))}
          </div>
        ) : filteredStories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-cream-200 dark:bg-dark-bgTertiary flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-ink-400 dark:text-dark-textMuted" />
            </div>
            <h3 className="font-display text-2xl text-ink-950 dark:text-dark-text mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No stories found' : 'No stories yet'}
            </h3>
            <p className="font-body text-ink-700 dark:text-dark-textSecondary mb-6">
              {searchQuery || filterStatus !== 'all'
                ? 'Try a different search or filter'
                : 'Every great love story starts with a single word'}
            </p>
            <Link
              href="/stories/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 dark:bg-dark-rose text-white rounded-full font-accent hover:bg-rose-600 dark:hover:bg-rose-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Story
            </Link>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/stories/${story.id}`}>
                  <div className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer">
                    {/* Background gradient */}
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-br',
                      themeColors[story.theme] || themeColors.romance
                    )} />

                    {/* Content overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Status badge */}
                    <div className="absolute top-4 right-4">
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-accent font-medium',
                        getStatusColor(story.status)
                      )}>
                        {story.status}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div>
                        <div className="text-4xl mb-3">
                          {themeEmojis[story.theme] || '📖'}
                        </div>
                        <h3 className="font-display text-2xl text-white mb-2 line-clamp-2">
                          {story.title}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-white/90">
                          <Users className="w-4 h-4" />
                          <span className="text-sm font-body">
                            with {getPartnerName(story)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/90">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-body">
                            {formatDate(story.created_at)}
                          </span>
                        </div>
                        {story.chapters && story.chapters.length > 0 && (
                          <div className="flex items-center gap-2 text-white/90">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-sm font-body">
                              {story.chapters.length} {story.chapters.length === 1 ? 'chapter' : 'chapters'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
