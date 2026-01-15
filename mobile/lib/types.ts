import { User } from '@supabase/supabase-js';

// Type aliases
export type Theme = 'romance' | 'fantasy' | 'our_future';
export type StoryStatus = 'active' | 'paused' | 'completed';
export type MemberRole = 'creator' | 'partner';

// Database table interfaces
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  blueprint_data?: QuizResult | null;
  referral_code?: string | null;
  referred_by?: string | null;
  referral_count?: number;
  created_at: string;
}

export interface Story {
  id: string;
  title: string;
  theme: Theme;
  created_by: string;
  pairing_code: string;
  status: StoryStatus;
  current_turn: string | null;
  created_at: string;
}

export interface StoryMember {
  story_id: string;
  user_id: string;
  role: MemberRole;
  turn_order: 1 | 2 | null;
  joined_at: string;
}

export interface Chapter {
  id: string;
  story_id: string;
  author_id: string;
  chapter_number: number;
  content: string;
  ai_enhanced_content: string | null;
  context_snippet: string | null;
  created_at: string;
  media?: ChapterMedia[];
}

export interface Inspiration {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
  media?: Media[];
}

// Composite types for queries
export interface StoryWithMembers extends Story {
  members: (StoryMember & {
    profile: Profile;
  })[];
  chapters?: Chapter[];
  updated_at?: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  session: string | null;
  loading: boolean;
}

// Database type for Supabase client
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      stories: {
        Row: Story;
        Insert: Omit<Story, 'id' | 'created_at'>;
        Update: Partial<Omit<Story, 'id' | 'created_at'>>;
      };
      story_members: {
        Row: StoryMember;
        Insert: Omit<StoryMember, 'joined_at'>;
        Update: Partial<Omit<StoryMember, 'joined_at'>>;
      };
      chapters: {
        Row: Chapter;
        Insert: Omit<Chapter, 'id' | 'created_at'>;
        Update: Partial<Omit<Chapter, 'id' | 'created_at'>>;
      };
      inspirations: {
        Row: Inspiration;
        Insert: Omit<Inspiration, 'id' | 'created_at'>;
        Update: Partial<Omit<Inspiration, 'id' | 'created_at'>>;
      };
      relationships: {
        Row: {
          id: string;
          story_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          story_id: string;
        };
        Update: Partial<{
          story_id: string;
        }>;
      };
      daily_intentions: {
        Row: DailyIntention;
        Insert: Omit<DailyIntention, 'id'>;
        Update: Partial<Omit<DailyIntention, 'id'>>;
      };
      relationship_questions: {
        Row: RelationshipQuestion;
        Insert: Omit<RelationshipQuestion, 'id'>;
        Update: Partial<Omit<RelationshipQuestion, 'id'>>;
      };
      relationship_milestones: {
        Row: RelationshipMilestone;
        Insert: Omit<RelationshipMilestone, 'id'>;
        Update: Partial<Omit<RelationshipMilestone, 'id'>>;
      };
      user_tokens: {
        Row: UserTokens;
        Insert: Omit<UserTokens, 'user_id'>;
        Update: Partial<UserTokens>;
      };
      token_transactions: {
        Row: TokenTransaction;
        Insert: Omit<TokenTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<TokenTransaction, 'id' | 'created_at'>>;
      };
      user_achievements: {
        Row: UserAchievement;
        Insert: Omit<UserAchievement, 'id' | 'achieved_at'>;
        Update: Partial<Omit<UserAchievement, 'id' | 'achieved_at'>>;
      };
      writing_streaks: {
        Row: WritingStreak;
        Insert: WritingStreak;
        Update: Partial<WritingStreak>;
      };
      chapter_media: {
        Row: ChapterMedia;
        Insert: Omit<ChapterMedia, 'id' | 'created_at'>;
        Update: Partial<Omit<ChapterMedia, 'id' | 'created_at'>>;
      };
      story_characters: {
        Row: StoryCharacter;
        Insert: Omit<StoryCharacter, 'id' | 'created_by'>;
        Update: Partial<Omit<StoryCharacter, 'id' | 'created_by'>>;
      };
      presence: {
        Row: Presence;
        Insert: Presence;
        Update: Partial<Presence>;
      };
      push_tokens: {
        Row: PushToken;
        Insert: Omit<PushToken, 'created_at'>;
        Update: Partial<Omit<PushToken, 'created_at'>>;
      };
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: Omit<AnalyticsEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<AnalyticsEvent, 'id' | 'created_at'>>;
      };
      offline_actions: {
        Row: OfflineAction;
        Insert: OfflineAction;
        Update: Partial<OfflineAction>;
      };
      user_preferences: {
        Row: UserPreferencesFull;
        Insert: Partial<UserPreferencesFull>;
        Update: Partial<UserPreferencesFull>;
      };
      ai_usage: {
        Row: AIUsageRecord;
        Insert: Omit<AIUsageRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<AIUsageRecord, 'id' | 'created_at'>>;
      };
      referrals: {
        Row: Referral;
        Insert: Omit<Referral, 'id' | 'created_at'>;
        Update: Partial<Referral>;
      };
      gift_codes: {
        Row: GiftCode;
        Insert: Omit<GiftCode, 'id' | 'created_at'>;
        Update: Partial<GiftCode>;
      };
      gifts: {
        Row: Gift;
        Insert: Omit<Gift, 'id' | 'created_at'>;
        Update: Partial<Gift>;
      };
    };
  };
};

// Relationship types
export interface DailyIntention {
  id: string;
  relationship_id: string;
  intention: string;
  partner_intention: string | null;
  streak_count: number;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

export interface RelationshipQuestion {
  id: string;
  relationship_id: string;
  question_text: string;
  user_answer: string | null;
  partner_answer: string | null;
  is_daily: boolean;
  date: string;
  revealed_at: string | null;
  created_at: string;
}

export interface RelationshipMilestone {
  id: string;
  relationship_id: string;
  title: string;
  description: string;
  date: string;
  category: 'personal' | 'relationship' | 'story' | 'achievement';
  photos: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Presence & Real-time
export type PresenceStatus = 'online' | 'offline' | 'away' | 'writing';
export interface Presence {
  user_id: string;
  story_id: string;
  status: PresenceStatus;
  last_seen: string;
}

// Tokens & Monetization
export type TransactionType = 'purchase' | 'spend' | 'bonus' | 'gift';
export interface UserTokens {
  user_id: string;
  balance: number;
  purchased_total: number;
  last_earned_at: string;
}
export interface TokenTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  feature_type: string | null;
  created_at: string;
}

// Relationships
export type RelationshipStatus = 'active' | 'paused' | 'ended';
export interface Relationship {
  id: string;
  user1_id: string;
  user2_id: string;
  status: RelationshipStatus;
  started_at: string;
}

// Gamification
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achieved_at: string;
  metadata?: Record<string, unknown>;
}
export interface WritingStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_write_date: string | null;
}

// Media
export type MediaType = 'image' | 'audio' | 'video';
export interface ChapterMedia {
  id: string;
  chapter_id: string;
  type: MediaType;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
}

// Generic Media type for attachments
export interface Media {
  id?: string;
  uri: string;
  type: MediaType;
  title?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  uploadedAt?: string | number;
}

// Story Characters
export interface StoryCharacter {
  id: string;
  story_id: string;
  user_id?: string;
  name: string;
  description: string | null;
  personality_traits: Record<string, unknown> | null;
  first_appearance_chapter: number | null;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  age?: string | null;
  gender?: string | null;
  avatar_url?: string | null;
  style?: 'realistic' | 'cartoon' | 'anime' | 'fantasy';
}

// Notifications
export type NotificationPreferenceKey = 'new_chapter' | 'partner_joined' | 'ai_reminder' | 'daily_intention' | 'weekly_highlights';
export interface NotificationPreferences {
  new_chapter: boolean;
  partner_joined: boolean;
  ai_reminder: boolean;
  daily_intention: boolean;
  weekly_highlights: boolean;
}

// Extended types
export type ContentFormat = 'plain' | 'rich' | 'markdown';
export interface RichTextContent {
  type: string;
  children: unknown[];
}
export interface ExtendedChapter extends Chapter {
  content_rich?: RichTextContent | null;
  content_format?: ContentFormat;
  language?: string;
  media?: ChapterMedia[];
}
export interface UserPreferences {
  theme: 'auto' | 'light' | 'dark';
  language: string;
  notifications: NotificationPreferences;
  privacy: { show_online_status: boolean; allow_story_sharing: boolean };
  writing: {
    length_preference: 'short' | 'medium' | 'long';
    genre_affinity: string[];
    writing_time: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

// Onboarding
export type OnboardingStep = 'welcome' | 'blueprint' | 'partner' | 'complete';

// Re-export Quiz types from blueprintQuiz for convenience
export type {
  QuizAnswer,
  QuizQuestion,
  QuizResult,
  QuizOption,
  ThemeRecommendation,
  QuizRecommendation,
} from './blueprintQuiz';

// Legacy alias for RelationshipBlueprint - matches QuizResult structure
export interface RelationshipBlueprint {
  relationshipStage: 'new_ldr' | 'established_ldr' | 'veteran_ldr';
  communicationStyle: 'writer' | 'talker' | 'visual' | 'shared_experience';
  loveLanguage: 'words' | 'time' | 'gifts' | 'touch' | 'acts';
  storyPreferences: ThemeRecommendation[];
  writingComfort: 'intimidated' | 'neutral' | 'confident';
  personalityTraits: string[];
  recommendations: QuizRecommendation[];
}

// Offline & Error
export type OfflineActionType = 'CREATE_CHAPTER' | 'JOIN_STORY' | 'UPDATE_PROFILE' | 'CREATE_STORY';
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

// User Story type (from story_members table)
export type UserStory = Omit<StoryMember, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type { User };

// Error types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

// Media attachments for editor
export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'audio';
  uri: string;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

// Draft state for editor
export interface DraftState {
  id: string;
  storyId: string;
  chapterId?: string;
  content: string;
  contextSnippet?: string;
  createdAt: number;
  updatedAt: number;
  savedToServer: boolean;
}

// Extended notification preferences for settings
export interface ExtendedNotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  storyUpdates: boolean;
  aiFeatures: boolean;
  marketing: boolean;
}

// Additional Database types
export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_name: string;
  properties?: Record<string, any>;
  created_at: string;
}

export interface UserPreferencesFull {
  id: string;
  user_id: string;
  theme: 'auto' | 'light' | 'dark';
  language: string;
  notifications: Record<string, boolean>;
  privacy: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface AIUsageRecord {
  id: string;
  user_id: string;
  function_name: string;
  cost?: number;
  tokens_used?: number;
  created_at: string;
}

// A/B Testing
export interface ABTestAssignment {
  experiment_id: string;
  variant_id: string;
  assigned_at: string;
}

// Referrals
export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'expired';
  reward_amount: number;
  completed_at?: string;
  created_at: string;
}

// Gifts
export interface Gift {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  message?: string;
  created_at: string;
  claimed_at?: string;
}

export interface GiftCode {
  id: string;
  code: string;
  amount: number;
  purchaser_id: string;
  recipient_email?: string;
  message?: string;
  redeemed: boolean;
  redeemed_by?: string;
  redeemed_at?: string;
  expires_at: string;
  created_at: string;
}

// Profile extensions for referral
export interface ProfileExtended extends Profile {
  referral_code?: string;
  referred_by?: string;
  referral_count?: number;
}
