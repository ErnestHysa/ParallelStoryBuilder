import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { offlineActions } from './offlineStore';
import { AppError, Notification as NotificationType, NotificationPreferences } from '@/lib/types';
import { useAuthStore } from './authStore';

interface NotificationAction {
  id: string;
  type: 'viewed' | 'dismissed' | 'action_taken';
  timestamp: number;
  metadata?: Record<string, any>;
}

interface NotificationsState {
  // Data
  notifications: NotificationType[];
  unreadCount: number;
  preferences: NotificationPreferences;
  history: NotificationAction[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // Methods
  initialize: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  dismissAllNotifications: () => Promise<void>;
  performAction: (notificationId: string, action: 'viewed' | 'dismissed' | 'action_taken', metadata?: Record<string, any>) => Promise<void>;

  // Preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  getPreferences: () => NotificationPreferences;

  // Push notifications
  registerForPushNotifications: () => Promise<void>;
  unregisterForPushNotifications: () => Promise<void>;
  handlePushNotification: (notification: any) => Promise<void>;

  // History
  getNotificationHistory: (limit?: number, offset?: number) => Promise<NotificationAction[]>;
  clearHistory: () => Promise<void>;

  // Cleanup
  cleanupOldNotifications: (olderThanDays?: number) => Promise<void>;
}

// Default notification preferences
const defaultPreferences: NotificationPreferences = {
  email: true,
  push: true,
  inApp: true,
  storyUpdates: true,
  aiFeatures: true,
  marketing: false,
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: defaultPreferences,
  history: [],
  isLoading: false,
  isRefreshing: false,

  initialize: async () => {
    const { isConfigured } = useAuthStore.getState();
    if (!isConfigured) {
      console.log('Supabase not configured - running in demo mode for notifications');
      return;
    }

    try {
      // Load preferences
      await get().loadPreferences();

      // Register for push notifications if enabled
      if (get().preferences.push) {
        await get().registerForPushNotifications();
      }

      // Load initial notifications
      await get().refreshNotifications();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  },

  refreshNotifications: async () => {
    const { user, isConfigured } = useAuthStore.getState();
    if (!user || !isConfigured) {
      console.log('No user or Supabase not configured - skipping notifications refresh');
      return;
    }

    set({ isLoading: true });

    try {
      // Fetch notifications ordered by most recent
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to prevent performance issues

      if (error) throw error;

      const notifications = data || [];
      const unreadCount = notifications.filter(n => !n.read_at).length;

      set({
        notifications,
        unreadCount,
        isLoading: false
      });

      // Record view action for each unread notification
      for (const notification of notifications.filter(n => !n.read_at)) {
        await get().performAction(notification.id, 'viewed');
      }

    } catch (error: any) {
      console.error('Error refreshing notifications:', error);
      set({ isLoading: false });

      // In demo mode or if table doesn't exist, create mock notifications
      if (error.code === 'PGRST116') {
        const mockNotifications: NotificationType[] = [
          {
            id: 'demo-1',
            user_id: user.id,
            type: 'story_update',
            title: 'New Story Update',
            message: 'Your partner added a new entry to your shared story',
            data: { storyId: 'demo-story-1', partnerId: 'demo-partner-1' },
            read_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            user_id: user.id,
            type: 'ai_feature',
            title: 'AI Suggestion',
            message: 'Your AI companion has writing suggestions for your current story',
            data: { storyId: 'demo-story-2', suggestions: 3 },
            read_at: null,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString(),
          }
        ];

        set({
          notifications: mockNotifications,
          unreadCount: mockNotifications.length,
          isLoading: false
        });
      }
    }
  },

  markAsRead: async (notificationId: string) => {
    const { user, isConfigured } = useAuthStore.getState();
    if (!user || !isConfigured) {
      // Update local state in demo mode
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));

      // Record the action
      await get().performAction(notificationId, 'viewed');

    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429') {
        // Queue for offline sync
        await offlineActions.updateNotification(user.id, notificationId, { read_at: new Date().toISOString() });

        // Update local state for immediate UI feedback
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === notificationId
              ? { ...n, read_at: new Date().toISOString() }
              : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        }));

        throw new AppError('Notification marked as read queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }
      throw error;
    }
  },

  markAllAsRead: async () => {
    const { user, isConfigured } = useAuthStore.getState();
    if (!user || !isConfigured) {
      // Update all locally in demo mode
      set(state => ({
        notifications: state.notifications.map(n => ({
          ...n,
          read_at: new Date().toISOString()
        })),
        unreadCount: 0
      }));
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;

      // Update local state
      set(state => ({
        notifications: state.notifications.map(n => ({
          ...n,
          read_at: new Date().toISOString()
        })),
        unreadCount: 0
      }));

    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429') {
        // Queue all unread notifications for offline sync
        const unreadIds = get().notifications.filter(n => !n.read_at).map(n => n.id);
        for (const id of unreadIds) {
          await offlineActions.updateNotification(user.id, id, { read_at: new Date().toISOString() });
        }

        // Update local state for immediate UI feedback
        set(state => ({
          notifications: state.notifications.map(n => ({
            ...n,
            read_at: new Date().toISOString()
          })),
          unreadCount: 0
        }));

        throw new AppError('Mark all as read queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }
      throw error;
    }
  },

  dismissNotification: async (notificationId: string) => {
    await get().performAction(notificationId, 'dismissed');

    // Remove from local state
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== notificationId),
      unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0
    }));
  },

  dismissAllNotifications: async () => {
    // Record dismiss actions for all notifications
    for (const notification of get().notifications) {
      await get().performAction(notification.id, 'dismissed');
    }

    // Clear all notifications
    set({
      notifications: [],
      unreadCount: 0
    });
  },

  performAction: async (notificationId: string, action: 'viewed' | 'dismissed' | 'action_taken', metadata?: Record<string, any>) => {
    const actionRecord: NotificationAction = {
      id: `${notificationId}-${Date.now()}-${action}`,
      type: action,
      timestamp: Date.now(),
      metadata
    };

    set(state => ({
      history: [actionRecord, ...state.history].slice(0, 100) // Keep last 100 actions
    }));

    // In a real app, this would sync to a analytics service
    console.log('Notification action:', actionRecord);
  },

  updatePreferences: async (newPreferences: Partial<NotificationPreferences>) => {
    const { user, isConfigured } = useAuthStore.getState();
    const currentPreferences = get().preferences;
    const updatedPreferences = { ...currentPreferences, ...newPreferences };

    if (!user || !isConfigured) {
      // Update locally in demo mode
      set({ preferences: updatedPreferences });
      return;
    }

    try {
      // Try to update online first
      const { error } = await supabase
        .from('user_preferences')
        .update({
          notification_preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      set({ preferences: updatedPreferences });

    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429') {
        // Queue for offline sync
        await offlineActions.updatePreferences(user.id, { notification_preferences: updatedPreferences });

        // Update local state for immediate UI feedback
        set({ preferences: updatedPreferences });

        throw new AppError('Notification preferences queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }
      throw error;
    }
  },

  getPreferences: () => {
    return get().preferences;
  },

  registerForPushNotifications: async () => {
    // In a real implementation, this would register with Apple/Google push services
    console.log('Registering for push notifications...');

    // For demo purposes, we'll just simulate successful registration
    setTimeout(() => {
      console.log('Push notifications registered successfully');
    }, 1000);
  },

  unregisterForPushNotifications: async () => {
    console.log('Unregistering from push notifications...');
    // Implementation would remove device token from push service
  },

  handlePushNotification: async (notification: any) => {
    console.log('Handling push notification:', notification);

    // Convert push notification to app notification
    const appNotification: NotificationType = {
      id: `push-${Date.now()}`,
      user_id: useAuthStore.getState().user?.id || 'demo',
      type: notification.type || 'general',
      title: notification.title || 'New Notification',
      message: notification.body || '',
      data: notification.data || {},
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to notifications list
    set(state => ({
      notifications: [appNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));

    // Record the action
    await get().performAction(appNotification.id, 'action_taken', { source: 'push' });
  },

  getNotificationHistory: async (limit = 50, offset = 0) => {
    // For demo purposes, return recent history
    return get().history.slice(offset, offset + limit);
  },

  clearHistory: async () => {
    set({ history: [] });
  },

  cleanupOldNotifications: async (olderThanDays = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { user, isConfigured } = useAuthStore.getState();
    if (!user || !isConfigured) {
      // Clean up locally in demo mode
      set(state => ({
        notifications: state.notifications.filter(n =>
          new Date(n.created_at) > cutoffDate
        )
      }));
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('user_id', user.id);

      if (error) throw error;

      // Also clean up local state
      set(state => ({
        notifications: state.notifications.filter(n =>
          new Date(n.created_at) > cutoffDate
        )
      }));

    } catch (error: any) {
      if (error.code === 'PGRST116') {
        // In demo mode, just clean up local state
        set(state => ({
          notifications: state.notifications.filter(n =>
            new Date(n.created_at) > cutoffDate
          )
        }));
      }
      console.error('Error cleaning up old notifications:', error);
    }
  },

  // Load preferences from storage
  loadPreferences: async () => {
    try {
      // In a real app, this would load from secure storage
      // For demo purposes, we'll use the defaults
      const savedPrefs = localStorage.getItem('notification_preferences');
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        set({ preferences: { ...defaultPreferences, ...parsed } });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  },

  // Save preferences to storage
  savePreferences: async () => {
    try {
      const preferences = get().preferences;
      localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  },
}));

// Auto-save preferences when they change
useNotificationsStore.subscribe(
  (state) => state.preferences,
  (preferences) => {
    get().savePreferences();
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
);

// Real-time subscription for new notifications
if (typeof window !== 'undefined') {
  const initializeRealtime = async () => {
    const { user, isConfigured } = useAuthStore.getState();
    if (!user || !isConfigured) return;

    // Setup real-time subscription for new notifications
    const subscription = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);

          // Add to notifications list
          set(state => ({
            notifications: [payload.new as NotificationType, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // Initialize realtime when store is created
  initializeRealtime().catch(console.error);
}