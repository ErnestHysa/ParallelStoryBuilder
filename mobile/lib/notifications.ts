import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ExpoPushToken } from 'expo-notifications';

// Notification categories
export enum NotificationCategory {
  STORY_INVITATION = 'story_invitation',
  STORY_UPDATE = 'story_update',
  COMMENT_REPLY = 'comment_reply',
  MENTION = 'mention',
  SYSTEM = 'system',
}

// Notification priority levels
export enum NotificationPriority {
  MIN = -2,
  LOW = -1,
  DEFAULT = 0,
  HIGH = 1,
  MAX = 2,
}

// Notification settings interface
export interface NotificationSettings {
  enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  sound: boolean;
  badge: boolean;
  preview: boolean;
}

// Default settings
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  categories: {
    [NotificationCategory.STORY_INVITATION]: true,
    [NotificationCategory.STORY_UPDATE]: true,
    [NotificationCategory.COMMENT_REPLY]: true,
    [NotificationCategory.MENTION]: true,
    [NotificationCategory.SYSTEM]: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  sound: true,
  badge: true,
  preview: true,
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Initialize notifications
export const initializeNotifications = async (): Promise<void> => {
  try {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    // Set notification categories
    await Notifications.setNotificationCategoryAsync(NotificationCategory.STORY_INVITATION, [
      { identifier: 'accept', buttonTitle: 'Accept', options: { opensAppToForeground: true } },
      { identifier: 'decline', buttonTitle: 'Decline', options: { opensAppToForeground: true } },
    ]);

    await Notifications.setNotificationCategoryAsync(NotificationCategory.STORY_UPDATE, [
      { identifier: 'view', buttonTitle: 'View Story', options: { opensAppToForeground: true } },
    ]);

    await Notifications.setNotificationCategoryAsync(NotificationCategory.COMMENT_REPLY, [
      { identifier: 'reply', buttonTitle: 'Reply', options: { opensAppToForeground: true } },
      { identifier: 'view', buttonTitle: 'View Story', options: { opensAppToForeground: true } },
    ]);

    await Notifications.setNotificationCategoryAsync(NotificationCategory.MENTION, [
      { identifier: 'view', buttonTitle: 'View Story', options: { opensAppToForeground: true } },
    ]);

    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

// Get push token
export const getPushToken = async (): Promise<ExpoPushToken | null> => {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

// Register push token with your backend
export const registerPushToken = async (token: ExpoPushToken, userId?: string): Promise<void> => {
  try {
    // TODO: Implement backend API call to register token
    console.log('Registering push token:', token.data, userId);

    // Example API call:
    // await fetch('/api/notifications/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token: token.data, userId }),
    // });
  } catch (error) {
    console.error('Error registering push token:', error);
  }
};

// Send local notification
export const scheduleLocalNotification = async (
  identifier: string,
  title: string,
  body: string,
  data?: Record<string, any>,
  categoryId?: NotificationCategory,
  time?: Date
): Promise<string> => {
  try {
    const schedulingOptions = time ? { time } : {};

    const identifierResult = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        data,
        categoryId: categoryId || NotificationCategory.SYSTEM,
      },
      ...schedulingOptions,
    });

    return identifierResult;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

// Cancel notification
export const cancelNotification = async (identifier: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

// Cancel all notifications
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

// Get scheduled notifications
export const getScheduledNotifications = async (): Promise<Notifications.ScheduledNotificationContent[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Check if notifications are enabled
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const settings = await Notifications.getPermissionsAsync();
    return settings.status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

// Check if current time is within quiet hours
export const isWithinQuietHours = (settings: NotificationSettings): boolean => {
  if (!settings.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const { start, end } = settings.quietHours;

  if (start <= end) {
    return currentTime >= start && currentTime <= end;
  } else {
    // Handle overnight quiet hours
    return currentTime >= start || currentTime <= end;
  }
};

// Schedule notification with quiet hours check
export const scheduleNotificationWithQuietHours = async (
  identifier: string,
  title: string,
  body: string,
  settings: NotificationSettings,
  data?: Record<string, any>,
  categoryId?: NotificationCategory,
  delayInMinutes = 0
): Promise<string | null> => {
  if (!settings.enabled || isWithinQuietHours(settings)) {
    return null;
  }

  const scheduledTime = new Date();
  scheduledTime.setMinutes(scheduledTime.getMinutes() + delayInMinutes);

  return await scheduleLocalNotification(
    identifier,
    title,
    body,
    data,
    categoryId,
    scheduledTime
  );
};

// Handle notification response
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
  handlers: Record<string, () => void>
): void => {
  const { actionIdentifier, notification } = response;

  if (actionIdentifier && handlers[actionIdentifier]) {
    handlers[actionIdentifier]();
  }

  if (notification.request.content.data) {
    const { screen, params } = notification.request.content.data;
    if (screen && handlers[`navigate_${screen}`]) {
      handlers[`navigate_${screen}`](params);
    }
  }
};

// Export notification types for TypeScript
export type {
  Notification as ExpoNotification,
  NotificationResponse,
  NotificationContent,
} from 'expo-notifications';