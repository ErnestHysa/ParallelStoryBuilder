'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Info, Heart, Feather, Github, Twitter, Mail, Sparkles } from 'lucide-react';

const features = [
  { icon: '✨', title: 'Co-Writing', desc: 'Write stories together, turn by turn' },
  { icon: '💕', title: 'Multiple Themes', desc: 'Romance, Fantasy, and Our Future themes' },
  { icon: '🎨', title: 'Beautiful Cards', desc: 'Share your story moments as beautiful cards' },
  { icon: '🌙', title: 'Daily Intentions', desc: 'Connect each day with a shared intention' },
];

const team = [
  { name: 'The Parallel Team', role: 'Building tools for love', avatar: '❤️' },
];

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-amethyst-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-500/30">
          <Info className="w-10 h-10 text-white" />
        </div>
        <h1 className="font-display text-display-md text-ink-950 dark:text-dark-text mb-3">
          About Parallel
        </h1>
        <p className="font-body text-lg text-ink-700 dark:text-dark-textSecondary max-w-xl mx-auto">
          Writing love stories, together
        </p>
      </motion.div>

      {/* Mission */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-rose-50 to-amethyst-50 dark:from-rose-950/20 dark:to-amethyst-950/20 rounded-3xl p-8 text-center"
      >
        <Feather className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="font-display text-2xl font-semibold text-ink-950 dark:text-dark-text mb-4">
          Our Mission
        </h2>
        <p className="font-body text-lg text-ink-700 dark:text-dark-textSecondary max-w-2xl mx-auto leading-relaxed">
          Parallel helps long-distance couples stay connected through the magic of co-writing.
          Whether you're writing your love story, creating fantasy worlds together, or documenting
          your journey — we make distance feel a little smaller.
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="font-display text-xl font-semibold text-ink-950 dark:text-dark-text mb-4 text-center">
          What Makes Parallel Special
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="bg-white dark:bg-dark-bgSecondary rounded-2xl p-5 border border-cream-200 dark:border-dark-border"
            >
              <span className="text-3xl mb-3 block">{feature.icon}</span>
              <h3 className="font-display font-semibold text-ink-950 dark:text-dark-text mb-1">
                {feature.title}
              </h3>
              <p className="font-body text-sm text-ink-600 dark:text-dark-textSecondary">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Version Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white dark:bg-dark-bgSecondary rounded-2xl p-6 border border-cream-200 dark:border-dark-border"
      >
        <h3 className="font-display font-semibold text-ink-950 dark:text-dark-text mb-4">
          App Information
        </h3>
        <div className="space-y-3 font-body">
          <div className="flex justify-between py-2 border-b border-cream-100 dark:border-dark-border">
            <span className="text-ink-600 dark:text-dark-textSecondary">Version</span>
            <span className="font-medium text-ink-950 dark:text-dark-text">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-cream-100 dark:border-dark-border">
            <span className="text-ink-600 dark:text-dark-textSecondary">Build</span>
            <span className="font-medium text-ink-950 dark:text-dark-text">2024.01.15</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-ink-600 dark:text-dark-textSecondary">Platform</span>
            <span className="font-medium text-ink-950 dark:text-dark-text">Web & Mobile</span>
          </div>
        </div>
      </motion.div>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-dark-bgSecondary rounded-2xl p-6 border border-cream-200 dark:border-dark-border"
      >
        <h3 className="font-display font-semibold text-ink-950 dark:text-dark-text mb-4">
          Connect With Us
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-50 dark:hover:bg-dark-bgTertiary transition-colors"
          >
            <Github className="w-5 h-5 text-ink-700 dark:text-dark-text" />
            <span className="font-medium text-ink-950 dark:text-dark-text">GitHub</span>
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-50 dark:hover:bg-dark-bgTertiary transition-colors"
          >
            <Twitter className="w-5 h-5 text-ink-700 dark:text-dark-text" />
            <span className="font-medium text-ink-950 dark:text-dark-text">Twitter</span>
          </a>
          <a
            href="mailto:hello@parallel.com"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream-50 dark:hover:bg-dark-bgTertiary transition-colors"
          >
            <Mail className="w-5 h-5 text-ink-700 dark:text-dark-text" />
            <span className="font-medium text-ink-950 dark:text-dark-text">Email</span>
          </a>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-gradient-to-r from-rose-500 to-amethyst-600 rounded-2xl p-6 text-center text-white"
      >
        <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-80" />
        <h3 className="font-display text-xl font-semibold mb-2">
          Ready to write your story?
        </h3>
        <p className="font-body text-white/80 mb-4">
          Start writing your love story today
        </p>
        <Link
          href="/stories/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-600 rounded-xl font-accent font-medium hover:shadow-lg transition-all hover:scale-105"
        >
          <Heart className="w-5 h-5" />
          Create Your Story
        </Link>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center py-4"
      >
        <p className="font-body text-sm text-ink-500 dark:text-dark-textMuted">
          Made with <Heart className="w-4 h-4 inline text-rose-500" /> for long-distance love everywhere
        </p>
      </motion.div>
    </div>
  );
}
