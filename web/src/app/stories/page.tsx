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
  Link as LinkIcon,
  Lightbulb,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/lib/supabase';
import type { StoryWithMembers, StoryMember, Profile } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';
import DailyIntentionCard from '@/components/DailyIntentionCard';

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

  // Daily intention state
  const [dailyIntention, setDailyIntention] = useState<any>(null);
  const [isLoadingIntention, setIsLoadingIntention] = useState(false);

  useEffect(() => {
    loadStories();
    loadDailyIntention();
  }, []);

  const loadDailyIntention = async () => {
    if (!profile) return;

    try {
      const supabase = getSupabaseClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('daily_intentions')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', today.toISOString())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading daily intention:', error);
      }

      setDailyIntention(data);
    } catch (error) {
      console.error('Error loading daily intention:', error);
    }
  };

  const handleSetIntention = async (intentionText: string) => {
    if (!profile) {
      toast.error('Please sign in to set your intention');
      return;
    }

    setIsLoadingIntention(true);
    try {
      const supabase = getSupabaseClient();

      // First, try to get or create a relationship
      const { data: relationships } = await supabase
        .from('relationships')
        .select('id')
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
        .limit(1);

      const relationshipId = (relationships as any)?.[0]?.id;

      const { data, error } = await supabase
        .from('daily_intentions')
        .insert({
          relationship_id: relationshipId || null,
          user_id: profile.id,
          intention: intentionText,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      setDailyIntention(data);
      toast.success('Daily intention set!');
    } catch (error: any) {
      console.error('Error setting intention:', error);
      toast.error(error.message || 'Failed to set intention');
    } finally {
      setIsLoadingIntention(false);
    }
  };

  const handleCompleteIntention = async () => {
    if (!dailyIntention) return;

    setIsLoadingIntention(true);
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('daily_intentions')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', dailyIntention.id);

      if (error) throw error;

      setDailyIntention({ ...dailyIntention, completed: true });
      toast.success('Intention completed! 🎉');
    } catch (error: any) {
      console.error('Error completing intention:', error);
      toast.error(error.message || 'Failed to complete intention');
    } finally {
      setIsLoadingIntention(false);
    }
  };

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

      // Debug: Log story and member data to help troubleshoot "Unknown" names
      transformedStories.forEach((story) => {
        console.log(`Story "${story.title}":`, {
          memberCount: story.members.length,
          currentUserId: profile?.id,
          members: story.members.map((m) => ({
            userId: m.user_id,
            isCurrentUser: m.user_id === profile?.id,
            hasProfile: !!m.profile,
            displayName: m.profile?.display_name,
            email: m.profile?.email,
          })),
        });

        const partner = story.members.find((m: StoryMember & { profile?: Profile }) => m.user_id !== profile?.id);
        if (!partner) {
          console.warn(`Story "${story.title}": No partner found. You might be the only member.`);
        } else if (!partner.profile?.display_name && !partner.profile?.email) {
          console.warn(`Story "${story.title}": Partner profile data is missing. RLS issue?`, {
            partnerUserId: partner.user_id,
          });
        }
      });
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
    // Find the member who is NOT the current user
    const partner = story.members.find((m: StoryMember & { profile?: Profile }) => m.user_id !== profile?.id);

    if (!partner) {
      // Only one member (creator) - partner hasn't joined yet
      return story.members.length === 1 ? 'Waiting for partner...' : 'Unknown';
    }

    // Return partner's display name, or email, or fallback
    return partner.profile?.display_name || partner.profile?.email || 'Partner';
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/inspirations"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-bgSecondary border-2 border-amethyst-300 dark:border-amethyst-700 text-amethyst-600 dark:text-amethyst-400 rounded-full font-accent font-medium hover:shadow-soft hover:scale-105 transition-all duration-300"
            >
              <Lightbulb className="w-5 h-5" />
              Inspirations
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-bgSecondary border-2 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 rounded-full font-accent font-medium hover:shadow-soft hover:scale-105 transition-all duration-300"
            >
              <LinkIcon className="w-5 h-5" />
              Join Story
            </Link>
            <Link
              href="/stories/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-full font-accent font-medium hover:shadow-elegant hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              New Story
            </Link>
          </div>
        </motion.div>

        {/* Daily Intention Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-lg mx-auto"
        >
          <DailyIntentionCard
            intention={dailyIntention}
            onSetIntention={handleSetIntention}
            onCompleteIntention={handleCompleteIntention}
            isLoading={isLoadingIntention}
          />
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
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/join"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-bgSecondary border-2 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 rounded-full font-accent hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <LinkIcon className="w-5 h-5" />
                Join Partner's Story
              </Link>
              <Link
                href="/stories/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 dark:bg-dark-rose text-white rounded-full font-accent hover:bg-rose-600 dark:hover:bg-rose-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Story
              </Link>
            </div>
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
                  <div className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer">
                    {/* Animated background gradient */}
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-105',
                      themeColors[story.theme] || themeColors.romance
                    )} />

                    {/* Decorative dot pattern overlay */}
                    <div className="absolute inset-0 opacity-10">
                      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id={`dot-pattern-${story.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1" fill="white" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#dot-pattern-${story.id})`} />
                      </svg>
                    </div>

                    {/* Animated gradient orbs for depth */}
                    <div className="absolute inset-0 overflow-hidden opacity-50">
                      <div className={cn(
                        'absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/30 blur-2xl',
                        'animate-pulse'
                      )} />
                      <div className={cn(
                        'absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/20 blur-3xl',
                        'transition-transform duration-700 group-hover:translate-x-2 group-hover:translate-y-2'
                      )} />
                    </div>

                    {/* Sparkles decoration */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3,
                        }}
                        className="absolute top-8 left-8 w-2 h-2"
                      >
                        <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                        </svg>
                      </motion.div>
                      <motion.div
                        animate={{
                          scale: [1, 1.15, 1],
                          opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          delay: index * 0.5 + 0.5,
                        }}
                        className="absolute bottom-20 right-12 w-1.5 h-1.5"
                      >
                        <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                        </svg>
                      </motion.div>
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.4, 0.9, 0.4],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.4 + 1,
                        }}
                        className="absolute top-1/3 right-6 w-2 h-2"
                      >
                        <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                        </svg>
                      </motion.div>
                    </div>

                    {/* Floating hearts for romance theme */}
                    {story.theme === 'romance' && (
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              y: [0, -10, 0],
                              opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                              duration: 3 + i,
                              repeat: Infinity,
                              delay: i * 0.5,
                            }}
                            className="absolute text-white/30 text-lg"
                            style={{
                              left: `${20 + i * 30}%`,
                              top: `${60 + i * 10}%`,
                            }}
                          >
                            ♡
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Content overlay - darker at bottom for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Glass effect status badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <span className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-accent font-medium',
                        'backdrop-blur-md bg-white/20 border border-white/30',
                        'shadow-lg shadow-black/20',
                        story.status === 'active' && 'text-emerald-100',
                        story.status === 'paused' && 'text-amber-100',
                        story.status === 'completed' && 'text-blue-100',
                      )}>
                        {story.status}
                      </span>
                    </div>

                    {/* Glass content card */}
                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                      {/* Top section - glass title card */}
                      <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20 shadow-xl relative overflow-hidden">
                        {/* Subtle inner glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                        <div className="relative">
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-4xl drop-shadow-lg">
                              {themeEmojis[story.theme] || '📖'}
                            </div>
                            {/* Avatars preview - show current user first, then partner */}
                            <div className="flex -space-x-2">
                              {/* Sort: current user first, then others */}
                              {[...story.members]
                                .sort((a, b) => {
                                  // Current user first
                                  if (a.user_id === profile?.id) return -1;
                                  if (b.user_id === profile?.id) return 1;
                                  return 0;
                                })
                                .slice(0, 2)
                                .map((member) => {
                                  const isCurrentUser = member.user_id === profile?.id;
                                  const displayName = member.profile?.display_name || member.profile?.email || 'Unknown';
                                  const initial = displayName.charAt(0).toUpperCase();
                                  return (
                                    <div
                                      key={member.user_id}
                                      className={cn(
                                        'w-8 h-8 rounded-full backdrop-blur-sm border-2 flex items-center justify-center text-xs font-medium shadow-md transition-transform hover:scale-110 hover:z-10',
                                        isCurrentUser
                                          ? 'bg-rose-400/40 border-rose-300/50 text-white'
                                          : 'bg-white/30 border-white/40 text-white'
                                      )}
                                      title={`${displayName}${isCurrentUser ? ' (You)' : ''}`}
                                    >
                                      {initial}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                          <h3 className="font-display text-xl text-white font-semibold leading-tight line-clamp-2 drop-shadow-md">
                            {story.title}
                          </h3>
                        </div>
                      </div>

                      {/* Bottom section - glass metadata card */}
                      <div className="backdrop-blur-md bg-white/15 rounded-2xl p-4 border border-white/25 shadow-xl space-y-3 relative overflow-hidden">
                        {/* Decorative corner accent */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full" />
                        <div className="relative space-y-3">
                          <div className="flex items-center gap-2.5 text-white">
                            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/60 font-medium">Writing with</p>
                              <p className="text-sm font-semibold truncate">
                                {getPartnerName(story)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 text-white">
                            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/60 font-medium">Started</p>
                              <p className="text-sm font-semibold truncate">
                                {formatDate(story.created_at)}
                              </p>
                            </div>
                          </div>
                          {story.chapters && story.chapters.length > 0 && (
                            <div className="flex items-center gap-2.5 text-white">
                              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <BookOpen className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/60 font-medium">Progress</p>
                                <p className="text-sm font-semibold">
                                  {story.chapters.length} {story.chapters.length === 1 ? 'chapter' : 'chapters'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hover shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                    {/* Outer ring glow on hover */}
                    <div className="absolute inset-0 rounded-3xl ring-2 ring-white/0 group-hover:ring-white/30 transition-all duration-500" />
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
