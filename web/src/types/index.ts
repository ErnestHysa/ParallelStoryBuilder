// Re-export types from mobile to maintain consistency
// Note: These types are copied to avoid build issues with cross-directory imports

export type Theme = 'romance' | 'fantasy' | 'our_future';
export type StoryStatus = 'active' | 'paused' | 'completed';
export type MemberRole = 'creator' | 'partner';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
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
}

export interface Inspiration {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface StoryWithMembers extends Story {
  members: (StoryMember & {
    profile: Profile;
  })[];
  chapters?: Chapter[];
  updated_at?: string;
}

// Generic database type to allow Supabase operations
export type Database = {
  public: {
    Tables: {
      [key: string]: any;
    };
    Views: {
      [key: string]: any;
    };
    Functions: {
      [key: string]: any;
    };
    Enums: {
      [key: string]: any;
    };
  };
};

export type User = any;

// Web-specific types
export interface WebConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  siteUrl: string;
}

export interface RouteProtection {
  requireAuth: boolean;
  redirectTo?: string;
}

export interface PageMeta {
  title: string;
  description?: string;
  image?: string;
}
