// Event type definitions for Parallel Story Builder

// Event categories
export enum EventCategory {
  // User actions
  USER = 'user',
  STORY = 'story',
  NOTIFICATION = 'notification',
  SOCIAL = 'social',
  SCREEN = 'screen',

  // System events
  SESSION = 'session',
  ERROR = 'error',
  PERFORMANCE = 'performance',

  // Business events
  REVENUE = 'revenue',
  CONTENT = 'content',
}

// Event names with categories
export const EventNames = {
  // User events
  USER_SIGN_UP: { name: 'User Signed Up', category: EventCategory.USER },
  USER_LOGIN: { name: 'User Logged In', category: EventCategory.USER },
  USER_LOGOUT: { name: 'User Logged Out', category: EventCategory.USER },
  USER_PROFILE_UPDATED: { name: 'User Profile Updated', category: EventCategory.USER },
  USER_SETTINGS_CHANGED: { name: 'User Settings Changed', category: EventCategory.USER },

  // Onboarding events
  ONBOARDING_STARTED: { name: 'Onboarding Started', category: EventCategory.USER },
  ONBOARDING_COMPLETED: { name: 'Onboarding Completed', category: EventCategory.USER },
  ONBOARDING_SKIPPED: { name: 'Onboarding Skipped', category: EventCategory.USER },

  // Story events
  STORY_CREATED: { name: 'Story Created', category: EventCategory.STORY },
  STORY_JOINED: { name: 'Story Joined', category: EventCategory.STORY },
  STORY_LEFT: { name: 'Story Left', category: EventCategory.STORY },
  STORY_PUBLISHED: { name: 'Story Published', category: EventCategory.STORY },
  STORY_ARCHIVED: { name: 'Story Archived', category: EventCategory.STORY },
  STORY_DELETED: { name: 'Story Deleted', category: EventCategory.STORY },

  // Writing events
  CHAPTER_STARTED: { name: 'Chapter Started', category: EventCategory.STORY },
  CHAPTER_COMPLETED: { name: 'Chapter Completed', category: EventCategory.STORY },
  WORD_COUNT_UPDATED: { name: 'Word Count Updated', category: EventCategory.STORY },
  CHARACTER_ADDED: { name: 'Character Added', category: EventCategory.STORY },
  LOCATION_ADDED: { name: 'Location Added', category: EventCategory.STORY },

  // Social events
  FRIEND_ADDED: { name: 'Friend Added', category: EventCategory.SOCIAL },
  FRIEND_REMOVED: { name: 'Friend Removed', category: EventCategory.SOCIAL },
  INVITATION_SENT: { name: 'Invitation Sent', category: EventCategory.SOCIAL },
  INVITATION_ACCEPTED: { name: 'Invitation Accepted', category: EventCategory.SOCIAL },
  INVITATION_DECLINED: { name: 'Invitation Declined', category: EventCategory.SOCIAL },

  // Comment events
  COMMENT_ADDED: { name: 'Comment Added', category: EventCategory.SOCIAL },
  COMMENT_LIKED: { name: 'Comment Liked', category: EventCategory.SOCIAL },
  COMMENT_REPLIED: { name: 'Comment Replied', category: EventCategory.SOCIAL },

  // Notification events
  NOTIFICATION_ENABLED: { name: 'Notification Enabled', category: EventCategory.NOTIFICATION },
  NOTIFICATION_DISABLED: { name: 'Notification Disabled', category: EventCategory.NOTIFICATION },
  NOTIFICATION_RECEIVED: { name: 'Notification Received', category: EventCategory.NOTIFICATION },
  NOTIFICATION_CLICKED: { name: 'Notification Clicked', category: EventCategory.NOTIFICATION },
  NOTIFICATION_SETTINGS_CHANGED: { name: 'Notification Settings Changed', category: EventCategory.NOTIFICATION },

  // Screen views
  SCREEN_HOME: { name: 'Screen Viewed - Home', category: EventCategory.SCREEN },
  SCREEN_STORIES: { name: 'Screen Viewed - Stories', category: EventCategory.SCREEN },
  SCREEN_CREATE: { name: 'Screen Viewed - Create Story', category: EventCategory.SCREEN },
  SCREEN_WRITE: { name: 'Screen Viewed - Write', category: EventCategory.SCREEN },
  SCREEN_PROFILE: { name: 'Screen Viewed - Profile', category: EventCategory.SCREEN },
  SCREEN_SETTINGS: { name: 'Screen Viewed - Settings', category: EventCategory.SCREEN },
  SCREEN_NOTIFICATIONS: { name: 'Screen Viewed - Notifications', category: EventCategory.SCREEN },

  // Session events
  SESSION_STARTED: { name: 'Session Started', category: EventCategory.SESSION },
  SESSION_ENDED: { name: 'Session Ended', category: EventCategory.SESSION },
  SESSION_DURATION: { name: 'Session Duration', category: EventCategory.SESSION },

  // Error events
  ERROR_OCCURRED: { name: 'Error Occurred', category: EventCategory.ERROR },
  NETWORK_ERROR: { name: 'Network Error', category: EventCategory.ERROR },
  AUTH_ERROR: { name: 'Auth Error', category: EventCategory.ERROR },

  // Performance events
  APP_STARTUP: { name: 'App Startup Time', category: EventCategory.PERFORMANCE },
  SCREEN_LOAD_TIME: { name: 'Screen Load Time', category: EventCategory.PERFORMANCE },
  API_RESPONSE_TIME: { name: 'API Response Time', category: EventCategory.PERFORMANCE },

  // Content events
  INSPIRATION_VIEWED: { name: 'Inspiration Viewed', category: EventCategory.CONTENT },
  INSPIRATION_USED: { name: 'Inspiration Used', category: EventCategory.CONTENT },
  THEME_APPLIED: { name: 'Theme Applied', category: EventCategory.CONTENT },
  TEMPLATE_SELECTED: { name: 'Template Selected', category: EventCategory.CONTENT },
};

// Event property interfaces
export interface StoryEventProperties {
  storyId?: string;
  storyTitle?: string;
  genre?: string;
  wordCount?: number;
  chapterCount?: number;
  isCollaborative?: boolean;
  collaboratorsCount?: number;
  [key: string]: any;
}

export interface UserEventProperties {
  userId?: string;
  username?: string;
  planType?: 'free' | 'premium';
  referralCode?: string;
  [key: string]: any;
}

export interface SocialEventProperties {
  friendId?: string;
  storyId?: string;
  invitationId?: string;
  [key: string]: any;
}

export interface NotificationEventProperties {
  type: 'story_invitation' | 'story_update' | 'comment_reply' | 'mention' | 'system';
  storyId?: string;
  [key: string]: any;
}

export interface ErrorEventProperties {
  error: string;
  stackTrace?: string;
  screen?: string;
  action?: string;
  [key: string]: any;
}

export interface PerformanceEventProperties {
  duration: number;
  [key: string]: any;
}

// Common event property builders
export const buildStoryProperties = (story: any): StoryEventProperties => ({
  storyId: story.id,
  storyTitle: story.title,
  genre: story.genre,
  wordCount: story.wordCount,
  chapterCount: story.chapters?.length || 0,
  isCollaborative: story.collaborative,
  collaboratorsCount: story.collaborators?.length || 0,
});

export const buildUserProperties = (user: any): UserEventProperties => ({
  userId: user.id,
  username: user.username,
  planType: user.planType || 'free',
  referralCode: user.referralCode,
});

export const buildErrorProperties = (error: Error, screen?: string, action?: string): ErrorEventProperties => ({
  error: error.message,
  stackTrace: error.stack,
  screen,
  action,
});

// Event tracking utilities
export class EventTracker {
  // Track custom event
  static track(eventName: string, properties: Record<string, any> = {}): void {
    // This will be implemented in the analytics hook
    console.log(`[Event] ${eventName}:`, properties);
  }

  // Track with error handling
  static trackSafe(eventName: string, properties: Record<string, any> = {}): void {
    try {
      this.track(eventName, properties);
    } catch (error) {
      console.error('[Event Tracker Error]', error);
      // Track the error itself
      this.track('Event Tracking Error', {
        originalEvent: eventName,
        originalProperties: properties,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Batch track events
  static trackBatch(events: Array<{ name: string; properties?: Record<string, any> }>): void {
    events.forEach(event => {
      this.track(event.name, event.properties || {});
    });
  }
}

// Export convenience methods
export const track = EventTracker.trackSafe.bind(EventTracker);

// Screen tracking utilities
export const SCREEN_NAMES = {
  HOME: 'Home',
  STORIES: 'Stories',
  CREATE_STORY: 'Create Story',
  WRITE: 'Write',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
  INSPIRATIONS: 'Inspirations',
  STORY_DETAIL: 'Story Detail',
} as const;

export type ScreenName = typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];