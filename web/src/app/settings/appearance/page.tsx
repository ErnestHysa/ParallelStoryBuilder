'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Palette, Sparkles, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ThemeToggle } from '@/components/ThemeToggle';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export default function AppearanceSettingsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    toast.success('Language preference saved!');
  };

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <Link
          href="/settings"
          className="w-10 h-10 rounded-xl bg-white dark:bg-dark-bgSecondary hover:bg-cream-100 dark:hover:bg-dark-bgTertiary flex items-center justify-center transition-colors border border-cream-200 dark:border-dark-border"
        >
          <ArrowLeft className="w-5 h-5 text-ink-700 dark:text-dark-text" />
        </Link>
        <div>
          <h1 className="font-display text-display-md text-ink-950 dark:text-dark-text">
            Appearance
          </h1>
          <p className="font-body text-ink-700 dark:text-dark-textSecondary">
            Customize how Parallel looks
          </p>
        </div>
      </motion.div>

      {/* Theme Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-amethyst-600 p-6 text-white shadow-xl mb-6"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Palette className="w-7 h-7" />
            </div>
            <div>
              <p className="font-semibold text-lg">Theme</p>
              <p className="text-white/80 text-sm">Choose your preferred appearance</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Language Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden mb-6"
      >
        <div className="px-6 py-4 border-b border-cream-100 dark:border-dark-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
            <span className="text-lg">🌐</span>
          </div>
          <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text">Language</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-ink-600 dark:text-dark-textSecondary mb-4">
            Select your preferred language
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                  selectedLanguage === lang.code
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                    : 'border-cream-300 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700 bg-white dark:bg-dark-bgTertiary'
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium text-ink-950 dark:text-dark-text">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Coming Soon Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl border border-purple-200 dark:border-purple-900/50 p-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-ink-950 dark:text-dark-text mb-1">
              More Customization Coming Soon
            </h3>
            <p className="font-body text-sm text-ink-700 dark:text-dark-textSecondary">
              Custom themes, accent colors, and more display options.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
