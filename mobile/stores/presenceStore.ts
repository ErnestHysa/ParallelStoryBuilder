import { create } from 'zustand';
import { PresenceData } from '@/lib/realtime';
import { supabase } from '@/lib/supabase';

interface PresenceState {
  // User presence data
  userPresence: Map<string, PresenceData>;
  localUserPresence: PresenceData | null;

  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: Error | null;

  // Typing state
  typingIndicators: Map<string, {
    userId: string;
    timestamp: number;
    displayName: string;
    chapterId?: string;
  }>;

  // Story-specific state
  activeStories: Set<string>;
  currentStory: string | null;
  currentChapter: string | null;
  currentSection: string | null;

  // Actions
  initialize: () => void;
  updateLocalPresence: (updates: Partial<PresenceData>) => void;
  clearLocalPresence: () => void;

  // Story management
  setActiveStory: (storyId: string) => void;
  setCurrentChapter: (chapterId: string) => void;
  setCurrentSection: (sectionId: string) => void;

  // Typing indicators
  startTyping: (chapterId?: string, sectionId?: string) => void;
  stopTyping: () => void;
  updateTypingIndicators: (typingUsers: Array<{ userId: string; timestamp: number; displayName: string; chapterId?: string }>) => void;
  clearTypingIndicators: () => void;

  // Connection management
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setConnectionError: (error: Error | null) => void;

  // Cleanup
  reset: () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  userPresence: new Map(),
  localUserPresence: null,

  isConnected: false,
  isConnecting: false,
  connectionError: null,

  typingIndicators: new Map(),

  activeStories: new Set(),
  currentStory: null,
  currentChapter: null,
  currentSection: null,

  initialize: () => {
    // Initialize presence based on auth state
    const { user } = get();
    if (user) {
      set({
        localUserPresence: {
          id: user.id,
          email: user.email,
          status: 'online',
          typing: false,
        },
      });
    }
  },

  updateLocalPresence: (updates: Partial<PresenceData>) => {
    const { localUserPresence } = get();
    if (!localUserPresence) return;

    const updatedPresence = {
      ...localUserPresence,
      ...updates,
      lastSeen: updates.status !== 'online' ? Date.now() : undefined,
    };

    set({ localUserPresence: updatedPresence });
  },

  clearLocalPresence: () => {
    set({ localUserPresence: null });
  },

  setActiveStory: (storyId: string) => {
    const { activeStories, currentStory } = get();
    const newActiveStories = new Set(activeStories);
    newActiveStories.add(storyId);

    set({
      activeStories: newActiveStories,
      currentStory: currentStory || storyId,
    });
  },

  setCurrentChapter: (chapterId: string) => {
    set({ currentChapter: chapterId });
  },

  setCurrentSection: (sectionId: string) => {
    set({ currentSection: sectionId });
  },

  startTyping: (chapterId?: string, sectionId?: string) => {
    const { localUserPresence } = get();
    if (!localUserPresence) return;

    const updatedPresence = {
      ...localUserPresence,
      typing: true,
      currentChapter: chapterId,
      currentSection: sectionId,
    };

    set({
      localUserPresence: updatedPresence,
    });
  },

  stopTyping: () => {
    const { localUserPresence } = get();
    if (!localUserPresence) return;

    const updatedPresence = {
      ...localUserPresence,
      typing: false,
    };

    set({
      localUserPresence: updatedPresence,
    });
  },

  updateTypingIndicators: (typingUsers: Array<{ userId: string; timestamp: number; displayName: string; chapterId?: string }>) => {
    const { typingIndicators } = get();
    const newTypingIndicators = new Map(typingIndicators);

    // Clear expired typing indicators (older than 3 seconds)
    const now = Date.now();
    for (const [userId] of newTypingIndicators) {
      const indicator = newTypingIndicators.get(userId);
      if (indicator && now - indicator.timestamp > 3000) {
        newTypingIndicators.delete(userId);
      }
    }

    // Add new typing indicators
    typingUsers.forEach(user => {
      newTypingIndicators.set(user.userId, {
        userId: user.userId,
        timestamp: user.timestamp,
        displayName: user.displayName,
        chapterId: user.chapterId,
      });
    });

    set({ typingIndicators: newTypingIndicators });
  },

  clearTypingIndicators: () => {
    set({ typingIndicators: new Map() });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  setConnecting: (connecting: boolean) => {
    set({ isConnecting: connecting });
  },

  setConnectionError: (error: Error | null) => {
    set({ connectionError: error });
  },

  reset: () => {
    set({
      userPresence: new Map(),
      localUserPresence: null,
      isConnected: false,
      isConnecting: false,
      connectionError: null,
      typingIndicators: new Map(),
      activeStories: new Set(),
      currentStory: null,
      currentChapter: null,
      currentSection: null,
    });
  },
}));

// Hook to get typing indicators for the current story/chapter
export const useTypingIndicators = (storyId?: string, chapterId?: string) => {
  const { typingIndicators } = usePresenceStore();

  return Array.from(typingIndicators.values()).filter(indicator => {
    // Filter by story if specified
    if (storyId && indicator.chapterId) {
      return indicator.chapterId.startsWith(storyId);
    }

    // Filter by chapter if specified
    if (chapterId && indicator.chapterId !== chapterId) {
      return false;
    }

    return true;
  });
};

// Hook to get active user count
export const useActiveUsersCount = (storyId?: string) => {
  const { userPresence } = usePresenceStore();

  let count = 0;
  for (const presence of userPresence.values()) {
    if (presence.status === 'online') {
      if (storyId && presence.currentChapter) {
        if (presence.currentChapter.startsWith(storyId)) {
          count++;
        }
      } else {
        count++;
      }
    }
  }

  return count;
};