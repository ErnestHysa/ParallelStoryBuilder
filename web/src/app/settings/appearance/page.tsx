'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Palette, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getSettingsService, type UserPreferences } from '@/lib/settings';

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
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const settingsService = getSettingsService();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const profile = await settingsService.getProfile();
      if (profile) {
        const prefs = profile.preferences as UserPreferences;
        setSelectedLanguage(prefs?.language || 'en');
        setSelectedTheme(prefs?.theme || 'system');
      }
    } catch (error) {
      console.error('Failed to load appearance settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setSelectedLanguage(lang);
    setIsSaving(true);
    try {
      await settingsService.updatePreferences({ language: lang });
      toast.success('Language preference saved!');
    } catch (error) {
      console.error('Failed to save language:', error);
      toast.error('Failed to save language');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    setSelectedTheme(theme);
    setIsSaving(true);
    try {
      await settingsService.updatePreferences({ theme });
      toast.success('Theme preference saved!');
    } catch (error) {
      console.error('Failed to save theme:', error);
      toast.error('Failed to save theme');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: '☀️', desc: 'Always light mode' },
    { value: 'dark' as const, label: 'Dark', icon: '🌙', desc: 'Always dark mode' },
    { value: 'system' as const, label: 'System', icon: '💻', desc: 'Follow system preference' },
  ];

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
          <ArrowLeft className="w-5 h-5 text-ink-950 dark:text-dark-text" />
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

      {/* Theme Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden mb-6"
      >
        <div className="px-6 py-4 border-b border-cream-100 dark:border-dark-border">
          <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text">Theme Preference</h3>
        </div>
        <div className="p-6">
          <div className="grid sm:grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const isSelected = selectedTheme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  disabled={isSaving}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all',
                    'flex flex-col items-center gap-2',
                    isSelected
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                      : 'border-cream-300 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700 bg-white dark:bg-dark-bgTertiary',
                    isSaving && 'opacity-50 cursor-wait'
                  )}
                >
                  <span className="text-3xl">{option.icon}</span>
                  <span className="font-medium text-ink-950 dark:text-dark-text">{option.label}</span>
                  <span className="text-xs text-ink-500 dark:text-dark-textMuted">{option.desc}</span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"
                    />
                  )}
                </button>
              );
            })}
          </div>
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
                disabled={isSaving}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
                  selectedLanguage === lang.code
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                    : 'border-cream-300 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700 bg-white dark:bg-dark-bgTertiary',
                  isSaving && 'opacity-50 cursor-wait'
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium text-ink-950 dark:text-dark-text">{lang.name}</span>
                {selectedLanguage === lang.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 rounded-full bg-rose-500"
                  />
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-500 dark:text-dark-textMuted mt-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This preference syncs across all your devices
          </p>
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

      {/* Sync Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={cn(
          'rounded-2xl border p-5 flex items-center justify-between',
          isSaving
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
        )}
      >
        <div className="flex items-center gap-3">
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin text-amber-600 dark:text-amber-400" />
          ) : (
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <p className={cn(
            'font-medium text-sm',
            isSaving
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-emerald-700 dark:text-emerald-400'
          )}>
            {isSaving ? 'Syncing changes...' : 'All settings synced across devices'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
