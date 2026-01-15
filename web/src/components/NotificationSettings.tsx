'use client';

/**
 * NotificationSettings Component (Web Version)
 *
 * Complete notification settings UI matching the web app design.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Heart,
  Edit3,
  BookOpen,
  UserPlus,
  Award,
  BarChart3,
  Moon,
  Check,
  X,
  Clock,
} from 'lucide-react';
import {
  getBestDailyIntentionTime,
  formatTime,
  type NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '@/lib/notificationTemplates';
import {
  checkNotificationSupport,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
} from '@/lib/notificationTemplates';
import {
  initializeNotifications,
  scheduleDailyIntention,
  getNotificationSettings,
  updateNotificationSettings,
  enableNotifications,
  cancelAllNotifications,
  NOTIFICATION_TEMPLATES,
} from '@/lib/notificationScheduler';

interface NotificationSettingsProps {
  onDismiss?: () => void;
  standalone?: boolean;
}

export function NotificationSettings({ onDismiss, standalone = false }: NotificationSettingsProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [dailyTime, setDailyTime] = useState(9);

  useEffect(() => {
    // Check support and permission
    setIsSupported(checkNotificationSupport());
    setPermission(getNotificationPermission());

    // Initialize scheduler
    initializeNotifications();

    // Load current settings
    const currentSettings = getNotificationSettings();
    setSettings(currentSettings);
    setDailyTime(currentSettings.dailyIntentionHour);
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestNotificationPermission();
      setPermission(granted);

      if (granted === 'granted') {
        const enabled = await enableNotifications();
        if (enabled) {
          setSettings(prev => ({ ...prev, enabled: true }));
          // Schedule daily intention if enabled in settings
          if (settings.dailyIntention) {
            scheduleDailyIntention(dailyTime);
          }
        }
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleToggleSetting = async (key: keyof NotificationSettings) => {
    const newValue = !settings[key as keyof typeof settings];
    const updated = { ...settings, [key]: newValue };
    setSettings(updated);
    updateNotificationSettings(updated);

    // Handle daily intention toggle
    if (key === 'dailyIntention') {
      if (newValue) {
        scheduleDailyIntention(dailyTime);
      } else {
        cancelAllNotifications();
      }
    }

    // Handle master toggle
    if (key === 'enabled' && !newValue) {
      cancelAllNotifications();
    }
  };

  const handleTimeSelect = (hour: number) => {
    setDailyTime(hour);
    const updated = { ...settings, dailyIntentionHour: hour };
    setSettings(updated);
    updateNotificationSettings(updated);

    // Reschedule daily intention if enabled
    if (settings.enabled && settings.dailyIntention) {
      cancelAllNotifications();
      scheduleDailyIntention(hour);
    }
  };

  const handleQuietHoursToggle = () => {
    const updated = {
      ...settings,
      quietHours: {
        ...settings.quietHours,
        enabled: !settings.quietHours.enabled,
      },
    };
    setSettings(updated);
    updateNotificationSettings(updated);
  };

  const handleQuietHoursSelect = (startHour: number, endHour: number) => {
    const updated = {
      ...settings,
      quietHours: {
        ...settings.quietHours,
        startHour,
        endHour,
      },
    };
    setSettings(updated);
    updateNotificationSettings(updated);
  };

  const formatQuietHours = (start: number, end: number) => {
    return `${start}:00 - ${end}:00`;
  };

  if (!isSupported) {
    return (
      <div className="bg-white dark:bg-dark-bgSecondary rounded-3xl shadow-elegant p-8 ornate-border">
        <div className="text-center py-8">
          <Bell className="w-12 h-12 mx-auto mb-4 text-ink-400 dark:text-dark-textMuted" />
          <h3 className="font-display text-xl text-ink-950 dark:text-dark-text mb-2">
            Notifications Not Supported
          </h3>
          <p className="text-ink-600 dark:text-dark-textSecondary">
            Your browser doesn\'t support push notifications. Try using Chrome, Firefox, or Safari.
          </p>
        </div>
      </div>
    );
  }

  if (permission !== 'granted') {
    return (
      <div className="bg-white dark:bg-dark-bgSecondary rounded-3xl shadow-elegant p-8 ornate-border">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="w-8 h-8 text-rose-500 dark:text-dark-rose" />
          </div>

          <h3 className="font-display text-2xl text-ink-950 dark:text-dark-text mb-3">
            Enable Notifications
          </h3>

          <p className="text-ink-600 dark:text-dark-textSecondary mb-8 max-w-sm mx-auto">
            Get reminded about daily intentions, when it's your turn to write, and when your partner updates your story.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs mx-auto">
            <div className="flex items-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-ink-700 dark:text-dark-text">Daily intentions</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Edit3 className="w-4 h-4 text-purple-500" />
              <span className="text-ink-700 dark:text-dark-text">Turn reminders</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-ink-700 dark:text-dark-text">New chapters</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-ink-700 dark:text-dark-text">Achievements</span>
            </div>
          </div>

          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="btn-primary w-full text-lg py-4"
          >
            {isRequesting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Requesting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Enable Notifications
                <Check className="w-5 h-5" />
              </span>
            )}
          </button>

          {!standalone && (
            <button
              onClick={onDismiss}
              className="mt-4 text-ink-600 dark:text-dark-textSecondary hover:text-ink-900 dark:hover:text-dark-text font-medium transition-colors"
            >
              Maybe later
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={standalone ? '' : 'space-y-6'}>
      {/* Master Toggle */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-elegant p-6 ornate-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-ink-700 dark:text-dark-text" />
            <div>
              <h3 className="font-medium text-ink-950 dark:text-dark-text">Enable Notifications</h3>
              <p className="text-sm text-ink-500 dark:text-dark-textMuted">Receive reminders and updates</p>
            </div>
          </div>
          <button
            onClick={() => handleToggleSetting('enabled')}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              settings.enabled ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border'
            }`}
          >
            <motion.span
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow"
              animate={{ left: settings.enabled ? 26 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Notification Categories */}
      {settings.enabled && (
        <>
          <h3 className="font-accent text-sm text-ink-600 dark:text-dark-text uppercase tracking-wider px-1">
            Notification Types
          </h3>

          <div className="bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-elegant ornate-border divide-y divide-cream-100 dark:divide-dark-border">
            {/* Daily Intention */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-rose-500 dark:text-dark-rose" />
                  </div>
                  <div>
                    <h4 className="font-medium text-ink-950 dark:text-dark-text">Daily Intention</h4>
                    <p className="text-sm text-ink-500 dark:text-dark-textMuted">Reminder to set your daily intention</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting('dailyIntention')}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.dailyIntention ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border'
                  }`}
                >
                  <motion.span
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow"
                    animate={{ left: settings.dailyIntention ? 26 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Time Selector for Daily Intention */}
              {settings.dailyIntention && (
                <div className="pt-4 border-t border-cream-100 dark:border-dark-border">
                  <p className="text-sm font-medium text-ink-700 dark:text-dark-text mb-3">Reminder Time</p>
                  <div className="flex flex-wrap gap-2">
                    {getBestDailyIntentionTime().map((time) => (
                      <button
                        key={time.hour}
                        onClick={() => handleTimeSelect(time.hour)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          dailyTime === time.hour
                            ? 'bg-rose-500 text-white'
                            : 'bg-cream-100 dark:bg-dark-bg text-ink-700 dark:text-dark-text hover:bg-cream-200 dark:hover:bg-dark-border'
                        }`}
                      >
                        {formatTime(time.hour)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Your Turn */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-ink-950 dark:text-dark-text">Your Turn</h4>
                    <p className="text-sm text-ink-500 dark:text-dark-textMuted">When it's your turn to write</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting('yourTurn')}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.yourTurn ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border'
                  }`}
                >
                  <motion.span
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow"
                    animate={{ left: settings.yourTurn ? 26 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            {/* New Chapter */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-ink-950 dark:text-dark-text">New Chapters</h4>
                    <p className="text-sm text-ink-500 dark:text-dark-textMuted">When your partner writes</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting('newChapter')}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.newChapter ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border'
                  }`}
                >
                  <motion.span
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow"
                    animate={{ left: settings.newChapter ? 26 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            {/* Partner Joined */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-green-500 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-ink-950 dark:text-dark-text">Partner Activity</h4>
                    <p className="text-sm text-ink-500 dark:text-dark-textMuted">When partner joins or is active</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting('partnerJoined')}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.partnerJoined ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border'
                  }`}
                >
                  <motion.span
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow"
                    animate={{ left: settings.partnerJoined ? 26 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            {/* Achievements */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-ink-950 dark:text-dark-text">Achievements</h4>
                    <p className="text-sm text-ink-500 dark:text-dark-textMuted">Milestone celebrations</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting('achievements')}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.achievements ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border'
                  }`}
                >
                  <motion.span
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow"
                    animate={{ left: settings.achievements ? 26 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/30 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-ink-950 dark:text-dark-text">Weekly Summary</h4>
                    <p className="text-sm text-ink-500 dark:text-dark-textMuted">Your weekly writing recap</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting('weeklySummary')}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.weeklySummary ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border'
                  }`}
                >
                  <motion.span
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow"
                    animate={{ left: settings.weeklySummary ? 26 : 4 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <h3 className="font-accent text-sm text-ink-600 dark:text-dark-text uppercase tracking-wider px-1 pt-4">
            Quiet Hours
          </h3>

          <div className="bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-elegant ornate-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium text-ink-950 dark:text-dark-text">Enable Quiet Hours</h4>
                  <p className="text-sm text-ink-500 dark:text-dark-textMuted">Pause notifications while sleeping</p>
                </div>
              </div>
              <button
                onClick={handleQuietHoursToggle}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.quietHours.enabled ? 'bg-purple-500' : 'bg-cream-300 dark:bg-dark-border'
                }`}
              >
                <motion.span
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow"
                  animate={{ left: settings.quietHours.enabled ? 26 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {settings.quietHours.enabled && (
              <div className="pt-4 border-t border-cream-100 dark:border-dark-border">
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary mb-3">
                  Silence notifications from {settings.quietHours.startHour}:00 to {settings.quietHours.endHour}:00
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { start: 22, end: 8, label: '10 PM - 8 AM' },
                    { start: 23, end: 7, label: '11 PM - 7 AM' },
                    { start: 0, end: 9, label: '12 AM - 9 AM' },
                  ].map((option) => (
                    <button
                      key={`${option.start}-${option.end}`}
                      onClick={() => handleQuietHoursSelect(option.start, option.end)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                        settings.quietHours.startHour === option.start && settings.quietHours.endHour === option.end
                          ? 'bg-purple-500 text-white'
                          : 'bg-cream-100 dark:bg-dark-bg text-ink-700 dark:text-dark-text hover:bg-cream-200 dark:hover:bg-dark-border'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Button */}
          <div className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl p-6 border border-rose-100 dark:border-rose-900/50">
            <p className="text-sm text-rose-600 dark:text-rose-400 mb-3 text-center">
              Test your notification settings
            </p>
            <button
              onClick={() => {
                showNotification(NOTIFICATION_TEMPLATES.daily_intention({ partnerName: 'your partner' }));
              }}
              className="w-full py-3 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors"
            >
              Send Test Notification
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationSettings;
