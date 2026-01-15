/**
 * Web Notification Templates Service
 *
 * Notification templates and utilities for web push notifications.
 */

export type NotificationCategory =
  | 'daily_intention'
  | 'your_turn'
  | 'new_chapter'
  | 'partner_joined'
  | 'streak_reminder'
  | 'achievement'
  | 'weekly_summary'
  | 'question_of_day'
  | 'milestone';

export interface NotificationTemplate {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  tag?: string; // Prevents duplicate notifications
  requireInteraction?: boolean;
}

export interface ScheduleConfig {
  triggerDate?: Date;
  delayInSeconds?: number;
  repeats?: boolean;
  respectQuietHours?: boolean;
}

/**
 * Smart notification time suggestions
 */
export interface SmartTimeSuggestion {
  hour: number;
  label: string;
  reason: string;
  effectiveness: number;
}

export function getBestDailyIntentionTime(): SmartTimeSuggestion[] {
  return [
    { hour: 8, label: '8:00 AM', reason: 'Morning routine - start the day together', effectiveness: 0.85 },
    { hour: 9, label: '9:00 AM', reason: 'After breakfast - peaceful morning time', effectiveness: 0.82 },
    { hour: 7, label: '7:00 AM', reason: 'Early morning - before work starts', effectiveness: 0.78 },
    { hour: 12, label: '12:00 PM', reason: 'Lunch break - mid-day check-in', effectiveness: 0.65 },
    { hour: 20, label: '8:00 PM', reason: 'Evening - end of day reflection', effectiveness: 0.70 },
  ];
}

export function getBestTurnReminderTime(): SmartTimeSuggestion[] {
  return [
    { hour: 19, label: '7:00 PM', reason: 'Evening relaxation time', effectiveness: 0.80 },
    { hour: 20, label: '8:00 PM', reason: 'After dinner - prime writing time', effectiveness: 0.85 },
    { hour: 21, label: '9:00 PM', reason: 'Before bed - quiet reflection', effectiveness: 0.75 },
    { hour: 18, label: '6:00 PM', reason: 'After work - transition time', effectiveness: 0.70 },
  ];
}

/**
 * Notification templates for different categories
 */
export const NOTIFICATION_TEMPLATES: Record<
  NotificationCategory,
  (params?: Record<string, unknown>) => NotificationTemplate
> = {
  daily_intention: (params = {}) => ({
    id: `daily-intention-${Date.now()}`,
    category: 'daily_intention',
    title: '💕 Daily Intention Time!',
    body: (params.partnerName as string)
      ? `What do you want ${params.partnerName} to know today?`
      : 'What do you want your partner to know today?',
    icon: '/icon-192.png',
    tag: 'daily-intention',
    requireInteraction: false,
    data: { type: 'daily_intention', url: '/stories', ...params },
  }),

  your_turn: (params = {}) => ({
    id: `your-turn-${params.storyId || Date.now()}`,
    category: 'your_turn',
    title: '✍️ Your turn to write!',
    body: (params.storyTitle as string)
      ? `Continue your story "${params.storyTitle}"`
      : 'Your partner is waiting for your chapter!',
    icon: '/icon-192.png',
    tag: `your-turn-${params.storyId}`,
    requireInteraction: true,
    data: { type: 'your_turn', url: `/stories/${params.storyId}/write`, ...params },
  }),

  new_chapter: (params = {}) => ({
    id: `new-chapter-${params.chapterId || Date.now()}`,
    category: 'new_chapter',
    title: (params.partnerName as string)
      ? `📖 ${params.partnerName} wrote a new chapter!`
      : '📖 New chapter available!',
    body: (params.chapterTitle as string) || 'See what your partner wrote',
    icon: '/icon-192.png',
    tag: `new-chapter-${params.chapterId}`,
    requireInteraction: false,
    data: { type: 'new_chapter', url: `/stories/${params.storyId}/chapter/${params.chapterId}`, ...params },
  }),

  partner_joined: (params = {}) => ({
    id: `partner-joined-${Date.now()}`,
    category: 'partner_joined',
    title: '🎉 Your partner joined!',
    body: (params.partnerName as string)
      ? `${params.partnerName} is now ready to write with you!`
      : 'Your story partner has joined the app',
    icon: '/icon-192.png',
    tag: 'partner-joined',
    requireInteraction: true,
    data: { type: 'partner_joined', url: '/stories', ...params },
  }),

  streak_reminder: (params = {}) => ({
    id: `streak-reminder-${Date.now()}`,
    category: 'streak_reminder',
    title: `🔥 ${(params.streakCount as number) || 0} day streak!`,
    body: (params.streakCount as number) === 1
      ? 'Keep it going! Write today to maintain your streak.'
      : (params.streakCount as number) >= 7
      ? `Amazing! ${(params.streakCount as number)} days of writing together! Keep it up!`
      : "Don't break your streak! Write something today.",
    icon: '/icon-192.png',
    tag: 'streak-reminder',
    requireInteraction: false,
    data: { type: 'streak_reminder', url: '/stories', ...params },
  }),

  achievement: (params = {}) => ({
    id: `achievement-${params.achievementId || Date.now()}`,
    category: 'achievement',
    title: '🏆 Achievement Unlocked!',
    body: (params.achievementName as string) || 'You accomplished something amazing!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'achievement',
    requireInteraction: true,
    data: { type: 'achievement', url: '/stories', ...params },
  }),

  weekly_summary: (params = {}) => ({
    id: `weekly-summary-${Date.now()}`,
    category: 'weekly_summary',
    title: '📊 Your Weekly Story Summary',
    body: (params.chaptersWritten as number)
      ? `You wrote ${(params.chaptersWritten as number)} chapter${(params.chaptersWritten as number) > 1 ? 's' : ''} this week!`
      : 'Check out what you and your partner created this week',
    icon: '/icon-192.png',
    tag: 'weekly-summary',
    requireInteraction: false,
    data: { type: 'weekly_summary', url: '/stories', ...params },
  }),

  question_of_day: (params = {}) => ({
    id: `question-${Date.now()}`,
    category: 'question_of_day',
    title: '💭 Question of the Day',
    body: (params.question as string) || "What's a favorite memory you've shared together?",
    icon: '/icon-192.png',
    tag: 'question-of-day',
    requireInteraction: false,
    data: { type: 'question_of_day', url: '/stories', ...params },
  }),

  milestone: (params = {}) => ({
    id: `milestone-${Date.now()}`,
    category: 'milestone',
    title: '🎯 Relationship Milestone!',
    body: (params.milestoneTitle as string) || "You've reached a special moment in your journey",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'milestone',
    requireInteraction: true,
    data: { type: 'milestone', url: '/stories', ...params },
  }),
};

/**
 * Get personalized notification based on blueprint results
 */
export function getPersonalizedReminder(params: {
  relationshipStage?: string;
  communicationStyle?: string;
  loveLanguage?: string;
  partnerName?: string;
}): NotificationTemplate {
  const { relationshipStage, communicationStyle, loveLanguage, partnerName } = params;

  let title = '💕 Time to connect!';
  let body = 'What would you like to write about today?';

  if (relationshipStage === 'new_ldr') {
    title = '🌱 New Love Alert!';
    body = partnerName
      ? `Share a moment with ${partnerName} - what made you smile today?`
      : 'Share a moment - what made you smile today?';
  } else if (relationshipStage === 'veteran_ldr') {
    title = '🏆 Veterans of Love!';
    body = partnerName
      ? `${partnerName} is thinking of you - add to your story!`
      : 'Your partner is thinking of you - add to your story!';
  }

  if (communicationStyle === 'writer') {
    body = partnerName
      ? `${partnerName} would love to hear from you - write something today!`
      : 'Express yourself in writing today!';
  } else if (communicationStyle === 'talker') {
    title = '💬 Let\'s Talk!';
    body = 'Have something to say? Write it down for your partner!';
  } else if (communicationStyle === 'visual') {
    title = '🎨 Paint with Words!';
    body = partnerName
      ? `Create something beautiful for ${partnerName} today!`
      : 'Create something beautiful with your words today!';
  }

  if (loveLanguage === 'words') {
    title = '💕 Words of Affirmation';
    body = partnerName
      ? `What words does ${partnerName} need to hear from you?`
      : 'What loving words do you want to share today?';
  } else if (loveLanguage === 'time') {
    title = '⏰ Quality Time';
    body = 'Take a moment to write - your time together matters!';
  }

  return {
    id: `personalized-${Date.now()}`,
    category: 'daily_intention',
    title,
    body,
    icon: '/icon-192.png',
    tag: 'daily-intention',
    requireInteraction: false,
    data: { type: 'personalized_reminder', url: '/stories' },
  };
}

/**
 * Notification settings interface
 */
export interface NotificationSettings {
  enabled: boolean;
  dailyIntention: boolean;
  yourTurn: boolean;
  newChapter: boolean;
  partnerJoined: boolean;
  achievements: boolean;
  weeklySummary: boolean;
  quietHours: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  dailyIntentionHour: number;
}

/**
 * Default notification settings
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  dailyIntention: true,
  yourTurn: true,
  newChapter: true,
  partnerJoined: true,
  achievements: true,
  weeklySummary: false,
  quietHours: {
    enabled: false,
    startHour: 22,
    endHour: 8,
  },
  dailyIntentionHour: 9,
};

/**
 * Check if browser supports notifications
 */
export function checkNotificationSupport(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'denied';
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!checkNotificationSupport()) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
}

/**
 * Show a local notification immediately
 */
export function showNotification(template: NotificationTemplate): void {
  if (!checkNotificationSupport() || Notification.permission !== 'granted') {
    return;
  }

  const options: NotificationOptions = {
    body: template.body,
    icon: template.icon || '/icon-192.png',
    badge: template.badge || '/icon-192.png',
    tag: template.tag,
    requireInteraction: template.requireInteraction,
    data: template.data,
  };

  new Notification(template.title, options);
}

/**
 * Format hour to readable time
 */
export function formatTime(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}
