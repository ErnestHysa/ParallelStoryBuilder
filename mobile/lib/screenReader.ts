/**
 * Screen reader utilities and announcements for React Native
 */

import { Platform, AccessibilityInfo, Alert } from 'react-native';

// Types
export type AnnouncementType =
  | 'announcement'
  | 'assertive'
  | 'polite'
  | 'status'
  | 'alert'
  | 'log';

export type Priority = 'low' | 'normal' | 'high';

export interface AnnouncementOptions {
  type?: AnnouncementType;
  priority?: Priority;
  delay?: number;
  queue?: boolean;
  interrupt?: boolean;
  language?: string;
  debug?: boolean;
}

export interface ScreenReaderEvent {
  id: string;
  message: string;
  type: AnnouncementType;
  priority: Priority;
  timestamp: number;
}

// Screen reader detection
export const ScreenReader = {
  /**
   * Check if VoiceOver is enabled (iOS)
   */
  async isVoiceOverEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.error('Error checking VoiceOver status:', error);
      return false;
    }
  },

  /**
   * Check if TalkBack is enabled (Android)
   */
  async isTalkBackEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.error('Error checking TalkBack status:', error);
      return false;
    }
  },

  /**
   * Check if any screen reader is enabled
   */
  async isScreenReaderEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.error('Error checking screen reader status:', error);
      return false;
    }
  },

  /**
   * Check if bold text is enabled
   */
  async isBoldTextEnabled(): Promise<boolean> {
    try {
      // This might not be available on all platforms
      return true; // Default to false, implement platform-specific checks if available
    } catch (error) {
      console.error('Error checking bold text status:', error);
      return false;
    }
  },

  /**
   * Check if reduce motion is enabled
   */
  async isReduceMotionEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch (error) {
      console.error('Error checking reduce motion status:', error);
      return false;
    }
  },

  /**
   * Check if reduce transparency is enabled
   */
  async isReduceTransparencyEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isReduceTransparencyEnabled();
    } catch (error) {
      console.error('Error checking reduce transparency status:', error);
      return false;
    }
  },

  /**
   * Check if invert colors is enabled
   */
  async isInvertColorsEnabled(): Promise<boolean> {
    try {
      // This might not be available on all platforms
      return false; // Default to false, implement platform-specific checks if available
    } catch (error) {
      console.error('Error checking invert colors status:', error);
      return false;
    }
  },

  /**
   * Get all enabled accessibility features
   */
  async getEnabledFeatures(): Promise<string[]> {
    const features: string[] = [];

    try {
      const [screenReader, reduceMotion, reduceTransparency] = await Promise.all([
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isReduceMotionEnabled(),
        AccessibilityInfo.isReduceTransparencyEnabled(),
      ]);

      if (screenReader) features.push('screen-reader');
      if (reduceMotion) features.push('reduce-motion');
      if (reduceTransparency) features.push('reduce-transparency');
    } catch (error) {
      console.error('Error getting accessibility features:', error);
    }

    return features;
  },
};

// Screen reader announcement manager
export class AnnouncementManager {
  private static instance: AnnouncementManager;
  private announcements: ScreenReaderEvent[] = [];
  private queue: ScreenReaderEvent[] = [];
  private isAnnouncing = false;
  private listeners: Set<(event: ScreenReaderEvent) => void> = new Set();

  private constructor() {}

  static getInstance(): AnnouncementManager {
    if (!AnnouncementManager.instance) {
      AnnouncementManager.instance = new AnnouncementManager();
    }
    return AnnouncementManager.instance;
  }

  /**
   * Add a listener for screen reader announcements
   */
  addListener(listener: (event: ScreenReaderEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (event: ScreenReaderEvent) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Announce a message to the screen reader
   */
  async announce(
    message: string,
    options: AnnouncementOptions = {}
  ): Promise<string> {
    const event: ScreenReaderEvent = {
      id: this.generateId(),
      message: this.formatMessage(message),
      type: options.type || 'announcement',
      priority: options.priority || 'normal',
      timestamp: Date.now(),
    };

    // Add to announcements history
    this.announcements.unshift(event);
    if (this.announcements.length > 100) {
      this.announcements = this.announcements.slice(0, 100);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(event));

    if (options.debug) {
      console.log(`[Screen Reader Debug] ${event.type}:`, event.message);
    }

    // If queue is enabled, add to queue
    if (options.queue) {
      this.addToQueue(event);
      return event.id;
    }

    // Otherwise announce immediately
    return this.performAnnouncement(event);
  }

  /**
   * Add announcement to queue
   */
  private addToQueue(event: ScreenReaderEvent): void {
    this.queue.push(event);
    this.processQueue();
  }

  /**
   * Process the announcement queue
   */
  private async processQueue(): Promise<void> {
    if (this.isAnnouncing || this.queue.length === 0) return;

    this.isAnnouncing = true;

    const event = this.queue.shift()!;
    await this.performAnnouncement(event);

    this.isAnnouncing = false;

    // Process next announcement after a small delay
    setTimeout(() => this.processQueue(), 300);
  }

  /**
   * Perform the actual announcement
   */
  private async performAnnouncement(event: ScreenReaderEvent): Promise<string> {
    try {
      if (!await ScreenReader.isScreenReaderEnabled()) {
        if (Platform.OS === 'web') {
          // Web implementation
          const liveRegion = document.createElement('div');
          liveRegion.setAttribute('aria-live', event.type);
          liveRegion.setAttribute('aria-atomic', 'true');
          liveRegion.style.position = 'absolute';
          liveRegion.style.left = '-10000px';
          liveRegion.style.width = '1px';
          liveRegion.style.height = '1px';
          liveRegion.style.overflow = 'hidden';

          document.body.appendChild(liveRegion);
          liveRegion.textContent = event.message;

          // Remove after announcement
          setTimeout(() => document.body.removeChild(liveRegion), 1000);
        } else {
          // Mobile implementation - log to console for debugging
          if (__DEV__) {
            console.log(`[Screen Reader Announcement] ${event.type}:`, event.message);
          }
        }
      }
    } catch (error) {
      console.error('Error performing screen reader announcement:', error);
    }

    return event.id;
  }

  /**
   * Format message for screen reader
   */
  private formatMessage(message: string): string {
    return message
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .replace(/[<>]/g, ''); // Remove potentially problematic characters
  }

  /**
   * Generate unique ID for announcement
   */
  private generateId(): string {
    return `sr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get announcement history
   */
  getAnnouncements(): ScreenReaderEvent[] {
    return [...this.announcements];
  }

  /**
   * Clear announcements history
   */
  clearAnnouncements(): void {
    this.announcements = [];
    this.queue = [];
    this.isAnnouncing = false;
  }

  /**
   * Cancel all queued announcements
   */
  cancelQueuedAnnouncements(): void {
    this.queue = [];
    this.isAnnouncing = false;
  }
}

// Create singleton instance
const announcementManager = AnnouncementManager.getInstance();

// Screen reader utility functions
export const ScreenReaderUtils = {
  /**
   * Announce a message to the screen reader
   */
  announce: (
    message: string,
    options?: AnnouncementOptions
  ) => announcementManager.announce(message, options),

  /**
   * Announce an error message
   */
  announceError: (message: string, options?: AnnouncementOptions) =>
    announcementManager.announce(`Error: ${message}`, {
      type: 'alert',
      priority: 'high',
      ...options,
    }),

  /**
   * Announce a success message
   */
  announceSuccess: (message: string, options?: AnnouncementOptions) =>
    announcementManager.announce(`Success: ${message}`, {
      type: 'polite',
      priority: 'normal',
      ...options,
    }),

  /**
   * Announce a warning message
   */
  announceWarning: (message: string, options?: AnnouncementOptions) =>
    announcementManager.announce(`Warning: ${message}`, {
      type: 'assertive',
      priority: 'normal',
      ...options,
    }),

  /**
   * Announce a status update
   */
  announceStatus: (message: string, options?: AnnouncementOptions) =>
    announcementManager.announce(message, {
      type: 'status',
      priority: 'low',
      ...options,
    }),

  /**
   * Announce form field validation errors
   */
  announceValidationError: (fieldName: string, errorMessage: string) =>
    announcementManager.announce(
      `${fieldName} field has an error: ${errorMessage}`,
      {
        type: 'alert',
        priority: 'high',
      }
    ),

  /**
   * Announce form field completion
   */
  announceFieldCompletion: (fieldName: string) =>
    announcementManager.announce(`${fieldName} field completed`, {
      type: 'status',
      priority: 'low',
    }),

  /**
   * Announce page navigation
   */
  announceNavigation: (pageName: string) =>
    announcementManager.announce(`Navigated to ${pageName}`, {
      type: 'assertive',
      priority: 'high',
    }),

  /**
   * Announce state changes
   */
  announceStateChange: (elementName: string, newState: string) =>
    announcementManager.announce(`${elementName} is now ${newState}`, {
      type: 'status',
      priority: 'normal',
    }),

  /**
   * Announce timer or countdown
   */
  announceTimer: (time: string) =>
    announcementManager.announce(`Time remaining: ${time}`, {
      type: 'status',
      priority: 'normal',
    }),

  /**
   * Announce progress
   */
  announceProgress: (current: number, total: number) =>
    announcementManager.announce(
      `Progress: ${current} out of ${total} items completed`,
      {
        type: 'status',
        priority: 'low',
      }
    ),

  /**
   * Announce list item selection
   */
  announceListItemSelected: (item: string, listName?: string) =>
    announcementManager.announce(
      `${item} selected${listName ? ` in ${listName}` : ''}`,
      {
        type: 'assertive',
        priority: 'normal',
      }
    ),

  /**
   * Announce item availability
   */
  announceItemAvailability: (itemName: string, available: boolean) =>
    announcementManager.announce(
      `${itemName} is ${available ? 'available' : 'unavailable'}`,
      {
        type: 'status',
        priority: 'normal',
      }
    ),

  /**
   * Announce search results
   */
  announceSearchResults: (count: number, searchTerm: string) =>
    announcementManager.announce(
      `Found ${count} results for ${searchTerm}`,
      {
        type: 'status',
        priority: 'normal',
      }
    ),

  /**
   * Add a listener for screen reader announcements
   */
  addListener: (listener: (event: ScreenReaderEvent) => void) =>
    announcementManager.addListener(listener),

  /**
   * Remove a listener
   */
  removeListener: (listener: (event: ScreenReaderEvent) => void) =>
    announcementManager.removeListener(listener),

  /**
   * Get announcement history
   */
  getAnnouncements: () => announcementManager.getAnnouncements(),

  /**
   * Clear announcements history
   */
  clearAnnouncements: () => announcementManager.clearAnnouncements(),

  /**
   * Cancel all queued announcements
   */
  cancelQueuedAnnouncements: () =>
    announcementManager.cancelQueuedAnnouncements(),
};

// Smart announcement system that delays announcements
export class SmartAnnouncementSystem {
  private announcementTimer: NodeJS.Timeout | null = null;
  private lastAnnouncementTime = 0;
  private debounceDelay = 1000;

  /**
   * Debounce announcements to avoid overwhelming screen readers
   */
  debounceAnnounce(
    message: string,
    options: AnnouncementOptions = {}
  ): string {
    // Clear existing timer
    if (this.announcementTimer) {
      clearTimeout(this.announcementTimer);
    }

    // Get current time
    const now = Date.now();
    const timeSinceLast = now - this.lastAnnouncementTime;

    // If enough time has passed, announce immediately
    if (timeSinceLast > this.debounceDelay) {
      this.lastAnnouncementTime = now;
      return ScreenReaderUtils.announce(message, options);
    }

    // Otherwise, debounce
    const id = `debounced-${Date.now()}`;
    this.announcementTimer = setTimeout(() => {
      this.lastAnnouncementTime = Date.now();
      ScreenReaderUtils.announce(message, options);
    }, this.debounceDelay - timeSinceLast);

    return id;
  }

  /**
   * Cancel any pending announcements
   */
  cancelPending(): void {
    if (this.announcementTimer) {
      clearTimeout(this.announcementTimer);
      this.announcementTimer = null;
    }
  }
}

// Create singleton instance
const smartAnnouncementSystem = new SmartAnnouncementSystem();

// Export smart announcement utilities
export const SmartAnnouncements = {
  debounceAnnounce: (
    message: string,
    options?: AnnouncementOptions
  ) => smartAnnouncementSystem.debounceAnnounce(message, options),

  cancelPending: () => smartAnnouncementSystem.cancelPending(),
};

// Accessibility constants
export const AccessibilityConstants = {
  MIN_ANNOUNCEMENT_DELAY: 300,
  MAX_ANNOUNCEMENT_HISTORY: 100,
  DEBOUNCE_DELAY: 1000,
  ANNOUNCEMENT_TYPES: {
    ANNOUNCEMENT: 'announcement',
    ASSERTIVE: 'assertive',
    POLITE: 'polite',
    STATUS: 'status',
    ALERT: 'alert',
    LOG: 'log',
  } as const,
  PRIORITIES: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
  } as const,
};

// Export for backward compatibility
export default ScreenReaderUtils;