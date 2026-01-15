/**
 * Notification Scheduler Service
 *
 * Smart scheduling service for push notifications with:
 * - Respect for quiet hours
 * - Intelligent timing suggestions
 * - Persistent scheduling across app restarts
 * - Integration with user preferences
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NOTIFICATION_TEMPLATES,
  NotificationCategory,
  ScheduleConfig,
  setupNotificationChannels,
  getBestDailyIntentionTime,
  getBestTurnReminderTime,
  getPersonalizedReminder,
} from './notificationTemplates';

const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';
const QUIET_HOURS_KEY = 'notification_quiet_hours';
const USER_TIMEZONE_KEY = 'user_timezone_preference';

interface QuietHours {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number; // 0-23
}

interface ScheduledNotificationInfo {
  id: string;
  category: NotificationCategory;
  scheduledFor: Date | number; // Can be absolute date or hour for daily
  repeatInterval?: 'daily' | 'weekly' | 'monthly';
  data?: Record<string, unknown>;
}

/**
 * Notification Scheduler Class
 */
class NotificationScheduler {
  private quietHours: QuietHours = { enabled: false, startHour: 22, endHour: 8 };
  private userTimezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
  private isInitialized = false;

  /**
   * Initialize the scheduler
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Setup notification channels for Android
      await setupNotificationChannels();

      // Load user preferences
      await this.loadPreferences();

      // Set up notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Check and reschedule any persisted notifications
      await this.restoreScheduledNotifications();

      this.isInitialized = true;
      console.log('[NotificationScheduler] Initialized successfully');
    } catch (error) {
      console.error('[NotificationScheduler] Initialization failed:', error);
    }
  }

  /**
   * Schedule a single notification
   */
  async schedule(
    category: NotificationCategory,
    config: ScheduleConfig = {},
    templateParams?: Record<string, unknown>
  ): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get the template
      const template = NOTIFICATION_TEMPLATES[category](templateParams);

      // Check if we should respect quiet hours
      if (config.respectQuietHours !== false && this.quietHours.enabled) {
        if (this.isInQuietHours()) {
          console.log('[NotificationScheduler] Skipping - in quiet hours');
          return null;
        }
      }

      // Build the notification content
      const content: Notifications.NotificationContentInput = {
        title: template.title,
        body: template.body,
        data: template.data,
        sound: template.sound || 'default',
        categoryId: template.category,
        ...(template.channelId && { channelId: template.channelId }),
      };

      // Determine trigger
      let trigger: Notifications.NotificationTriggerInput;

      if (config.trigger) {
        trigger = config.trigger;
      } else if (config.triggerDate) {
        trigger = this.createDateTrigger(config.triggerDate);
      } else if (config.delayInSeconds) {
        trigger = { seconds: config.delayInSeconds };
      } else {
        // Default to immediate
        trigger = null;
      }

      // Schedule the notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      // Persist the schedule info for restoration
      await this.persistScheduleInfo({
        id: identifier,
        category,
        scheduledFor: config.triggerDate || Date.now() + (config.delayInSeconds || 0) * 1000,
        repeatInterval: config.repeats ? 'daily' : undefined,
        data: templateParams,
      });

      console.log(`[NotificationScheduler] Scheduled ${category}: ${identifier}`);
      return identifier;
    } catch (error) {
      console.error('[NotificationScheduler] Failed to schedule:', error);
      return null;
    }
  }

  /**
   * Schedule a daily notification at a specific hour
   */
  async scheduleDaily(
    category: NotificationCategory,
    hour: number,
    minute: number = 0,
    templateParams?: Record<string, unknown>
  ): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const template = NOTIFICATION_TEMPLATES[category](templateParams);

      const content: Notifications.NotificationContentInput = {
        title: template.title,
        body: template.body,
        data: template.data,
        sound: template.sound || 'default',
        ...(template.channelId && { channelId: template.channelId }),
      };

      // Create a daily trigger
      const trigger: Notifications.NotificationTriggerInput = {
        hour,
        minute,
        repeats: true,
        channelId: template.channelId,
      };

      const identifier = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      // Persist for restoration
      await this.persistScheduleInfo({
        id: identifier,
        category,
        scheduledFor: hour, // Store hour for daily notifications
        repeatInterval: 'daily',
        data: templateParams,
      });

      console.log(`[NotificationScheduler] Scheduled daily ${category} at ${hour}:${minute.toString().padStart(2, '0')}`);
      return identifier;
    } catch (error) {
      console.error('[NotificationScheduler] Failed to schedule daily:', error);
      return null;
    }
  }

  /**
   * Schedule daily intention reminder at the optimal time
   */
  async scheduleDailyIntention(
    hour?: number,
    templateParams?: Record<string, unknown>
  ): Promise<string | null> {
    // If no hour specified, use the best time
    const bestTimes = getBestDailyIntentionTime();
    const scheduledHour = hour ?? bestTimes[0].hour;

    return this.scheduleDaily('daily_intention', scheduledHour, 0, templateParams);
  }

  /**
   * Schedule turn reminder at optimal time
   */
  async scheduleTurnReminder(
    storyId: string,
    storyTitle: string,
    templateParams?: Record<string, unknown>
  ): Promise<string | null> {
    const bestTimes = getBestTurnReminderTime();
    const scheduledHour = bestTimes[0].hour;

    return this.scheduleDaily(
      'your_turn',
      scheduledHour,
      0,
      { storyId, storyTitle, ...templateParams }
    );
  }

  /**
   * Schedule personalized reminder based on blueprint
   */
  async schedulePersonalizedReminder(
    blueprintParams: {
      relationshipStage?: string;
      communicationStyle?: string;
      loveLanguage?: string;
      partnerName?: string;
    },
    hour?: number
  ): Promise<string | null> {
    const template = getPersonalizedReminder(blueprintParams);
    const scheduledHour = hour ?? getBestDailyIntentionTime()[0].hour;

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const content: Notifications.NotificationContentInput = {
        title: template.title,
        body: template.body,
        data: template.data,
        sound: template.sound || 'default',
        ...(template.channelId && { channelId: template.channelId }),
      };

      const trigger: Notifications.NotificationTriggerInput = {
        hour: scheduledHour,
        minute: 0,
        repeats: true,
      };

      const identifier = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      await this.persistScheduleInfo({
        id: identifier,
        category: 'daily_intention',
        scheduledFor: scheduledHour,
        repeatInterval: 'daily',
        data: blueprintParams,
      });

      console.log(`[NotificationScheduler] Scheduled personalized reminder at ${scheduledHour}:00`);
      return identifier;
    } catch (error) {
      console.error('[NotificationScheduler] Failed to schedule personalized reminder:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancel(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      await this.removeScheduleInfo(identifier);
      console.log(`[NotificationScheduler] Cancelled: ${identifier}`);
    } catch (error) {
      console.error('[NotificationScheduler] Failed to cancel:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
      console.log('[NotificationScheduler] Cancelled all notifications');
    } catch (error) {
      console.error('[NotificationScheduler] Failed to cancel all:', error);
    }
  }

  /**
   * Cancel all notifications for a specific category
   */
  async cancelCategory(category: NotificationCategory): Promise<void> {
    try {
      const scheduled = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (!scheduled) return;

      const schedules: ScheduledNotificationInfo[] = JSON.parse(scheduled);
      const categorySchedules = schedules.filter(s => s.category === category);

      for (const schedule of categorySchedules) {
        await this.cancel(schedule.id);
      }

      console.log(`[NotificationScheduler] Cancelled all ${category} notifications`);
    } catch (error) {
      console.error('[NotificationScheduler] Failed to cancel category:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getAllScheduled(): Promise<ScheduledNotificationInfo[]> {
    try {
      const scheduled = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      return scheduled ? JSON.parse(scheduled) : [];
    } catch (error) {
      console.error('[NotificationScheduler] Failed to get scheduled:', error);
      return [];
    }
  }

  /**
   * Update quiet hours settings
   */
  async setQuietHours(hours: Partial<QuietHours>): Promise<void> {
    this.quietHours = { ...this.quietHours, ...hours };
    await AsyncStorage.setItem(QUIET_HOURS_KEY, JSON.stringify(this.quietHours));
    console.log('[NotificationScheduler] Updated quiet hours:', this.quietHours);
  }

  /**
   * Get current quiet hours
   */
  getQuietHours(): QuietHours {
    return this.quietHours;
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(): boolean {
    if (!this.quietHours.enabled) return false;

    const now = new Date();
    const currentHour = now.getHours();

    const { startHour, endHour } = this.quietHours;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    }

    // Normal range (e.g., 23:00 to 06:00 is handled above, but 08:00 to 22:00)
    return currentHour >= startHour && currentHour < endHour;
  }

  /**
   * Create a date trigger for a specific date/time
   */
  private createDateTrigger(date: Date): Notifications.NotificationTriggerInput {
    const now = new Date();
    const targetDate = new Date(date);

    // Calculate seconds until the target date
    const secondsUntil = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));

    return { seconds: secondsUntil };
  }

  /**
   * Persist schedule information for restoration
   */
  private async persistScheduleInfo(info: ScheduledNotificationInfo): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      const schedules: ScheduledNotificationInfo[] = existing ? JSON.parse(existing) : [];

      // Remove any existing schedule with the same category and repeat interval
      const filtered = schedules.filter(
        s => !(s.category === info.category && s.repeatInterval === info.repeatInterval)
      );

      // Add new schedule
      filtered.push(info);

      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[NotificationScheduler] Failed to persist schedule:', error);
    }
  }

  /**
   * Remove schedule information
   */
  private async removeScheduleInfo(identifier: string): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (!existing) return;

      const schedules: ScheduledNotificationInfo[] = JSON.parse(existing);
      const filtered = schedules.filter(s => s.id !== identifier);

      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[NotificationScheduler] Failed to remove schedule info:', error);
    }
  }

  /**
   * Restore scheduled notifications after app restart
   */
  private async restoreScheduledNotifications(): Promise<void> {
    try {
      const scheduled = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (!scheduled) return;

      const schedules: ScheduledNotificationInfo[] = JSON.parse(scheduled);
      const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const existingIds = new Set(existingNotifications.map(n => n.identifier));

      // Reschedule any notifications that weren't restored
      for (const schedule of schedules) {
        if (!existingIds.has(schedule.id)) {
          console.log(`[NotificationScheduler] Restoring notification: ${schedule.id}`);

          if (schedule.repeatInterval === 'daily' && typeof schedule.scheduledFor === 'number') {
            // Restore daily notification
            const hour = schedule.scheduledFor as number;
            await this.scheduleDaily(schedule.category, hour, 0, schedule.data as Record<string, unknown>);
          }
        }
      }

      console.log(`[NotificationScheduler] Restored ${schedules.length} scheduled notifications`);
    } catch (error) {
      console.error('[NotificationScheduler] Failed to restore notifications:', error);
    }
  }

  /**
   * Load user preferences
   */
  private async loadPreferences(): Promise<void> {
    try {
      const quietHours = await AsyncStorage.getItem(QUIET_HOURS_KEY);
      if (quietHours) {
        this.quietHours = JSON.parse(quietHours);
      }

      const timezone = await AsyncStorage.getItem(USER_TIMEZONE_KEY);
      if (timezone) {
        this.userTimezone = timezone;
      }
    } catch (error) {
      console.error('[NotificationScheduler] Failed to load preferences:', error);
    }
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler();

// Export convenience functions
export async function scheduleNotification(
  category: NotificationCategory,
  config?: ScheduleConfig,
  templateParams?: Record<string, unknown>
): Promise<string | null> {
  return notificationScheduler.schedule(category, config, templateParams);
}

export async function scheduleDailyIntention(
  hour?: number,
  templateParams?: Record<string, unknown>
): Promise<string | null> {
  return notificationScheduler.scheduleDailyIntention(hour, templateParams);
}

export async function cancelAllNotifications(): Promise<void> {
  return notificationScheduler.cancelAll();
}

export async function setNotificationQuietHours(hours: Partial<QuietHours>): Promise<void> {
  return notificationScheduler.setQuietHours(hours);
}

export function getNotificationQuietHours(): QuietHours {
  return notificationScheduler.getQuietHours();
}
