import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { offlineStorage } from '@/lib/offlineStorage';
import type {
  Chapter,
  Story,
  UserStory,
  Profile,
  OfflineAction,
  OfflineActionType
} from '@/types/supabase';

interface OfflineStore {
  // State
  isConnected: boolean;
  isSyncing: boolean;
  queue: OfflineAction[];
  lastSyncAt: number | null;

  // Actions
  setConnectionStatus: (connected: boolean) => void;
  addAction: (action: OfflineAction) => Promise<void>;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  removeAction: (id: string) => void;
  syncOfflineData: () => Promise<void>;
  retryAction: (id: string) => void;
}

// Define offline action types
export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'failed' | 'synced';
  metadata?: Record<string, any>;
}

// Enhanced Supabase client with offline support
const offlineSupabase = {
  ...supabase,
  async from(table: string) {
    const base = supabase.from(table);
    return {
      ...base,
      async insert(data: any) {
        try {
          return await base.insert(data);
        } catch (error: any) {
          if (error.code === 'PGRST116' || error.code === '429') {
            // Network error or rate limit
            throw error;
          }
          throw error;
        }
      },
      async update(data: any) {
        try {
          return await base.update(data);
        } catch (error: any) {
          if (error.code === 'PGRST116' || error.code === '429') {
            throw error;
          }
          throw error;
        }
      },
      async delete() {
        try {
          return await base.delete();
        } catch (error: any) {
          if (error.code === 'PGRST116' || error.code === '429') {
            throw error;
          }
          throw error;
        }
      }
    };
  }
};

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: true,
      isSyncing: false,
      queue: [],
      lastSyncAt: null,

      // Actions
      setConnectionStatus: (connected: boolean) => {
        set({ isConnected: connected });

        // Auto-sync when connection is restored
        if (connected && get().queue.length > 0) {
          get().processQueue();
        }
      },

      addAction: async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'status'>) => {
        const newAction: OfflineAction = {
          ...action,
          id: `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          status: 'pending',
        };

        set((state) => ({
          queue: [...state.queue, newAction],
        }));

        // Try to sync immediately if connected
        if (get().isConnected) {
          try {
            await get().processQueue();
          } catch (error) {
            // Sync failed, action remains in queue
            console.warn('Initial sync failed, action queued for later:', error);
          }
        }
      },

      processQueue: async () => {
        const { queue, retryAction } = get();
        const pendingActions = queue.filter(action => action.status === 'pending');

        if (pendingActions.length === 0) return;

        set({ isSyncing: true });

        for (const action of pendingActions) {
          try {
            await retryAction(action.id);

            // Small delay between actions to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            // Continue with next action if one fails
            console.error(`Failed to process action ${action.id}:`, error);
          }
        }

        set({ isSyncing: false });
      },

      retryAction: async (id: string) => {
        const { queue } = get();
        const action = queue.find(a => a.id === id);

        if (!action) return;

        // Check if max retries reached
        if (action.retries >= action.maxRetries) {
          set((state) => ({
            queue: state.queue.map(a =>
              a.id === id ? { ...a, status: 'failed' } : a
            ),
          }));
          return;
        }

        try {
          let result;

          switch (action.type) {
            case 'CREATE_CHAPTER':
              result = await offlineSupabase
                .from('chapters')
                .insert(action.payload.chapter);
              break;

            case 'JOIN_STORY':
              result = await offlineSupabase
                .from('user_stories')
                .insert(action.payload.userStory);
              break;

            case 'UPDATE_PROFILE':
              result = await offlineSupabase
                .from('profiles')
                .update(action.payload.updates)
                .eq('id', action.payload.profileId);
              break;

            case 'CREATE_STORY':
              result = await offlineSupabase
                .from('stories')
                .insert(action.payload.story);
              break;

            default:
              throw new Error(`Unknown action type: ${action.type}`);
          }

          if (result.error) {
            throw result.error;
          }

          // Mark as synced
          set((state) => ({
            queue: state.queue.map(a =>
              a.id === id ? { ...a, status: 'synced', retries: a.retries + 1 } : a
            ),
            lastSyncAt: Date.now(),
          }));

          // Remove synced actions after a delay
          setTimeout(() => {
            set((state) => ({
              queue: state.queue.filter(a => a.id !== id),
            }));
          }, 5000);

        } catch (error: any) {
          console.error(`Retry failed for action ${id}:`, error);

          // Update retry count
          set((state) => ({
            queue: state.queue.map(a =>
              a.id === id ? { ...a, retries: a.retries + 1 } : a
            ),
          }));

          throw error;
        }
      },

      clearQueue: () => {
        set({ queue: [] });
      },

      removeAction: (id: string) => {
        set((state) => ({
          queue: state.queue.filter(action => action.id !== id),
        }));
      },

      syncOfflineData: async () => {
        await get().processQueue();
      },
    }),
    {
      name: 'offline-storage',
      partialize: (state) => ({
        queue: state.queue,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// Utility functions for common offline operations
export const offlineActions = {
  createChapter: async (chapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>) => {
    return useOfflineStore.getState().addAction({
      type: 'CREATE_CHAPTER',
      payload: { chapter },
      retries: 0,
      maxRetries: 3,
    });
  },

  joinStory: async (userStory: Omit<UserStory, 'id' | 'created_at' | 'updated_at'>) => {
    return useOfflineStore.getState().addAction({
      type: 'JOIN_STORY',
      payload: { userStory },
      retries: 0,
      maxRetries: 3,
    });
  },

  updateProfile: async (profileId: string, updates: Partial<Profile>) => {
    return useOfflineStore.getState().addAction({
      type: 'UPDATE_PROFILE',
      payload: { profileId, updates },
      retries: 0,
      maxRetries: 3,
    });
  },

  createStory: async (story: Omit<Story, 'id' | 'created_at' | 'updated_at'>) => {
    return useOfflineStore.getState().addAction({
      type: 'CREATE_STORY',
      payload: { story },
      retries: 0,
      maxRetries: 3,
    });
  },
};