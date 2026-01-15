'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Bell, Mail, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getSettingsService, type NotificationSettings } from '@/lib/settings';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    new_chapter: true,
    partner_joined: true,
    daily_intention: true,
    weekly_highlights: true,
    ai_reminder: true,
    email_new_chapter: false,
    email_weekly: false,
    email_marketing: false,
    push_enabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'default'>('default');

  const settingsService = getSettingsService();

  useEffect(() => {
    loadSettings();
    loadPushPermission();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const loadedSettings = await settingsService.loadNotificationSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPushPermission = () => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setIsSaving(true);
    try {
      await settingsService.updateNotificationPreferences(newSettings);
      toast.success('Notification preferences updated!');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast.error('Failed to update settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    setPushPermission(permission);

    if (permission === 'granted') {
      await handleToggle('push_enabled', true);
      toast.success('Notifications enabled!');
    } else if (permission === 'denied') {
      toast.error('Notifications blocked. Enable them in your browser settings.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const inAppNotifications = [
    { key: 'new_chapter' as const, label: 'New Chapter Written', desc: 'When your partner writes' },
    { key: 'partner_joined' as const, label: 'Partner Joins Story', desc: 'Partner accepts invitation' },
    { key: 'daily_intention' as const, label: 'Daily Intention', desc: 'Reminder to set intention' },
    { key: 'weekly_highlights' as const, label: 'Weekly Highlights', desc: 'Weekly story summary' },
    { key: 'ai_reminder' as const, label: 'AI Writing Reminders', desc: 'Continue your story' },
  ];

  const emailNotifications = [
    { key: 'email_new_chapter' as const, label: 'New Chapter Alerts', desc: 'Email when partner writes' },
    { key: 'email_weekly' as const, label: 'Weekly Digest', desc: 'Weekly summary email' },
    { key: 'email_marketing' as const, label: 'Marketing Updates', desc: 'News and features' },
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
            Notifications
          </h1>
          <p className="font-body text-ink-700 dark:text-dark-textSecondary">
            Choose what notifications you receive
          </p>
        </div>
      </motion.div>

      {/* Push Notification Card */}
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
              <Bell className="w-7 h-7" />
            </div>
            <div>
              <p className="font-semibold text-lg">Push Notifications</p>
              <p className="text-white/80 text-sm">
                {pushPermission === 'granted'
                  ? 'Enabled in your browser'
                  : pushPermission === 'denied'
                  ? 'Blocked in your browser'
                  : 'Enable to receive notifications'}
              </p>
            </div>
          </div>

          {pushPermission === 'granted' ? (
            <span className="px-4 py-2 rounded-full bg-emerald-500/30 text-emerald-100 text-sm font-medium">
              Enabled
            </span>
          ) : pushPermission === 'denied' ? (
            <span className="px-4 py-2 rounded-full bg-red-500/30 text-red-100 text-sm font-medium">
              Blocked
            </span>
          ) : (
            <button
              onClick={handleEnablePush}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-white text-rose-600 font-medium hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Enabling...' : 'Enable'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Settings Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* In-App Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-cream-100 dark:border-dark-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text">In-App Notifications</h3>
          </div>
          <div className="p-6 space-y-4">
            {inAppNotifications.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-950 dark:text-dark-text">{item.label}</p>
                  <p className="text-sm text-ink-600 dark:text-dark-textSecondary">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(item.key, !settings[item.key])}
                  disabled={isSaving}
                  className={cn(
                    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                    settings[item.key] ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border',
                    isSaving && 'opacity-50 cursor-wait'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
                      settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Email Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-cream-100 dark:border-dark-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amethyst-100 dark:bg-amethyst-950/30 flex items-center justify-center">
              <Mail className="w-4 h-4 text-amethyst-600 dark:text-amethyst-400" />
            </div>
            <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text">Email Notifications</h3>
          </div>
          <div className="p-6 space-y-4">
            {emailNotifications.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-950 dark:text-dark-text">{item.label}</p>
                  <p className="text-sm text-ink-600 dark:text-dark-textSecondary">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(item.key, !settings[item.key])}
                  disabled={isSaving}
                  className={cn(
                    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                    settings[item.key] ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border',
                    isSaving && 'opacity-50 cursor-wait'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
                      settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Coming Soon Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50 p-5 mb-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-ink-950 dark:text-dark-text mb-1">
              More Notification Types Coming Soon
            </h3>
            <p className="font-body text-sm text-ink-700 dark:text-dark-textSecondary">
              SMS notifications, custom notification schedules, and more granular control over your alerts.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end"
      >
        <button
          onClick={loadSettings}
          disabled={isSaving}
          className={cn(
            'px-6 py-3 rounded-xl font-accent font-medium transition-all flex items-center gap-2',
            isSaving
              ? 'bg-cream-200 dark:bg-dark-bgTertiary text-ink-500 cursor-wait'
              : 'bg-gradient-to-r from-rose-500 to-amethyst-600 text-white hover:shadow-lg hover:scale-105'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </motion.div>
    </div>
  );
}
