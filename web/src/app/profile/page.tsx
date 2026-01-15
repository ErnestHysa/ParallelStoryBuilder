'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings,
  BookOpen,
  Heart,
  Edit,
  Calendar,
  Sparkles,
  Award,
  PenLine,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/lib/supabase';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface StoryStats {
  total: number;
  active: number;
  completed: number;
  chaptersWritten: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const [stats, setStats] = useState<StoryStats>({
    total: 0,
    active: 0,
    completed: 0,
    chaptersWritten: 0,
  });
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      router.push('/stories');
      return;
    }
    loadProfileData();
  }, [profile]);

  const loadProfileData = async () => {
    if (!profile) return;

    try {
      const supabase = getSupabaseClient();

      const { data: stories, error } = await supabase
        .from('stories')
        .select(`
          *,
          chapters(count),
          story_members(
            role
          )
        `)
        .or(`created_by.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      const total = stories?.length || 0;
      const active = stories?.filter((s: any) => s.status === 'active').length || 0;
      const completed = stories?.filter((s: any) => s.status === 'completed').length || 0;
      const chaptersWritten = stories?.reduce((acc: number, s: any) => {
        const count = s.chapters?.[0]?.count || 0;
        return acc + count;
      }, 0) || 0;

      setStats({ total, active, completed, chaptersWritten });
      setRecentStories(stories || []);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatarEmoji = (avatarUrl: string | null) => {
    if (!avatarUrl) return '👤';
    const emojiMap: Record<string, string> = {
      cat: '🐱',
      dog: '🐶',
      dragon: '🐉',
      heart: '❤️',
      star: '⭐',
      moon: '🌙',
      sun: '☀️',
      sparkle: '✨',
      rocket: '🚀',
      rainbow: '🌈',
      clover: '🍀',
    };
    return emojiMap[avatarUrl] || '👤';
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  const statCards = [
    {
      label: 'Stories',
      value: stats.total,
      icon: BookOpen,
      color: 'from-rose-400 to-rose-600',
      bgColor: 'bg-rose-100 dark:bg-rose-950/30',
      textColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: Sparkles,
      color: 'from-amethyst-400 to-amethyst-600',
      bgColor: 'bg-amethyst-100 dark:bg-amethyst-950/30',
      textColor: 'text-amethyst-600 dark:text-amethyst-400',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: Award,
      color: 'from-emerald-400 to-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Chapters',
      value: stats.chaptersWritten,
      icon: PenLine,
      color: 'from-amber-400 to-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-950/30',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

  if (!profile) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Hero Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-amethyst-500 to-purple-600 p-8 md:p-12 text-white shadow-2xl mb-8"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/50 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="relative flex-shrink-0"
          >
            <div className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-xl">
              <span className="text-6xl">{getAvatarEmoji(profile.avatar_url)}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-rose-500" />
            </div>
          </motion.div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
              {profile.display_name || 'Writer'}
            </h2>
            <p className="text-white/80 text-lg mb-4">{profile.email}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Member since {memberSince || 'Recently'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/stories/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-rose-600 rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
            >
              <PenLine className="w-5 h-5" />
              New Story
            </Link>
            <Link
              href="/settings/profile"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-all"
            >
              <Edit className="w-5 h-5" />
              Edit Profile
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="bg-white dark:bg-dark-bgSecondary rounded-2xl p-6 border border-cream-200 dark:border-dark-border shadow-sm"
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', stat.bgColor)}>
                <Icon className={cn('w-6 h-6', stat.textColor)} />
              </div>
              <p className="font-display text-3xl font-bold text-ink-950 dark:text-dark-text">
                {stat.value}
              </p>
              <p className="font-body text-sm text-ink-600 dark:text-dark-textSecondary">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Stories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-semibold text-ink-950 dark:text-dark-text">
            Recent Stories
          </h3>
          <Link
            href="/stories"
            className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-2xl bg-cream-200 dark:bg-dark-bgTertiary animate-pulse"
              />
            ))}
          </div>
        ) : recentStories.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-white dark:bg-dark-bgSecondary border border-cream-200 dark:border-dark-border">
            <div className="w-16 h-16 rounded-full bg-cream-200 dark:bg-dark-bgTertiary flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-ink-400 dark:text-dark-textMuted" />
            </div>
            <h4 className="font-display text-lg text-ink-950 dark:text-dark-text mb-2">
              No stories yet
            </h4>
            <p className="font-body text-ink-700 dark:text-dark-textSecondary mb-6">
              Every great love story starts with a single word
            </p>
            <Link
              href="/stories/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-full font-accent font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Create Your First Story
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentStories.map((story, index) => {
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

              return (
                <Link key={story.id} href={`/stories/${story.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
                  >
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-105',
                      themeColors[story.theme] || themeColors.romance
                    )} />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute inset-0 p-5 flex flex-col justify-end">
                      <div className="text-4xl mb-2">
                        {themeEmojis[story.theme] || '📖'}
                      </div>
                      <h4 className="font-display text-lg font-semibold text-white leading-tight line-clamp-2 drop-shadow-md">
                        {story.title}
                      </h4>
                      <p className="font-body text-sm text-white/80 mt-1">
                        {story.chapters?.[0]?.count || 0} {story.chapters?.[0]?.count === 1 ? 'chapter' : 'chapters'}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
