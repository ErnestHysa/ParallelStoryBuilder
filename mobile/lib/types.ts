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
  created_at: string;
}

export interface Story {
  id: string;
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

// Composite types for queries
export interface StoryWithMembers extends Story {
  members: (StoryMember & {
    profile: Profile;
  })[];
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
    };
  };
};

export type { User };
