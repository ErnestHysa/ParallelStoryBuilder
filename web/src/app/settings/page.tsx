'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  Shield,
  Bell,
  Globe,
  Palette,
  Lock,
  Eye,
  Key,
  LifeBuoy,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

const settingsCategories = [
  {
    title: 'Account',
    items: [
      {
        href: '/settings/profile',
        icon: User,
        title: 'Profile',
        description: 'Edit your display name, avatar, and personal information',
        color: 'rose',
      },
      {
        href: '/settings/security',
        icon: Shield,
        title: 'Security',
        description: 'Password, authentication, and session settings',
        color: 'amethyst',
      },
    ],
  },
  {
    title: 'Preferences',
    items: [
      {
        href: '/settings/notifications',
        icon: Bell,
        title: 'Notifications',
        description: 'Manage how and when you receive updates',
        color: 'amber',
      },
      {
        href: '/settings/appearance',
        icon: Palette,
        title: 'Appearance',
        description: 'Theme, language, and display options',
        color: 'emerald',
      },
    ],
  },
  {
    title: 'Privacy & Data',
    items: [
      {
        href: '/settings/privacy',
        icon: Lock,
        title: 'Privacy',
        description: 'Control your data and visibility',
        color: 'blue',
      },
    ],
  },
  {
    title: 'Support',
    items: [
      {
        href: '/help',
        icon: LifeBuoy,
        title: 'Help & Support',
        description: 'Get help with any issues',
        color: 'sky',
      },
      {
        href: '/about',
        icon: Info,
        title: 'About',
        description: 'App version and information',
        color: 'gray',
      },
    ],
  },
];

const colorMap = {
  rose: 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  amethyst: 'bg-amethyst-100 dark:bg-amethyst-950/30 text-amethyst-600 dark:text-amethyst-400',
  amber: 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
  sky: 'bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400',
  gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

export default function SettingsPage() {
  const { profile } = useAuthStore();

  return (
    <div className="w-full">
      {/* Hero Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-amethyst-500 to-purple-600 p-8 md:p-12 text-white shadow-2xl mb-8"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/50 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-xl">
            {profile?.avatar_url ? (
              <span className="text-5xl">
                {['cat', 'dog', 'dragon', 'heart', 'star', 'moon', 'sun', 'sparkle', 'rocket', 'rainbow', 'clover'].includes(profile.avatar_url)
                  ? { cat: '🐱', dog: '🐶', dragon: '🐉', heart: '❤️', star: '⭐', moon: '🌙', sun: '☀️', sparkle: '✨', rocket: '🚀', rainbow: '🌈', clover: '🍀' }[profile.avatar_url] || '👤'
                  : '👤'}
              </span>
            ) : (
              <span className="text-5xl">👤</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Settings
            </h1>
            <p className="font-body text-lg text-white/80 max-w-xl">
              Customize your Parallel experience and manage your account
            </p>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{settingsCategories.reduce((acc, cat) => acc + cat.items.length, 0)}</p>
              <p className="text-sm text-white/70">Options</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Settings Categories Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {settingsCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden shadow-sm"
          >
            <div className="px-6 py-4 border-b border-cream-100 dark:border-dark-border">
              <h2 className="font-body text-sm font-semibold text-ink-600 dark:text-dark-textSecondary uppercase tracking-wide">
                {category.title}
              </h2>
            </div>
            <div className="divide-y divide-cream-100 dark:divide-dark-border">
              {category.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: categoryIndex * 0.1 + category.items.indexOf(item) * 0.05 }}
                      className="group flex items-center gap-4 p-5 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    >
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colorMap[item.color as keyof typeof colorMap])}>
                        <Icon className="w-6 h-6" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="font-body text-sm text-ink-600 dark:text-dark-textSecondary line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-ink-400 dark:text-dark-textMuted group-hover:text-rose-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-rose-50 to-amethyst-50 dark:from-rose-950/20 dark:to-amethyst-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-amethyst-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-lg text-ink-950 dark:text-dark-text mb-1">
              Want more features?
            </h3>
            <p className="font-body text-ink-700 dark:text-dark-textSecondary mb-4 md:mb-0">
              We're constantly improving Parallel. Some features are coming soon, like AI-powered writing assistance and more customization options.
            </p>
          </div>
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-bgSecondary rounded-xl text-rose-600 dark:text-rose-400 font-medium hover:shadow-md transition-all hover:scale-105 flex-shrink-0"
          >
            Start Writing
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-6 mt-8"
      >
        <p className="font-body text-sm text-ink-500 dark:text-dark-textMuted">
          Parallel v1.0.0 • Made with ❤️ for long-distance love
        </p>
      </motion.div>
    </div>
  );
}
