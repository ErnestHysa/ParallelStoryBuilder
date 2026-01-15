'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LifeBuoy, Mail, MessageCircle, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const helpCategories = [
  {
    title: 'Getting Started',
    icon: BookOpen,
    color: 'rose',
    items: [
      { q: 'How do I create a story?', a: 'Click "New Story" on the stories page, give your story a title and theme, then share the pairing code with your partner.' },
      { q: 'How does my partner join?', a: 'Share the 6-digit pairing code with your partner. They can enter it on the Join Story page to become your co-writer.' },
      { q: 'What are themes?', a: 'Themes (Romance, Fantasy, Our Future) give your story a unique visual style and writing prompts.' },
    ],
  },
  {
    title: 'Writing Together',
    icon: MessageCircle,
    color: 'amethyst',
    items: [
      { q: 'How do we take turns?', a: 'Stories alternate between you and your partner. Write your chapter, then your partner writes the next one.' },
      { q: 'Can we add chapters together?', a: 'Currently, chapters are written by one person at a time. This keeps the surprise and anticipation alive!' },
      { q: 'What is the daily intention?', a: 'A daily prompt to help you connect with your partner. Set an intention for your relationship each day.' },
    ],
  },
  {
    title: 'Account & Settings',
    icon: 'Settings',
    color: 'emerald',
    items: [
      { q: 'How do I change my avatar?', a: 'Go to Settings > Profile to choose from preset avatars or use a custom image URL.' },
      { q: 'Can I change my email?', a: 'For security reasons, email changes require contacting support.' },
      { q: 'Is my story private?', a: 'Yes, stories are only visible to you and your writing partner.' },
    ],
  },
];

const colorMap = {
  rose: 'bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
  amethyst: 'bg-amethyst-100 dark:bg-amethyst-950/30 text-amethyst-600 dark:text-amethyst-400',
  emerald: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
};

export default function HelpPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-amethyst-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-500/30">
          <LifeBuoy className="w-10 h-10 text-white" />
        </div>
        <h1 className="font-display text-display-md text-ink-950 dark:text-dark-text mb-3">
          Help & Support
        </h1>
        <p className="font-body text-lg text-ink-700 dark:text-dark-textSecondary max-w-xl mx-auto">
          Find answers to common questions and get the most out of Parallel
        </p>
      </motion.div>

      {/* Quick Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-2 gap-4"
      >
        <a
          href="mailto:support@parallel.com"
          className="flex items-center gap-4 p-5 bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mail className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="font-semibold text-ink-950 dark:text-dark-text">Email Support</p>
            <p className="text-sm text-ink-600 dark:text-dark-textSecondary">support@parallel.com</p>
          </div>
        </a>
        <a
          href="#"
          className="flex items-center gap-4 p-5 bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-amethyst-100 dark:bg-amethyst-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageCircle className="w-6 h-6 text-amethyst-600 dark:text-amethyst-400" />
          </div>
          <div>
            <p className="font-semibold text-ink-950 dark:text-dark-text">Live Chat</p>
            <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Coming soon</p>
          </div>
        </a>
      </motion.div>

      {/* FAQ Categories */}
      {helpCategories.map((category, catIndex) => {
        const Icon = typeof category.icon === 'string'
          ? ({ className }: { className?: string }) => <span className={className}>⚙️</span>
          : category.icon;

        return (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + catIndex * 0.1 }}
            className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden"
          >
            <div className="p-5 border-b border-cream-100 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[category.color as keyof typeof colorMap])}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="font-display text-lg font-semibold text-ink-950 dark:text-dark-text">
                  {category.title}
                </h2>
              </div>
            </div>
            <div className="divide-y divide-cream-100 dark:divide-dark-border">
              {category.items.map((item, itemIndex) => (
                <details
                  key={itemIndex}
                  className="group"
                >
                  <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-cream-50 dark:hover:bg-dark-bgTertiary transition-colors">
                    <p className="font-medium text-ink-950 dark:text-dark-text pr-4">
                      {item.q}
                    </p>
                    <ChevronRight className="w-5 h-5 text-ink-400 dark:text-dark-textMuted group-open:rotate-90 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-ink-700 dark:text-dark-textSecondary pl-4 border-l-2 border-rose-300 dark:border-rose-700">
                      {item.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Still need help? */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-rose-50 to-amethyst-50 dark:from-rose-950/20 dark:to-amethyst-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amethyst-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-ink-950 dark:text-dark-text mb-2">
              Still need help?
            </h3>
            <p className="font-body text-ink-700 dark:text-dark-textSecondary mb-4">
              Our support team is here to help you make the most of Parallel. We typically respond within 24 hours.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:support@parallel.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-bgSecondary rounded-xl text-rose-600 dark:text-rose-400 font-medium hover:shadow-md transition-shadow"
              >
                <Mail className="w-4 h-4" />
                Email Us
              </a>
              <Link
                href="/stories"
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 dark:bg-rose-600 rounded-xl text-white font-medium hover:shadow-md transition-shadow"
              >
                Back to Writing
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
