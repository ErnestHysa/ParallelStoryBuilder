'use client';

/**
 * NotificationPermissionPrompt Component (Web Version)
 *
 * A friendly modal that appears after registration to encourage users
 * to enable notifications for daily intentions.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Heart, Zap, Smile } from 'lucide-react';
import { getBestDailyIntentionTime, formatTime } from '@/lib/notificationTemplates';
import {
  requestNotificationPermission,
  checkNotificationSupport,
} from '@/lib/notificationTemplates';
import {
  scheduleDailyIntention,
  initializeNotifications,
} from '@/lib/notificationScheduler';

interface NotificationPermissionPromptProps {
  open: boolean;
  onDismiss?: () => void;
  onEnabled?: () => void;
  partnerName?: string;
}

export function NotificationPermissionPrompt({
  open,
  onDismiss,
  onEnabled,
  partnerName,
}: NotificationPermissionPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState(9); // Default 9 AM

  const bestTimes = getBestDailyIntentionTime();

  useEffect(() => {
    if (open) {
      const best = bestTimes[0];
      setSelectedTime(best.hour);
    }
  }, [open]);

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      // Check support first
      if (!checkNotificationSupport()) {
        alert('Your browser doesn\'t support notifications. Please try Chrome, Firefox, or Safari.');
        setIsLoading(false);
        onDismiss?.();
        return;
      }

      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        // Initialize scheduler
        await initializeNotifications();

        // Schedule daily intention
        scheduleDailyIntention(selectedTime, { partnerName });

        // Wait a moment for animation
        setTimeout(() => {
          setIsLoading(false);
          onEnabled?.();
        }, 500);
      } else {
        setIsLoading(false);
        onDismiss?.();
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      setIsLoading(false);
      onDismiss?.();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onDismiss}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-dark-bgSecondary rounded-3xl shadow-2xl p-8 max-w-md w-full ornate-border relative"
            >
              {/* Close Button */}
              <button
                onClick={onDismiss}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-100 dark:hover:bg-dark-bg transition-colors"
              >
                <X className="w-5 h-5 text-ink-400" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-8 h-8 text-rose-500 dark:text-dark-rose" />
              </div>

              {/* Title */}
              <h3 className="font-display text-2xl text-ink-950 dark:text-dark-text text-center mb-3">
                Never Miss a Moment
              </h3>

              {/* Description */}
              <p className="text-center text-ink-600 dark:text-dark-textSecondary mb-8">
                Get a daily reminder to share your intention with {partnerName || 'your partner'}. It only takes a moment!
              </p>

              {/* Benefits */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-rose-500 dark:text-dark-rose" />
                  </div>
                  <span className="text-ink-700 dark:text-dark-text">Daily connection ritual</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <span className="text-ink-700 dark:text-dark-text">Build your streak</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center flex-shrink-0">
                    <Smile className="w-4 h-4 text-green-500 dark:text-green-400" />
                  </div>
                  <span className="text-ink-700 dark:text-dark-text">Strengthen your bond</span>
                </div>
              </div>

              {/* Time Selector */}
              <div className="mb-8">
                <p className="text-sm font-medium text-ink-600 dark:text-dark-textSecondary text-center mb-4">
                  What time works best for you?
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {bestTimes.slice(0, 5).map((time) => (
                    <button
                      key={time.hour}
                      onClick={() => setSelectedTime(time.hour)}
                      className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${
                        selectedTime === time.hour
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'bg-cream-100 dark:bg-dark-bg text-ink-700 dark:text-dark-text hover:bg-cream-200 dark:hover:bg-dark-border'
                      }`}
                    >
                      {formatTime(time.hour)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-amethyst-600 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Enabling...
                  </>
                ) : (
                  <>
                    Enable Reminders
                    <Bell className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={onDismiss}
                className="w-full mt-3 py-2 text-ink-600 dark:text-dark-textSecondary hover:text-ink-900 dark:hover:text-dark-text font-medium transition-colors"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NotificationPermissionPrompt;
