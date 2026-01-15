/**
 * Notification Templates Service
 *
 * Pre-defined notification templates for various app events.
 * Provides consistent messaging and smart timing for notifications.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

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
  data?: Record<string, unknown>;
  priority?: 'high' | 'normal' | 'low';
  sound?: 'default' | 'default_critical' | 'special';
  channelId?: string;
}

export interface ScheduleConfig {
  // When to schedule
  triggerDate?: Date;
  delayInSeconds?: number;
  trigger?: Notifications.NotificationTriggerInput;

  // Scheduling behavior
  repeats?: boolean;
  allowWhileIdle?: boolean;

  // Smart scheduling
  respectQuietHours?: boolean;
  respectUserTimezone?: boolean;
}

/**
 * Smart notification time suggestions based on user behavior
 */
export interface SmartTimeSuggestion {
  hour: number;
  reason: string;
  effectiveness: number; // 0-1 score
}

/**
 * Get best time to send daily intention reminder
 * based on user's typical activity patterns
 */
export function getBestDailyIntentionTime(): SmartTimeSuggestion[] {
  return [
    { hour: 8, reason: 'Morning routine - start the day together', effectiveness: 0.85 },
    { hour: 9, reason: 'After breakfast - peaceful morning time', effectiveness: 0.82 },
    { hour: 7, reason: 'Early morning - before work starts', effectiveness: 0.78 },
    { hour: 12, reason: 'Lunch break - mid-day check-in', effectiveness: 0.65 },
    { hour: 20, reason: 'Evening - end of day reflection', effectiveness: 0.70 },
  ];
}

/**
 * Get best time for turn reminders
 */
export function getBestTurnReminderTime(): SmartTimeSuggestion[] {
  return [
    { hour: 19, reason: 'Evening relaxation time', effectiveness: 0.80 },
    { hour: 20, reason: 'After dinner - prime writing time', effectiveness: 0.85 },
    { hour: 21, reason: 'Before bed - quiet reflection', effectiveness: 0.75 },
    { hour: 18, reason: 'After work - transition time', effectiveness: 0.70 },
  ];
}

/**
 * Notification templates for different categories
 */
export const NOTIFICATION_TEMPLATES: Record<NotificationCategory, (params?: any) => NotificationTemplate> = {
  daily_intention: (params = {}) => ({
    id: `daily-intention-${Date.now()}`,
    category: 'daily_intention',
    title: '💕 Daily Intention Time!',
    body: params.partnerName
      ? `What do you want ${params.partnerName} to know today?`
      : 'What do you want your partner to know today?',
    data: { type: 'daily_intention', screen: 'home', ...params },
    priority: 'high',
    sound: 'default',
    channelId: 'daily-intentions',
  }),

  your_turn: (params = {}) => ({
    id: `your-turn-${params.storyId || Date.now()}`,
    category: 'your_turn',
    title: '✍️ Your turn to write!',
    body: params.storyTitle
      ? `Continue your story "${params.storyTitle}"`
      : 'Your partner is waiting for your chapter!',
    data: { type: 'your_turn', storyId: params.storyId, screen: 'write', ...params },
    priority: 'high',
    sound: 'default',
    channelId: 'story-updates',
  }),

  new_chapter: (params = {}) => ({
    id: `new-chapter-${params.chapterId || Date.now()}`,
    category: 'new_chapter',
    title: params.partnerName
      ? `📖 ${params.partnerName} wrote a new chapter!`
      : '📖 New chapter available!',
    body: params.chapterTitle || 'See what your partner wrote',
    data: { type: 'new_chapter', chapterId: params.chapterId, storyId: params.storyId, screen: 'chapter', ...params },
    priority: 'normal',
    sound: 'default',
    channelId: 'story-updates',
  }),

  partner_joined: (params = {}) => ({
    id: `partner-joined-${Date.now()}`,
    category: 'partner_joined',
    title: '🎉 Your partner joined!',
    body: params.partnerName
      ? `${params.partnerName} is now ready to write with you!`
      : 'Your story partner has joined the app',
    data: { type: 'partner_joined', screen: 'home', ...params },
    priority: 'high',
    sound: 'default',
    channelId: 'partner-activity',
  }),

  streak_reminder: (params = {}) => ({
    id: `streak-reminder-${Date.now()}`,
    category: 'streak_reminder',
    title: `🔥 ${params.streakCount || 0} day streak!`,
    body: params.streakCount === 1
      ? 'Keep it going! Write today to maintain your streak.'
      : params.streakCount && params.streakCount >= 7
      ? `Amazing! ${params.streakCount} days of writing together! Keep it up!`
      : "Don't break your streak! Write something today.",
    data: { type: 'streak_reminder', screen: 'home', ...params },
    priority: 'normal',
    sound: 'default',
    channelId: 'reminders',
  }),

  achievement: (params = {}) => ({
    id: `achievement-${params.achievementId || Date.now()}`,
    category: 'achievement',
    title: '🏆 Achievement Unlocked!',
    body: params.achievementName || 'You accomplished something amazing!',
    data: { type: 'achievement', screen: 'achievements', ...params },
    priority: 'high',
    sound: 'default_critical',
    channelId: 'achievements',
  }),

  weekly_summary: (params = {}) => ({
    id: `weekly-summary-${Date.now()}`,
    category: 'weekly_summary',
    title: '📊 Your Weekly Story Summary',
    body: params.chaptersWritten
      ? `You wrote ${params.chaptersWritten} chapter${params.chaptersWritten > 1 ? 's' : ''} this week!`
      : 'Check out what you and your partner created this week',
    data: { type: 'weekly_summary', screen: 'summary', ...params },
    priority: 'low',
    sound: 'default',
    channelId: 'summaries',
  }),

  question_of_day: (params = {}) => ({
    id: `question-${Date.now()}`,
    category: 'question_of_day',
    title: '💭 Question of the Day',
    body: params.question || 'What\'s a favorite memory you\'ve shared together?',
    data: { type: 'question_of_day', screen: 'home', ...params },
    priority: 'normal',
    sound: 'default',
    channelId: 'daily-questions',
  }),

  milestone: (params = {}) => ({
    id: `milestone-${Date.now()}`,
    category: 'milestone',
    title: '🎯 Relationship Milestone!',
    body: params.milestoneTitle || 'You\'ve reached a special moment in your journey',
    data: { type: 'milestone', screen: 'milestones', ...params },
    priority: 'high',
    sound: 'default_critical',
    channelId: 'milestones',
  }),
};

/**
 * Get personalized notification based on user's blueprint results
 */
export function getPersonalizedReminder(params: {
  relationshipStage?: string;
  communicationStyle?: string;
  loveLanguage?: string;
  partnerName?: string;
}): NotificationTemplate {
  const { relationshipStage, communicationStyle, loveLanguage, partnerName } = params;

  // Customize based on relationship stage
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

  // Customize based on communication style
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

  // Customize based on love language
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
    data: { type: 'personalized_reminder', screen: 'home' },
    priority: 'high',
    sound: 'default',
    channelId: 'daily-intentions',
  };
}

/**
 * Android notification channels configuration
 */
export const NOTIFICATION_CHANNELS = [
  {
    id: 'daily-intentions',
    name: 'Daily Intentions',
    description: 'Reminders to set your daily intention',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#E91E63',
  },
  {
    id: 'story-updates',
    name: 'Story Updates',
    description: 'When your partner writes or it\'s your turn',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#9C27B0',
  },
  {
    id: 'partner-activity',
    name: 'Partner Activity',
    description: 'When your partner joins or is active',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 100, 250],
    lightColor: '#4CAF50',
  },
  {
    id: 'reminders',
    name: 'Reminders',
    description: 'Gentle reminders to keep your streak going',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 150],
    lightColor: '#FF9800',
  },
  {
    id: 'achievements',
    name: 'Achievements',
    description: 'When you unlock an achievement',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 100, 50, 100, 50, 200],
    lightColor: '#FFC107',
  },
  {
    id: 'milestones',
    name: 'Milestones',
    description: 'Special relationship milestones',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 100, 50, 100, 50, 100, 50, 250],
    lightColor: '#E91E63',
  },
  {
    id: 'daily-questions',
    name: 'Daily Questions',
    description: 'Question of the day notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200],
    lightColor: '#2196F3',
  },
  {
    id: 'summaries',
    name: 'Weekly Summaries',
    description: 'Weekly activity summaries',
    importance: Notifications.AndroidImportance.LOW,
    vibrationPattern: [0, 100],
    lightColor: '#00BCD4',
  },
];

/**
 * Setup notification channels for Android
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync('daily-intentions', {
      ...NOTIFICATION_CHANNELS[0],
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('story-updates', {
      ...NOTIFICATION_CHANNELS[1],
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('partner-activity', {
      ...NOTIFICATION_CHANNELS[2],
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      ...NOTIFICATION_CHANNELS[3],
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('achievements', {
      ...NOTIFICATION_CHANNELS[4],
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('milestones', {
      ...NOTIFICATION_CHANNELS[5],
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('daily-questions', {
      ...NOTIFICATION_CHANNELS[6],
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('summaries', {
      ...NOTIFICATION_CHANNELS[7],
      enableVibrate: true,
      showBadge: true,
    });

    console.log('[NotificationChannels] All channels set up successfully');
  } catch (error) {
    console.error('[NotificationChannels] Failed to set up channels:', error);
  }
}
