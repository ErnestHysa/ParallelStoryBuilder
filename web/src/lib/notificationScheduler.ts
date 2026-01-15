/**
 * Web Notification Scheduler Service
 *
 * Handles scheduling and managing push notifications for the web app.
 * Uses localStorage for persistence and browser Notification API.
 */

import {
  NotificationTemplate,
  NotificationCategory,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  showNotification,
  NOTIFICATION_TEMPLATES,
  getPersonalizedReminder,
  checkNotificationSupport,
  requestNotificationPermission,
} from './notificationTemplates';

const SCHEDULED_NOTIFICATIONS_KEY = 'parallel_scheduled_notifications';
const NOTIFICATION_SETTINGS_KEY = 'parallel_notification_settings';

interface ScheduledNotification {
  id: string;
  category: NotificationCategory;
  hour: number;
  templateParams?: Record<string, unknown>;
  enabled: boolean;
}

/**
 * Notification Scheduler Class
 */
class WebNotificationScheduler {
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private settings: NotificationSettings = DEFAULT_NOTIFICATION_SETTINGS;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckMinute = -1;

  /**
   * Initialize the scheduler
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Load settings
      this.loadSettings();

      // Load scheduled notifications
      this.loadScheduledNotifications();

      // Start the check interval
      this.startCheckInterval();

      console.log('[NotificationScheduler] Initialized');
    } catch (error) {
      console.error('[NotificationScheduler] Initialization failed:', error);
    }
  }

  /**
   * Schedule a daily notification at a specific hour
   */
  scheduleDaily(
    category: NotificationCategory,
    hour: number,
    templateParams?: Record<string, unknown>
  ): string {
    const id = `${category}-${hour}`;

    const scheduled: ScheduledNotification = {
      id,
      category,
      hour,
      templateParams,
      enabled: true,
    };

    this.scheduledNotifications.set(id, scheduled);
    this.saveScheduledNotifications();

    console.log(`[NotificationScheduler] Scheduled ${category} at ${hour}:00`);
    return id;
  }

  /**
   * Schedule daily intention reminder
   */
  scheduleDailyIntention(hour?: number, templateParams?: Record<string, unknown>): string {
    const scheduledHour = hour ?? this.settings.dailyIntentionHour;
    return this.scheduleDaily('daily_intention', scheduledHour, templateParams);
  }

  /**
   * Schedule personalized reminder
   */
  schedulePersonalizedReminder(
    blueprintParams: {
      relationshipStage?: string;
      communicationStyle?: string;
      loveLanguage?: string;
      partnerName?: string;
    },
    hour?: number
  ): string {
    const scheduledHour = hour ?? this.settings.dailyIntentionHour;
    return this.scheduleDaily('daily_intention', scheduledHour, blueprintParams);
  }

  /**
   * Cancel a scheduled notification
   */
  cancel(id: string): void {
    this.scheduledNotifications.delete(id);
    this.saveScheduledNotifications();
    console.log(`[NotificationScheduler] Cancelled: ${id}`);
  }

  /**
   * Cancel all scheduled notifications
   */
  cancelAll(): void {
    this.scheduledNotifications.clear();
    this.saveScheduledNotifications();
    console.log('[NotificationScheduler] Cancelled all');
  }

  /**
   * Cancel notifications for a specific category
   */
  cancelCategory(category: NotificationCategory): void {
    for (const [id, scheduled] of this.scheduledNotifications.entries()) {
      if (scheduled.category === category) {
        this.scheduledNotifications.delete(id);
      }
    }
    this.saveScheduledNotifications();
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();

    // Reschedule daily intention if time changed
    if (updates.dailyIntentionHour !== undefined && this.settings.dailyIntention) {
      this.cancelCategory('daily_intention');
      this.scheduleDaily('daily_intention', updates.dailyIntentionHour);
    }
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Enable notifications
   */
  async enable(): Promise<boolean> {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      this.updateSettings({ enabled: true });
      return true;
    }
    return false;
  }

  /**
   * Disable notifications
   */
  disable(): void {
    this.updateSettings({ enabled: false });
  }

  /**
   * Show a notification immediately
   */
  notify(category: NotificationCategory, templateParams?: Record<string, unknown>): void {
    if (!this.settings.enabled) return;

    const template = NOTIFICATION_TEMPLATES[category](templateParams);
    showNotification(template);
  }

  /**
   * Start the check interval
   */
  private startCheckInterval(): void {
    // Check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkScheduledNotifications();
    }, 30000);
  }

  /**
   * Check if any scheduled notifications should be triggered
   */
  private checkScheduledNotifications(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Only check once per minute to avoid duplicates
    if (currentMinute === this.lastCheckMinute) {
      return;
    }
    this.lastCheckMinute = currentMinute;

    // Check each scheduled notification
    for (const [id, scheduled] of this.scheduledNotifications.entries()) {
      if (!scheduled.enabled) continue;

      if (scheduled.hour === currentHour && currentMinute < 1) {
        // Trigger the notification
        this.triggerScheduledNotification(scheduled);
      }
    }
  }

  /**
   * Trigger a scheduled notification
   */
  private triggerScheduledNotification(scheduled: ScheduledNotification): void {
    if (!this.settings.enabled) return;

    // Check quiet hours
    if (this.settings.quietHours.enabled) {
      const currentHour = new Date().getHours();
      const { startHour, endHour } = this.settings.quietHours;

      const inQuietHours =
        startHour > endHour
          ? currentHour >= startHour || currentHour < endHour
          : currentHour >= startHour && currentHour < endHour;

      if (inQuietHours) {
        console.log('[NotificationScheduler] Skipping - in quiet hours');
        return;
      }
    }

    // Get and show the template
    let template: NotificationTemplate;

    if (scheduled.category === 'daily_intention' && scheduled.templateParams) {
      // Check if it's a personalized reminder
      const params = scheduled.templateParams as {
        relationshipStage?: string;
        communicationStyle?: string;
        loveLanguage?: string;
        partnerName?: string;
      };

      if (params.relationshipStage || params.communicationStyle || params.loveLanguage) {
        template = getPersonalizedReminder(params);
      } else {
        template = NOTIFICATION_TEMPLATES[scheduled.category](scheduled.templateParams);
      }
    } else {
      template = NOTIFICATION_TEMPLATES[scheduled.category](scheduled.templateParams);
    }

    showNotification(template);
    console.log(`[NotificationScheduler] Triggered: ${scheduled.id}`);
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('[NotificationScheduler] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('[NotificationScheduler] Failed to save settings:', error);
    }
  }

  /**
   * Load scheduled notifications from localStorage
   */
  private loadScheduledNotifications(): void {
    try {
      const saved = localStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (saved) {
        const scheduled: ScheduledNotification[] = JSON.parse(saved);
        for (const item of scheduled) {
          this.scheduledNotifications.set(item.id, item);
        }
      }
    } catch (error) {
      console.error('[NotificationScheduler] Failed to load scheduled:', error);
    }
  }

  /**
   * Save scheduled notifications to localStorage
   */
  private saveScheduledNotifications(): void {
    try {
      const scheduled = Array.from(this.scheduledNotifications.values());
      localStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(scheduled));
    } catch (error) {
      console.error('[NotificationScheduler] Failed to save scheduled:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Export singleton instance
export const notificationScheduler = new WebNotificationScheduler();

// Export convenience functions
export function initializeNotifications(): Promise<void> {
  return notificationScheduler.initialize();
}

export function scheduleDailyIntention(
  hour?: number,
  templateParams?: Record<string, unknown>
): string {
  return notificationScheduler.scheduleDailyIntention(hour, templateParams);
}

export function cancelAllNotifications(): void {
  return notificationScheduler.cancelAll();
}

export function getNotificationSettings(): NotificationSettings {
  return notificationScheduler.getSettings();
}

export function updateNotificationSettings(
  updates: Partial<NotificationSettings>
): void {
  return notificationScheduler.updateSettings(updates);
}

export async function enableNotifications(): Promise<boolean> {
  return notificationScheduler.enable();
}

export function showNotificationNow(
  category: NotificationCategory,
  templateParams?: Record<string, unknown>
): void {
  return notificationScheduler.notify(category, templateParams);
}

// Re-export notification templates and utilities
export { NOTIFICATION_TEMPLATES } from './notificationTemplates';
export { type NotificationTemplate, type NotificationCategory, type NotificationSettings } from './notificationTemplates';
