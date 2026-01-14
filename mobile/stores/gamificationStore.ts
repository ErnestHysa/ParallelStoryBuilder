import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { TokenManager } from '../lib/tokenManager';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'writing' | 'social' | 'exploration' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  unlocked_at?: string;
  progress?: number;
  max_progress?: number;
}

interface StreakData {
  current: number;
  longest: number;
  last_active: string | null;
  daily_activities: { [date: string]: number };
}

interface GamificationState {
  achievements: Achievement[];
  streak: StreakData;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAchievements: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  checkAndAwardAchievements: (action: string, metadata?: any) => Promise<void>;
  incrementStreak: () => Promise<void>;
  resetStreak: () => Promise<void>;
  clearError: () => void;

  // Progress tracking
  updateProgress: (achievementId: string, current: number, max: number) => Promise<void>;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  achievements: [],
  streak: {
    current: 0,
    longest: 0,
    last_active: null,
    daily_activities: {},
  },
  isLoading: false,
  error: null,

  fetchAchievements: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements(*)
        `);

      if (error) throw error;

      const userAchievements: Achievement[] = data?.map(ua => ({
        ...ua.achievements,
        unlocked_at: ua.unlocked_at,
        progress: ua.progress,
        max_progress: ua.max_progress,
      })) || [];

      set({ achievements: userAchievements, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch achievements',
        isLoading: false
      });
    }
  },

  fetchStreak: async () => {
    try {
      set({ isLoading: true, error: null });
      const userId = supabase.auth.getUser().data.user?.id;
      if (!userId) {
        set({ error: 'No user logged in', isLoading: false });
        return;
      }

      const streak = await TokenManager.getStreak(userId);
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      set({
        streak: {
          current: streak,
          longest: data?.longest_streak || 0,
          last_active: data?.last_active || null,
          daily_activities: data?.daily_activities || {},
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch streak',
        isLoading: false
      });
    }
  },

  checkAndAwardAchievements: async (action: string, metadata?: any) => {
    try {
      const userId = supabase.auth.getUser().data.user?.id;
      if (!userId) return;

      // Define achievement definitions
      const achievementDefinitions = [
        {
          id: 'first_story',
          title: 'First Steps',
          description: 'Write your first story',
          icon: '📝',
          category: 'writing' as const,
          rarity: 'common' as const,
          points: 10,
          trigger: { action: 'story_created', count: 1 },
        },
        {
          id: 'prolific_writer',
          title: 'Prolific Writer',
          description: 'Write 10 stories',
          icon: '✍️',
          category: 'writing' as const,
          rarity: 'rare' as const,
          points: 50,
          trigger: { action: 'story_created', count: 10 },
        },
        {
          id: 'collaborator',
          title: 'Collaborator',
          description: 'Join 5 collaborative stories',
          icon: '🤝',
          category: 'social' as const,
          rarity: 'rare' as const,
          points: 50,
          trigger: { action: 'story_joined', count: 5 },
        },
        {
          id: 'week_streak',
          title: 'Week Warrior',
          description: '7-day writing streak',
          icon: '🔥',
          category: 'special' as const,
          rarity: 'epic' as const,
          points: 100,
          trigger: { action: 'streak_reached', count: 7 },
        },
        {
          id: 'word_master',
          title: 'Word Master',
          description: 'Write 10,000 words',
          icon: '📚',
          category: 'writing' as const,
          rarity: 'epic' as const,
          points: 100,
          trigger: { action: 'words_written', count: 10000 },
        },
        {
          id: 'social_butterfly',
          title: 'Social Butterfly',
          description: 'Collaborate with 10 different users',
          icon: '🦋',
          category: 'social' as const,
          rarity: 'legendary' as const,
          points: 200,
          trigger: { action: 'unique_collaborators', count: 10 },
        },
        {
          id: 'explorer',
          title: 'Explorer',
          description: 'Read 50 different stories',
          icon: '🔍',
          category: 'exploration' as const,
          rarity: 'rare' as const,
          points: 50,
          trigger: { action: 'story_read', count: 50 },
        },
      ];

      // Update progress for relevant achievements
      const { achievements } = get();
      const state = get();

      for (const definition of achievementDefinitions) {
        const achievement = achievements.find(a => a.id === definition.id);
        const trigger = definition.trigger;

        if (action === trigger.action) {
          let newProgress = (achievement?.progress || 0) + 1;

          if (achievement?.max_progress) {
            newProgress = Math.min(newProgress, achievement.max_progress);
          }

          await state.updateProgress(definition.id, newProgress, trigger.count);

          // Award achievement if threshold reached
          if (newProgress >= trigger.count && !achievement?.unlocked_at) {
            await supabase
              .from('user_achievements')
              .insert([{
                user_id: userId,
                achievement_id: definition.id,
                unlocked_at: new Date().toISOString(),
                progress: newProgress,
                max_progress: trigger.count,
              }]);

            // Award tokens
            await TokenManager.addTokens(
              userId,
              definition.points,
              `Achievement unlocked: ${definition.title}`,
              { achievement_id: definition.id }
            );

            // Update local state
            set(state => ({
              achievements: state.achievements.map(a =>
                a.id === definition.id
                  ? { ...a, unlocked_at: new Date().toISOString() }
                  : a
              ),
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  },

  incrementStreak: async () => {
    try {
      const userId = supabase.auth.getUser().data.user?.id;
      if (!userId) return;

      await TokenManager.recordDailyActivity(userId);
      await get().fetchStreak();
    } catch (error) {
      console.error('Error incrementing streak:', error);
    }
  },

  resetStreak: async () => {
    try {
      const userId = supabase.auth.getUser().data.user?.id;
      if (!userId) return;

      await supabase
        .from('user_streaks')
        .upsert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_active: null,
          daily_activities: {},
        });

      set(state => ({
        streak: {
          ...state.streak,
          current: 0,
          last_active: null,
        },
      }));
    } catch (error) {
      console.error('Error resetting streak:', error);
    }
  },

  updateProgress: async (achievementId: string, current: number, max: number) => {
    try {
      const userId = supabase.auth.getUser().data.user?.id;
      if (!userId) return;

      await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          achievement_id: achievementId,
          progress: current,
          max_progress: max,
        });

      // Update local state
      set(state => ({
        achievements: state.achievements.map(a =>
          a.id === achievementId
            ? { ...a, progress: current, max_progress: max }
            : a
        ),
      }));
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  },

  clearError: () => set({ error: null }),
}));