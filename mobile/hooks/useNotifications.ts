import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ExpoPushToken } from 'expo-notifications';
import { getAnalytics } from '../lib/analytics';
import { EventNames } from '../lib/trackingEvents';

interface NotificationCategory {
  id: string;
  name: string;
  icon?: string;
}

interface NotificationSettings {
  enabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  categories: {
    new_chapter: boolean;
    your_turn: boolean;
    partner_joined: boolean;
    daily_reminder: boolean;
    achievements: boolean;
  };
}

interface UseNotificationsOptions {
  autoInitialize?: boolean;
  userId?: string;
  onTokenReceived?: (token: ExpoPushToken) => void;
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

interface UseNotificationsReturn {
  // State
  token: ExpoPushToken | null;
  permissions: {
    granted: boolean;
    ios: boolean;
    android: boolean;
  };
  isLoading: boolean;
  scheduledNotifications: Notifications.NotificationContent[];

  // Settings
  settings: NotificationSettings | null;
  settingsLoading: boolean;

  // Actions
  requestPermissions: () => Promise<boolean>;
  initialize: () => Promise<void>;
  registerToken: () => Promise<void>;
  scheduleNotification: (
    identifier: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    categoryId?: NotificationCategory,
    delayInMinutes?: number
  ) => Promise<string | null>;
  scheduleQuietHoursNotification: (
    identifier: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    categoryId?: NotificationCategory,
    delayInMinutes?: number
  ) => Promise<string | null>;
  cancelScheduledNotification: (identifier: string) => Promise<void>;
  cancelAllScheduledNotifications: () => Promise<void>;
  getScheduledNotificationsList: () => Promise<Notifications.NotificationContent[]>;
  checkPermissions: () => Promise<boolean>;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  refreshSettings: () => Promise<void>;

  // Listeners
  addListener: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
}

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  categories: {
    new_chapter: true,
    your_turn: true,
    partner_joined: true,
    daily_reminder: true,
    achievements: true,
  },
};

export const useNotifications = (
  options: UseNotificationsOptions = {}
): UseNotificationsReturn => {
  const {
    autoInitialize = true,
    userId,
    onTokenReceived,
    onNotificationReceived,
    onNotificationResponse,
  } = options;

  // State
  const [token, setToken] = useState<ExpoPushToken | null>(null);
  const [permissions, setPermissions] = useState({
    granted: false,
    ios: false,
    android: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledNotifications, setScheduledNotifications] = useState<Notifications.NotificationContent[]>([]);

  // Settings state
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Refs for listeners
  const listenersRef = useRef<Map<string, (...args: unknown[]) => void>>(new Map());

  // Initialize notifications
  const initialize = useCallback(async () => {
    try {
      // Set up notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Check permissions
      const granted = await checkPermissions();
      setPermissions({
        granted,
        ios: Platform.OS === 'ios' ? granted : false,
        android: Platform.OS === 'android' ? granted : false,
      });

      // Get push token
      if (granted) {
        await registerToken();
      }

      setIsLoading(false);

      // Track initialization
      const analytics = getAnalytics();
      analytics.track(EventNames.NOTIFICATION_ENABLED.name);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setIsLoading(false);
    }
  }, []);

  // Check permissions
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }, []);

  // Register push token
  const registerToken = useCallback(async () => {
    try {
      const pushToken = await Notifications.getExpoPushTokenAsync();
      setToken(pushToken);
      onTokenReceived?.(pushToken);

      // In a real app, you would send this token to your backend
      console.log('[Notifications] Push token registered:', pushToken.data);
    } catch (error) {
      console.error('[Notifications] Failed to get push token:', error);
    }
  }, [onTokenReceived]);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';

    setPermissions({
      granted,
      ios: Platform.OS === 'ios' ? granted : false,
      android: Platform.OS === 'android' ? granted : false,
    });

    if (granted) {
      await registerToken();
    }

    return granted;
  }, [registerToken]);

  // Schedule notification
  const scheduleNotification = useCallback(async (
    identifier: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    categoryId?: NotificationCategory,
    delayInMinutes = 0
  ): Promise<string | null> => {
    try {
      const content: Notifications.NotificationContentInput = {
        title,
        body,
        data: { ...data, categoryId: categoryId?.id },
        sound: 'default',
      };

      const trigger =
        delayInMinutes > 0
          ? { seconds: delayInMinutes * 60, channelId: 'default' }
          : null;

      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      // Track notification scheduled
      const analytics = getAnalytics();
      analytics.track(EventNames.NOTIFICATION_ENABLED.name, {
        notification_id: id,
        title,
      });

      return id;
    } catch (error) {
      console.error('[Notifications] Failed to schedule:', error);
      return null;
    }
  }, []);

  // Schedule with quiet hours
  const scheduleQuietHoursNotification = useCallback(async (
    identifier: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
    categoryId?: NotificationCategory,
    delayInMinutes = 0
  ): Promise<string | null> => {
    // Check if currently in quiet hours
    if (settings.quietHours.enabled) {
      const now = new Date();
      const [startHour, startMin] = settings.quietHours.start.split(':').map(Number);
      const [endHour, endMin] = settings.quietHours.end.split(':').map(Number);

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      const inQuietHours =
        startMinutes < endMinutes
          ? nowMinutes >= startMinutes && nowMinutes < endMinutes
          : nowMinutes >= startMinutes || nowMinutes < endMinutes;

      if (inQuietHours) {
        console.log('[Notifications] Skipping - in quiet hours');
        return null;
      }
    }

    return scheduleNotification(identifier, title, body, data, categoryId, delayInMinutes);
  }, [settings, scheduleNotification]);

  // Cancel scheduled notification
  const cancelScheduledNotification = useCallback(async (identifier: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('[Notifications] Failed to cancel:', error);
    }
  }, []);

  // Cancel all
  const cancelAllScheduledNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setScheduledNotifications([]);
    } catch (error) {
      console.error('[Notifications] Failed to cancel all:', error);
    }
  }, []);

  // Get scheduled notifications
  const getScheduledNotificationsList = useCallback(async (): Promise<Notifications.NotificationContent[]> => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled.map(n => n.content);
    } catch (error) {
      console.error('[Notifications] Failed to get scheduled:', error);
      return [];
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      categories: {
        ...prev.categories,
        ...newSettings.categories,
      },
      quietHours: {
        ...prev.quietHours,
        ...newSettings.quietHours,
      },
    }));
  }, []);

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    setSettingsLoading(true);
    // In a real app, you would fetch settings from your backend
    setSettingsLoading(false);
  }, []);

  // Add listener
  const addListener = useCallback((event: string, listener: (...args: unknown[]) => void) => {
    listenersRef.current.set(event, listener);
    // @ts-ignore - expo-notifications event types
    Notifications.addNotificationListener(event, listener);
  }, []);

  // Remove listener
  const removeListener = useCallback((event: string, listener: (...args: unknown[]) => void) => {
    listenersRef.current.delete(event);
    // @ts-ignore - expo-notifications event types
    Notifications.removeNotificationSubscription(listener);
  }, []);

  // Auto-initialize
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
  }, [autoInitialize, initialize]);

  // Set up notification response listener
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      onNotificationResponse?.(response);
    });

    return () => subscription.remove();
  }, [onNotificationResponse]);

  return {
    token,
    permissions,
    isLoading,
    scheduledNotifications,
    settings,
    settingsLoading,
    requestPermissions,
    initialize,
    registerToken,
    scheduleNotification,
    scheduleQuietHoursNotification,
    cancelScheduledNotification,
    cancelAllScheduledNotifications,
    getScheduledNotificationsList,
    checkPermissions,
    updateSettings,
    refreshSettings,
    addListener,
    removeListener,
  };
};
