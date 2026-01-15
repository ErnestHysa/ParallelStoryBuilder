import { Platform, Alert } from 'react-native';
import * as Analytics from './analytics';

// Social media platforms with specific requirements
export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  packageName?: string; // Android deep link
  urlScheme?: string; // iOS deep link
  supportedAspectRatio: ('story' | 'square' | 'portrait')[];
  hashtags?: string[];
  mention?: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'camera',
    urlScheme: 'instagram://',
    packageName: 'com.instagram.android',
    supportedAspectRatio: ['story', 'square', 'portrait'],
    hashtags: ['ParallelStoryBuilder', 'LoveStory', 'LDR', 'LongDistanceLove'],
    mention: '@parallelstorybuilder',
  },
  {
    id: 'instagram_stories',
    name: 'Instagram Stories',
    icon: 'camera',
    urlScheme: 'instagram-story://',
    packageName: 'com.instagram.android',
    supportedAspectRatio: ['story'],
    hashtags: ['ParallelStoryBuilder', 'LoveStory', 'LDR'],
    mention: '@parallelstorybuilder',
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    icon: 'twitter',
    urlScheme: 'twitter://',
    packageName: 'com.twitter.android',
    supportedAspectRatio: ['square', 'portrait'],
    hashtags: ['LoveStory', 'LDR', 'LongDistanceRelationship'],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    urlScheme: 'fb://',
    packageName: 'com.facebook.katana',
    supportedAspectRatio: ['square', 'portrait'],
    hashtags: ['ParallelStoryBuilder', 'LoveStory'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'music',
    urlScheme: 'tiktok://',
    packageName: 'com.zhiliaoapp.musically',
    supportedAspectRatio: ['story', 'portrait'],
    hashtags: ['LoveStory', 'LDR', 'LongDistance', 'RelationshipGoals'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'message-circle',
    urlScheme: 'whatsapp://',
    packageName: 'com.whatsapp',
    supportedAspectRatio: ['story', 'square', 'portrait'],
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: 'message-square',
    supportedAspectRatio: ['story', 'square', 'portrait'],
  },
];

// Share text templates
export const SHARE_TEMPLATES = {
  quote: [
    'Writing our love story, one chapter at a time 💕',
    'Distance means nothing when someone means everything 💫',
    'Our story continues... 📖✨',
    'Every chapter with you is my favorite 💌',
    'Building a love that transcends distance 🌍',
  ],
  milestone: [
    'We\'ve written {count} chapters together! Here\'s to many more 📚💕',
    '{count} chapters of our love story. Distance can\'t stop us ✨',
    'Celebrating {count} chapters of our journey together 🎉',
  ],
  illustrated: [
    'Our love story, beautifully written 💕',
    'The best chapter is the one we\'re writing together ✨',
    'Distance separates us, but stories bring us closer 📖',
  ],
};

// Get random share text
export function getShareText(style: keyof typeof SHARE_TEMPLATES, vars?: Record<string, string>): string {
  const templates = SHARE_TEMPLATES[style];
  let text = templates[Math.floor(Math.random() * templates.length)];

  // Replace variables
  if (vars) {
    Object.entries(vars).forEach(([key, value]) => {
      text = text.replace(`{${key}}`, value);
    });
  }

  return text;
}

// Format hashtags
export function formatHashtags(hashtags: string[]): string {
  return hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
}

// Complete share message
export function createShareMessage(
  style: keyof typeof SHARE_TEMPLATES,
  platform: SocialPlatform,
  vars?: Record<string, string>
): string {
  const text = getShareText(style, vars);
  const hashtags = platform.hashtags ? formatHashtags(platform.hashtags) : '';
  const mention = platform.mention || '';

  return [text, mention, hashtags].filter(Boolean).join('\n\n');
}

// Check if app is installed
export async function isAppAvailable(platform: SocialPlatform): Promise<boolean> {
  try {
    // For now, return true - we'll use the native share sheet which handles this
    // In a full implementation, you'd use Linking.canOpenURL()
    return true;
  } catch {
    return false;
  }
}

// Track share event
export function trackShare(
  platform: string,
  cardStyle: string,
  storyId: string
): void {
  try {
    Analytics.trackEvent('story_card_shared', {
      platform,
      card_style: cardStyle,
      story_id: storyId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking share:', error);
  }
}

// Track card generation
export function trackCardGeneration(
  cardStyle: string,
  aspectRatio: string,
  storyId: string
): void {
  try {
    Analytics.trackEvent('story_card_generated', {
      card_style: cardStyle,
      aspect_ratio: aspectRatio,
      story_id: storyId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking card generation:', error);
  }
}

// Share error handling
export function handleShareError(error: unknown): void {
  console.error('Share error:', error);

  const message = error instanceof Error ? error.message : 'Failed to share card';

  Alert.alert(
    'Share Failed',
    'Unable to share your card. Please try again or save it to your gallery instead.',
    [
      { text: 'OK', style: 'default' },
    ]
  );
}

// Share success callback
export function handleShareSuccess(
  platform: string,
  cardStyle: string,
  storyId: string
): void {
  trackShare(platform, cardStyle, storyId);

  // Show subtle success feedback
  // In a full implementation, you might show a toast or haptic feedback
}

// Get recommended platforms based on aspect ratio
export function getRecommendedPlatforms(aspectRatio: 'story' | 'square' | 'portrait'): SocialPlatform[] {
  return SOCIAL_PLATFORMS.filter(platform =>
    platform.supportedAspectRatio.includes(aspectRatio)
  );
}

// Platform-specific tips
export function getPlatformTips(platformId: string): string[] {
  const tips: Record<string, string[]> = {
    instagram: [
      'Tag your partner for extra engagement',
      'Use Stories for more visibility',
      'Save as Reel for music option',
    ],
    instagram_stories: [
      'Add music before sharing',
      'Use the link sticker to drive traffic',
      'Post when your partner is online for reaction',
    ],
    twitter: [
      'Keep text under 280 characters',
      'Thread multiple cards for impact',
      'Tag us for a retweet',
    ],
    facebook: [
      'First comment works best for hashtags',
      'Share to your story too',
      'Create a photo album for journey',
    ],
    tiktok: [
      'Add trending audio',
      'Use transition effects',
      'Post in evening for better reach',
    ],
    whatsapp: [
      'Great for sharing with close friends',
      'Send to family for updates',
    ],
    messages: [
      'Perfect for personal touch',
      'Your partner will love it',
    ],
  };

  return tips[platformId] || [];
}

// Export analytics helper
export const ShareAnalytics = {
  trackShare,
  trackCardGeneration,
  handleShareSuccess,
  handleShareError,
};
