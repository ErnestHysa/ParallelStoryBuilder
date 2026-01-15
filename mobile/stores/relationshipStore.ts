import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { offlineActions } from './offlineStore';
import { useAuthStore } from './authStore';
import { useTokenStore } from './tokenStore';
import { useNotificationsStore } from './notificationsStore';
import { AppError } from '@/lib/types';

interface Relationship {
  id: string;
  user_id: string;
  partner_id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'paused' | 'ended';
  daily_intention?: DailyIntention;
  milestones: Milestone[];
  questions: RelationshipQuestion[];
}

interface DailyIntention {
  id: string;
  relationship_id: string;
  user_id: string;
  partner_intention?: string;
  intention: string;
  created_at: string;
  completed: boolean;
  completed_at?: string;
  streak_count?: number;
}

interface Milestone {
  id: string;
  relationship_id: string;
  title: string;
  description: string;
  date_achieved: string;
  category: 'personal' | 'relationship' | 'story' | 'achievement';
  media_url?: string;
  created_by: string;
}

interface RelationshipQuestion {
  id: string;
  relationship_id: string;
  question: string;
  answer?: string;
  asked_by: string;
  answered_by?: string;
  asked_at: string;
  answered_at?: string;
  category: 'deepening' | 'fun' | 'reflective' | 'future';
}

interface PartnerInsight {
  id: string;
  relationship_id: string;
  user_id: string;
  insight: string;
  category: 'strength' | 'growth' | 'concern' | 'appreciation';
  created_at: string;
  is_shared: boolean;
}

interface RelationshipState {
  // Relationship data
  currentRelationship: Relationship | null;
  relationship: Relationship | null;
  isLoading: boolean;
  error: string | null;

  // Daily intentions
  dailyIntention: DailyIntention | null;
  isSettingIntention: boolean;

  // Dashboard data
  milestones: Milestone[];
  sharedMilestones: Milestone[];
  insights: PartnerInsight[];
  relationshipStats: {
    totalChapters: number;
    totalTokensSpent: number;
    sharedMoments: number;
    streakDays: number;
    averageResponseTime: number;
  };

  // Questions
  activeQuestions: RelationshipQuestion[];
  relationshipQuestions: RelationshipQuestion[];
  questionCategories: string[];
  questionHistory: RelationshipQuestion[];
  isConnected: boolean;

  // Partner insights
  partnerInsights: PartnerInsight[];
  isSharingInsight: boolean;

  // Methods
  createRelationship: (partnerId: string) => Promise<string>;
  fetchRelationship: () => Promise<void>;
  updateRelationshipStatus: (status: 'active' | 'paused' | 'ended') => Promise<void>;
  setDailyIntention: (intention: string) => Promise<void>;
  completeDailyIntention: () => Promise<void>;
  markIntentionComplete: () => Promise<void>;
  fetchDailyIntention: () => Promise<void>;
  fetchMilestones: () => Promise<void>;
  addMilestone: (milestone: Omit<Milestone, 'id' | 'relationship_id' | 'date_achieved'>) => Promise<string>;
  fetchSharedMilestones: () => Promise<void>;
  addSharedMilestone: (milestone: Omit<Milestone, 'id' | 'relationship_id' | 'date_achieved'>) => Promise<string>;
  updateSharedMilestone: (id: string, updates: Partial<Milestone>) => Promise<void>;
  deleteSharedMilestone: (id: string) => Promise<void>;
  fetchQuestions: () => Promise<void>;
  fetchDailyQuestion: () => Promise<void>;
  askQuestion: (question: string, category: RelationshipQuestion['category']) => Promise<void>;
  answerQuestion: (questionId: string, answer: string) => Promise<void>;
  submitAnswer: (questionId: string, answer: string) => Promise<void>;
  getQuestionHistory: () => RelationshipQuestion[];
  fetchPartnerInsights: () => Promise<void>;
  addInsight: (insight: string, category: PartnerInsight['category'], shareWithPartner: boolean) => Promise<string>;
  markInsightAsShared: (insightId: string) => Promise<void>;
  refreshRelationshipStats: () => Promise<void>;
  getRecommendations: () => Promise<{
    questions: string[];
    activities: string[];
    conversationStarters: string[];
  }>;
}

const QUESTION_CATEGORIES = [
  'deepening',
  'fun',
  'reflective',
  'future'
] as const;

const INSIGHT_CATEGORIES = [
  'strength',
  'growth',
  'concern',
  'appreciation'
] as const;

const MILESTONE_CATEGORIES = [
  'personal',
  'relationship',
  'story',
  'achievement'
] as const;

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  return url !== '' && !url.includes('your-project') && key !== '' && !key.includes('your-anon');
};

export const useRelationshipStore = create<RelationshipState>((set, get) => ({
  // Initial state
  currentRelationship: null,
  relationship: null,
  isLoading: false,
  error: null,
  dailyIntention: null,
  isSettingIntention: false,
  milestones: [],
  sharedMilestones: [],
  insights: [],
  relationshipStats: {
    totalChapters: 0,
    totalTokensSpent: 0,
    sharedMoments: 0,
    streakDays: 0,
    averageResponseTime: 0,
  },
  activeQuestions: [],
  relationshipQuestions: [],
  questionCategories: QUESTION_CATEGORIES,
  questionHistory: [],
  isConnected: false,
  partnerInsights: [],
  isSharingInsight: false,

  createRelationship: async (partnerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const tokenStore = useTokenStore.getState();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Deduct tokens for relationship creation
    const creationCost = 10;
    if (tokenStore.balance < creationCost) {
      throw new Error('Insufficient tokens to create a relationship');
    }
    tokenStore.deductTokens(creationCost);

    try {
      // Create the relationship
      const { data, error } = await supabase
        .from('relationships')
        .insert({
          user_id: user.id,
          partner_id: partnerId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial milestone for relationship start
      await supabase
        .from('milestones')
        .insert({
          relationship_id: data.id,
          title: 'Relationship Started',
          description: 'We began our journey together through Parallel Story Builder',
          category: 'relationship',
          created_by: user.id,
        });

      // Create daily intention for today
      await get().setDailyIntention('Write our first chapter together');

      set({ currentRelationship: data, relationship: data });

      return data.id;
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.createRelationship({
          user_id: user.id,
          partner_id: partnerId,
          status: 'active',
        });

        throw new AppError('Relationship queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  fetchRelationship: async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    set({ isLoading: true, error: null });

    try {
      // Fetch user's relationship
      const { data: relationship, error } = await supabase
        .from('relationships')
        .select(`
          *,
          partner:profiles!partner_id(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (relationship) {
        set({ currentRelationship: relationship, relationship: relationship });

        // Fetch related data
        await Promise.all([
          get().fetchDailyIntention(),
          get().fetchMilestones(),
          get().fetchQuestions(),
          get().fetchPartnerInsights(),
          get().refreshRelationshipStats(),
        ]);
      }
    } catch (error: any) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error fetching relationship:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateRelationshipStatus: async (status: 'active' | 'paused' | 'ended') => {
    const { currentRelationship } = get();
    const { data: { user } } = await supabase.auth.getUser();

    if (!currentRelationship || !user) {
      throw new Error('No active relationship or user not authenticated');
    }

    try {
      const { error } = await supabase
        .from('relationships')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', currentRelationship.id);

      if (error) throw error;

      set((state) => ({
        currentRelationship: state.currentRelationship
          ? { ...state.currentRelationship, status }
          : null,
      }));

      // Create milestone for status change
      await supabase
        .from('milestones')
        .insert({
          relationship_id: currentRelationship.id,
          title: `Relationship ${status}`,
          description: `Our relationship status has been updated to ${status}`,
          category: 'relationship',
          created_by: user.id,
        });
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.updateRelationshipStatus(currentRelationship.id, status);

        // Update local state for immediate UI feedback
        set((state) => ({
          currentRelationship: state.currentRelationship
            ? { ...state.currentRelationship, status }
            : null,
        }));

        throw new AppError('Relationship status update queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  setDailyIntention: async (intention: string) => {
    const { currentRelationship } = get();
    const { data: { user } } = await supabase.auth.getUser();
    const tokenStore = useTokenStore.getState();

    if (!currentRelationship || !user) {
      throw new Error('No active relationship or user not authenticated');
    }

    // Deduct tokens for setting intention
    const intentionCost = 0.5;
    if (tokenStore.balance >= intentionCost) {
      tokenStore.deductTokens(intentionCost);
    }

    set({ isSettingIntention: true });

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Check if intention already exists for today
      const { data: existingIntention } = await supabase
        .from('daily_intentions')
        .select('*')
        .eq('relationship_id', currentRelationship.id)
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .single();

      if (existingIntention) {
        // Update existing intention
        const { error } = await supabase
          .from('daily_intentions')
          .update({ intention })
          .eq('id', existingIntention.id);

        if (error) throw error;

        set({ dailyIntention: { ...existingIntention, intention } });
      } else {
        // Create new intention
        const { data, error } = await supabase
          .from('daily_intentions')
          .insert({
            relationship_id: currentRelationship.id,
            user_id: user.id,
            intention,
            completed: false,
          })
          .select()
          .single();

        if (error) throw error;

        set({ dailyIntention: data });
      }

      // Send notification to partner
      const notificationsStore = useNotificationsStore.getState();
      await notificationsStore.sendNotification({
        type: 'daily_intention',
        recipientId: currentRelationship.partner_id,
        title: 'Daily Intention Set',
        message: `${user.email?.split('@')[0] || 'Your partner'} has set a new daily intention`,
        data: {
          relationshipId: currentRelationship.id,
        },
      });
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.setDailyIntention({
          relationship_id: currentRelationship.id,
          user_id: user.id,
          intention,
          completed: false,
        });

        // Update local state for immediate UI feedback
        const now = Date.now();
        set({ dailyIntention: { id: `temp_${now}`, relationship_id: currentRelationship.id, user_id: user.id, intention, created_at: new Date().toISOString(), completed: false } });

        throw new AppError('Daily intention queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    } finally {
      set({ isSettingIntention: false });
    }
  },

  completeDailyIntention: async () => {
    const { dailyIntention } = get();
    const { data: { user } } = await supabase.auth.getUser();

    if (!dailyIntention || !user) {
      throw new Error('No daily intention to complete');
    }

    try {
      const { error } = await supabase
        .from('daily_intentions')
        .update({ completed: true })
        .eq('id', dailyIntention.id);

      if (error) throw error;

      set({ dailyIntention: { ...dailyIntention, completed: true } });

      // Create milestone for completion
      const { currentRelationship } = get();
      if (currentRelationship) {
        await supabase
          .from('milestones')
          .insert({
            relationship_id: currentRelationship.id,
            title: 'Daily Intention Completed',
            description: `Completed: "${dailyIntention.intention}"`,
            category: 'personal',
            created_by: user.id,
          });
      }
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Update local state for immediate UI feedback
        set((state) => ({
          dailyIntention: state.dailyIntention
            ? { ...state.dailyIntention, completed: true }
            : null,
        }));

        throw new AppError('Daily intention completion queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  fetchDailyIntention: async () => {
    const { currentRelationship } = get();
    const { data: { user } } = await supabase.auth.getUser();

    if (!currentRelationship || !user) return;

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const { data, error } = await supabase
        .from('daily_intentions')
        .select('*')
        .eq('relationship_id', currentRelationship.id)
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      set({ dailyIntention: data || null });
    } catch (error) {
      console.error('Error fetching daily intention:', error);
    }
  },

  fetchMilestones: async () => {
    const { currentRelationship } = get();

    if (!currentRelationship) return;

    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('relationship_id', currentRelationship.id)
        .order('date_achieved', { ascending: false });

      if (error) throw error;

      set({ milestones: data || [] });
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  },

  addMilestone: async (milestone: Omit<Milestone, 'id' | 'relationship_id' | 'date_achieved'>) => {
    const { currentRelationship } = get();
    const { data: { user } } = await supabase.auth.getUser();
    const tokenStore = useTokenStore.getState();

    if (!currentRelationship || !user) {
      throw new Error('No active relationship or user not authenticated');
    }

    // Deduct tokens for milestone creation
    const milestoneCost = 1;
    if (tokenStore.balance < milestoneCost) {
      throw new Error('Insufficient tokens to create milestone');
    }
    tokenStore.deductTokens(milestoneCost);

    try {
      const { data, error } = await supabase
        .from('milestones')
        .insert({
          ...milestone,
          relationship_id: currentRelationship.id,
          date_achieved: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        milestones: [data, ...state.milestones],
      }));

      return data.id;
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.addMilestone({
          ...milestone,
          relationship_id: currentRelationship.id,
          date_achieved: new Date().toISOString(),
        });

        // Update local state for immediate UI feedback
        const tempId = `temp_${Date.now()}`;
        set((state) => ({
          milestones: [{
            id: tempId,
            ...milestone,
            relationship_id: currentRelationship.id,
            date_achieved: new Date().toISOString(),
          }, ...state.milestones],
        }));

        throw new AppError('Milestone queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  fetchQuestions: async () => {
    const { currentRelationship } = get();

    if (!currentRelationship) return;

    try {
      const { data: questions, error } = await supabase
        .from('relationship_questions')
        .select('*')
        .eq('relationship_id', currentRelationship.id)
        .order('asked_at', { ascending: false });

      if (error) throw error;

      // Filter for active questions (unanswered or recent)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const active = questions.filter(q =>
        !q.answered_at || new Date(q.answered_at) > oneWeekAgo
      );

      set({ activeQuestions: active, relationshipQuestions: active });
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  },

  askQuestion: async (question: string, category: RelationshipQuestion['category']) => {
    const { currentRelationship } = get();
    const { data: { user } } = await supabase.auth.getUser();
    const tokenStore = useTokenStore.getState();

    if (!currentRelationship || !user) {
      throw new Error('No active relationship or user not authenticated');
    }

    // Deduct tokens for asking question
    const questionCost = 0.5;
    if (tokenStore.balance < questionCost) {
      throw new Error('Insufficient tokens to ask question');
    }
    tokenStore.deductTokens(questionCost);

    try {
      const { data, error } = await supabase
        .from('relationship_questions')
        .insert({
          relationship_id: currentRelationship.id,
          question,
          asked_by: user.id,
          category,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        activeQuestions: [data, ...state.activeQuestions],
        relationshipQuestions: [data, ...state.relationshipQuestions],
        questionHistory: [data, ...state.questionHistory],
      }));

      // Send notification to partner
      const notificationsStore = useNotificationsStore.getState();
      await notificationsStore.sendNotification({
        type: 'new_question',
        recipientId: currentRelationship.partner_id,
        title: 'New Question',
        message: `Your partner has asked a new question: "${question.substring(0, 50)}..."`,
        data: {
          questionId: data.id,
          relationshipId: currentRelationship.id,
        },
      });
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.askQuestion({
          relationship_id: currentRelationship.id,
          question,
          asked_by: user.id,
          category,
        });

        // Update local state for immediate UI feedback
        const tempId = `temp_${Date.now()}`;
        set((state) => ({
          activeQuestions: [{
            id: tempId,
            relationship_id: currentRelationship.id,
            question,
            asked_by: user.id,
            category,
            asked_at: new Date().toISOString(),
          }, ...state.activeQuestions],
        }));

        throw new AppError('Question queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  answerQuestion: async (questionId: string, answer: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('relationship_questions')
        .update({
          answer,
          answered_by: user.id,
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        activeQuestions: state.activeQuestions.map(q =>
          q.id === questionId
            ? { ...q, answer, answered_by: user.id, answered_at: new Date().toISOString() }
            : q
        ),
        relationshipQuestions: state.relationshipQuestions.map(q =>
          q.id === questionId
            ? { ...q, answer, answered_by: user.id, answered_at: new Date().toISOString() }
            : q
        ),
        questionHistory: state.questionHistory.map(q =>
          q.id === questionId
            ? { ...q, answer, answered_by: user.id, answered_at: new Date().toISOString() }
            : q
        ),
      }));

      // Get the question to notify partner
      const question = get().activeQuestions.find(q => q.id === questionId);
      const { currentRelationship } = get();

      if (question && currentRelationship) {
        const notificationsStore = useNotificationsStore.getState();
        await notificationsStore.sendNotification({
          type: 'question_answered',
          recipientId: currentRelationship.partner_id,
          title: 'Question Answered',
          message: `Your partner has answered: "${answer.substring(0, 50)}..."`,
          data: {
            questionId,
            relationshipId: currentRelationship.id,
          },
        });
      }
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Update local state for immediate UI feedback
        set((state) => ({
          activeQuestions: state.activeQuestions.map(q =>
            q.id === questionId
              ? { ...q, answer, answered_by: user.id, answered_at: new Date().toISOString() }
              : q
          ),
        }));

        throw new AppError('Question answer queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  fetchPartnerInsights: async () => {
    const { currentRelationship } = get();
    const { data: { user } } = await supabase.auth.getUser();

    if (!currentRelationship || !user) return;

    try {
      const { data, error } = await supabase
        .from('partner_insights')
        .select('*')
        .eq('relationship_id', currentRelationship.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ partnerInsights: data || [] });
    } catch (error) {
      console.error('Error fetching partner insights:', error);
    }
  },

  addInsight: async (insight: string, category: PartnerInsight['category'], shareWithPartner: boolean) => {
    const { currentRelationship } = get();
    const { data: { user } } = await supabase.auth.getUser();
    const tokenStore = useTokenStore.getState();

    if (!currentRelationship || !user) {
      throw new Error('No active relationship or user not authenticated');
    }

    // Deduct tokens for adding insight
    const insightCost = 0.3;
    if (tokenStore.balance < insightCost) {
      throw new Error('Insufficient tokens to add insight');
    }
    tokenStore.deductTokens(insightCost);

    try {
      const { data, error } = await supabase
        .from('partner_insights')
        .insert({
          relationship_id: currentRelationship.id,
          user_id: user.id,
          insight,
          category,
          is_shared: shareWithPartner,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        partnerInsights: [data, ...state.partnerInsights],
      }));

      return data.id;
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.addInsight({
          relationship_id: currentRelationship.id,
          user_id: user.id,
          insight,
          category,
          is_shared: shareWithPartner,
        });

        // Update local state for immediate UI feedback
        const tempId = `temp_${Date.now()}`;
        set((state) => ({
          partnerInsights: [{
            id: tempId,
            relationship_id: currentRelationship.id,
            user_id: user.id,
            insight,
            category,
            is_shared: shareWithPartner,
            created_at: new Date().toISOString(),
          }, ...state.partnerInsights],
        }));

        throw new AppError('Insight queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  markInsightAsShared: async (insightId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('partner_insights')
        .update({ is_shared: true })
        .eq('id', insightId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      set((state) => ({
        partnerInsights: state.partnerInsights.map(i =>
          i.id === insightId ? { ...i, is_shared: true } : i
        ),
      }));
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Update local state for immediate UI feedback
        set((state) => ({
          partnerInsights: state.partnerInsights.map(i =>
            i.id === insightId ? { ...i, is_shared: true } : i
          ),
        }));

        throw new AppError('Insight share queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  refreshRelationshipStats: async () => {
    const { currentRelationship } = get();
    const { data: { user } } = await supabase.auth.getUser();

    if (!currentRelationship || !user) return;

    try {
      // Fetch stories for this relationship
      const { data: stories, error: storiesError } = await supabase
        .from('story_relationships')
        .select('story_id')
        .eq('relationship_id', currentRelationship.id);

      if (storiesError) throw storiesError;

      // Calculate stats
      const stats = {
        totalChapters: 0,
        totalTokensSpent: 0,
        sharedMoments: 0,
        streakDays: 0,
        averageResponseTime: 0,
      };

      // Get chapter count for each story
      if (stories && stories.length > 0) {
        const chapterPromises = stories.map(async (sr) => {
          const { data: chapters } = await supabase
            .from('chapters')
            .select('*')
            .eq('story_id', sr.story_id);
          return chapters?.length || 0;
        });

        const chapterCounts = await Promise.all(chapterPromises);
        stats.totalChapters = chapterCounts.reduce((sum, count) => sum + count, 0);
      }

      // Get token usage from auth store
      const authStore = useAuthStore.getState();
      stats.totalTokensSpent = authStore.tokenBalance;

      // Get milestone count
      const { data: milestones } = await supabase
        .from('milestones')
        .select('id')
        .eq('relationship_id', currentRelationship.id);
      stats.sharedMoments = milestones?.length || 0;

      // Calculate streak (simplified - count of consecutive days with activity)
      const { data: recentActivity } = await supabase
        .from('chapters')
        .select('created_at')
        .eq('story_id', 'any') // Would need to join with story_relationships
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      // Simple streak calculation
      if (recentActivity && recentActivity.length > 0) {
        const dates = recentActivity.map(a => new Date(a.created_at).toDateString());
        const uniqueDates = [...new Set(dates)];
        stats.streakDays = uniqueDates.length;
      }

      set({ relationshipStats: stats });
    } catch (error) {
      console.error('Error refreshing relationship stats:', error);
    }
  },

  getRecommendations: async () => {
    const { currentRelationship } = get();
    const { data: { user } } = await supabase.auth.getUser();

    if (!currentRelationship || !user) {
      return {
        questions: [],
        activities: [],
        conversationStarters: [],
      };
    }

    // This would typically use AI to generate personalized recommendations
    // For now, return some general suggestions based on relationship data
    const { relationshipStats, activeQuestions, partnerInsights } = get();

    const questions = [
      "What's one thing you're grateful for about our relationship this week?",
      "If we could have any adventure together, what would it be?",
      "What's a dream you've always wanted to achieve?",
      "How do you feel about the pace of our story?",
    ];

    const activities = [
      "Write a chapter about a shared memory",
      "Ask each other three deep questions",
      "Create a milestone for something you've accomplished",
      "Review your favorite chapters together",
    ];

    const conversationStarters = [
      "Remember when we first started writing together...",
      "What do you think our characters would do in this situation?",
      "If our story was a movie, what genre would it be?",
      "What's the most surprising thing that's happened in our story?",
    ];

    // Filter out already asked questions
    const unansweredQuestions = activeQuestions.filter(q => !q.answer);
    const availableQuestions = questions.filter(q =>
      !unansweredQuestions.some(uq => uq.question.includes(q))
    );

    return {
      questions: availableQuestions.slice(0, 3),
      activities: activities.slice(0, 3),
      conversationStarters: conversationStarters.slice(0, 3),
    };
  },

  // Additional stub methods for compatibility
  markIntentionComplete: async () => {
    await get().completeDailyIntention();
  },

  fetchSharedMilestones: async () => {
    await get().fetchMilestones();
    set((state) => ({ sharedMilestones: state.milestones }));
  },

  addSharedMilestone: async (milestone) => {
    return await get().addMilestone(milestone);
  },

  updateSharedMilestone: async (id: string, updates: Partial<Milestone>) => {
    // Implementation would update the milestone in Supabase
    console.log('updateSharedMilestone', id, updates);
  },

  deleteSharedMilestone: async (id: string) => {
    // Implementation would delete the milestone from Supabase
    console.log('deleteSharedMilestone', id);
  },

  fetchDailyQuestion: async () => {
    // Implementation would fetch today's daily question
    console.log('fetchDailyQuestion');
  },

  submitAnswer: async (questionId: string, answer: string) => {
    await get().answerQuestion(questionId, answer);
  },

  getQuestionHistory: () => {
    return get().activeQuestions;
  },
}));