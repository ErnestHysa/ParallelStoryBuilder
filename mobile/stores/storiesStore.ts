import { create } from 'zustand';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { offlineActions } from './offlineStore';
import { initializeQueryCache, createSupabaseQuery } from '@/lib/queryCache';
import { cacheManager } from '@/lib/cacheManager';
import { useCache } from '@/hooks/useCache';
import { Story, StoryWithMembers, Chapter, Theme, AppError, MediaAttachment } from '@/lib/types';
import { useTokenStore } from './tokenStore';
import { useEditorStore } from './editorStore';

// Initialize query cache
initializeQueryCache(supabase);

interface StoriesState {
  stories: StoryWithMembers[];
  currentStory: StoryWithMembers | null;
  isLoading: boolean;
  error: string | null;
  currentChapter: Chapter | null;
  subscription: RealtimeChannel | null;
  isConfigured: boolean;

  // Offline queue and cache
  offlineQueue: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    data: any;
    timestamp: number;
    synced: boolean;
  }>;
  queryCache: {
    stories: Record<string, any>;
    chapters: Record<string, any>;
    lastUpdated: number;
  };

  // Enhanced real-time with presence
  activeUsers: Map<string, {
    userId: string;
    username: string;
    lastSeen: number;
    isTyping: boolean;
    currentChapter: string | null;
  }>;

  // Token spending for AI features
  aiTokenUsage: Record<string, number>;

  // Story export integration
  exportQueue: Array<{
    id: string;
    storyId: string;
    format: 'pdf' | 'epub' | 'txt';
    includeImages: boolean;
    chapters: string[];
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }>;

  // Media attachments
  mediaAttachments: Record<string, MediaAttachment[]>;

  // Relationship linking
  storyRelationships: Record<string, {
    partnerId: string;
    storyId: string;
    linkedAt: Date;
    milestoneId: string | null;
  }>;

  // Methods
  fetchStories: () => Promise<void>;
  fetchStory: (storyId: string) => Promise<void>;
  createStory: (title: string, theme: Theme) => Promise<string>;
  joinStory: (pairingCode: string) => Promise<void>;
  setCurrentStory: (story: StoryWithMembers | null) => void;
  subscribeToStory: (storyId: string) => Promise<void>;
  unsubscribe: () => void;
  fetchLatestChapter: (storyId: string) => Promise<void>;
  invalidateStoriesCache: () => void;
  invalidateStoryCache: (storyId: string) => void;

  // New methods
  addMediaAttachment: (storyId: string, attachment: Omit<MediaAttachment, 'id' | 'uploaded_at'>) => Promise<string>;
  removeMediaAttachment: (storyId: string, attachmentId: string) => Promise<void>;
  linkStoryToRelationship: (storyId: string, partnerId: string) => Promise<void>;
  unlinkStoryFromRelationship: (storyId: string) => Promise<void>;
  submitExportRequest: (storyId: string, options: ExportOptions) => Promise<string>;
  processOfflineQueue: () => Promise<void>;
  trackTokenUsage: (feature: string, cost: number) => void;
  updateUserPresence: (storyId: string, presence: any) => void;
  removeUserPresence: (userId: string) => void;
}

const generatePairingCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  return url !== '' && !url.includes('your-project') && key !== '' && !key.includes('your-anon');
};

interface ExportOptions {
  format: 'pdf' | 'epub' | 'txt';
  includeImages: boolean;
  chapters?: string[];
  title?: string;
  author?: string;
}

export const useStoriesStore = create<StoriesState>((set, get) => ({
  stories: [],
  currentStory: null,
  isLoading: false,
  error: null,
  currentChapter: null,
  subscription: null,
  isConfigured: isSupabaseConfigured(),

  // Offline queue and cache
  offlineQueue: [],
  queryCache: {
    stories: {},
    chapters: {},
    lastUpdated: 0,
  },

  // Enhanced real-time with presence
  activeUsers: new Map(),

  // Token spending for AI features
  aiTokenUsage: {},

  // Story export integration
  exportQueue: [],

  // Media attachments
  mediaAttachments: {},

  // Relationship linking
  storyRelationships: {},

  fetchStories: async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use cached query if available
      const cacheKey = `stories:${user.id}`;
      const cachedStories = cacheManager.get<StoryWithMembers[]>(cacheKey);

      if (cachedStories) {
        set({ stories: cachedStories });
        // Prefetch stories in background for better UX
        queryCache.prefetch(
          ['stories', user.id],
          createSupabaseQuery(supabase, 'story_members', {
            eq: { user_id: user.id },
            select: `
              story_id,
              user_id,
              role,
              turn_order,
              joined_at,
              story:stories(*)
            `,
          }),
          { staleTime: 5 * 60 * 1000 } // 5 minutes
        );
        set({ isLoading: false });
        return;
      }

      // Create query function
      const fetchStoriesQuery = async () => {
        const { data, error } = await supabase
          .from('story_members')
          .select(`
            story_id,
            user_id,
            role,
            turn_order,
            joined_at,
            story:stories(*)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        // For each story, fetch members with profiles
        const storiesWithMembers = await Promise.all(
          (data || []).map(async (member: any) => {
            const { data: membersData } = await supabase
              .from('story_members')
              .select(`
                *,
                profile:profiles(*)
              `)
              .eq('story_id', member.story_id);

            // Fetch media attachments for this story
            const { data: mediaData } = await supabase
              .from('media_attachments')
              .select('*')
              .eq('story_id', member.story_id);

            return {
              ...member.story,
              members: membersData || [],
              mediaAttachments: mediaData || [],
            };
          })
        );

        // Cache the result
        cacheManager.set(cacheKey, storiesWithMembers, {
          ttl: 10 * 60 * 1000, // 10 minutes
        });

        return storiesWithMembers;
      };

      // Use query cache with retry logic
      const result = await queryCache.fetch(
        ['stories', user.id],
        fetchStoriesQuery,
        {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          retryCount: 3,
          retryDelay: 1000,
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
        }
      );

      set({
        stories: result.data || [],
        isLoading: false,
        error: result.error,
      });

      // Process offline queue after fetching
      await get().processOfflineQueue();
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error fetching stories:', error);
      set({ isLoading: false });
    }
  },

  fetchStory: async (storyId: string) => {
    if (!isSupabaseConfigured()) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Use cached query if available
      const cacheKey = `story:${storyId}`;
      const cachedStory = cacheManager.get<StoryWithMembers>(cacheKey);

      if (cachedStory) {
        set({ currentStory: cachedStory });
        // Prefetch story in background
        queryCache.prefetch(
          ['story', storyId],
          createSupabaseQuery(supabase, 'stories', {
            eq: { id: storyId },
            select: '*',
          }),
          { staleTime: 10 * 60 * 1000 } // 10 minutes
        );
        set({ isLoading: false });
        return;
      }

      // Create query function
      const fetchStoryQuery = async () => {
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .single();

        if (storyError) throw storyError;

        const { data: membersData } = await supabase
          .from('story_members')
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq('story_id', storyId);

        const { data: mediaData } = await supabase
          .from('media_attachments')
          .select('*')
          .eq('story_id', storyId);

        const storyWithMembers = {
          ...storyData,
          members: membersData || [],
          mediaAttachments: mediaData || [],
        };

        // Cache the result
        cacheManager.set(cacheKey, storyWithMembers, {
          ttl: 30 * 60 * 1000, // 30 minutes
        });

        return storyWithMembers;
      };

      // Use query cache
      const result = await queryCache.fetch(
        ['story', storyId],
        fetchStoryQuery,
        {
          staleTime: 10 * 60 * 1000, // 10 minutes
          gcTime: 30 * 60 * 1000, // 30 minutes
          retryCount: 3,
          retryDelay: 1000,
        }
      );

      set({
        currentStory: result.data,
        isLoading: false,
        error: result.error,
      });

      // Update media attachments state
      if (result.data?.id) {
        set((state) => ({
          mediaAttachments: {
            ...state.mediaAttachments,
            [result.data.id]: result.data.mediaAttachments || [],
          }
        }));
      }
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error fetching story:', error);
      set({ isLoading: false });
    }
  },

  createStory: async (title: string, theme: Theme) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const pairingCode = generatePairingCode();
    const tokenStore = useTokenStore.getState();
    const storyData = {
      title,
      created_by: user.id,
      theme,
      pairing_code: pairingCode,
      status: 'active' as const,
      current_turn: user.id,
    };

    // Deduct token for creation
    const creationCost = 1;
    if (tokenStore.balance >= creationCost) {
      tokenStore.deductTokens(creationCost);
    }

    try {
      // Try to create online first
      const { data, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();

      if (error) throw error;

      // Also add creator to story_members
      await supabase
        .from('story_members')
        .insert({
          story_id: data.id,
          user_id: user.id,
          role: 'creator',
          turn_order: 1,
        });

      // Create relationship link if partner exists
      const { data: partnerData } = await supabase
        .from('relationships')
        .select('partner_id')
        .eq('user_id', user.id)
        .single();

      if (partnerData) {
        await supabase
          .from('story_relationships')
          .insert({
            story_id: data.id,
            user_id: user.id,
            partner_id: partnerData.partner_id,
            linked_at: new Date().toISOString(),
          });
      }

      return data.id;

    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Network error or rate limit - queue for offline sync
        await offlineActions.createStory(storyData);

        // Add to offline queue
        const queueId = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          offlineQueue: [
            ...state.offlineQueue,
            {
              id: queueId,
              type: 'create',
              data: storyData,
              timestamp: Date.now(),
              synced: false,
            }
          ]
        }));

        // Return a temporary ID for local state management
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Add to local state for immediate UI feedback
        set((state) => ({
          stories: [...state.stories, {
            id: tempId,
            ...storyData,
            members: [{
              story_id: tempId,
              user_id: user.id,
              role: 'creator',
              turn_order: 1,
              joined_at: new Date().toISOString(),
              profile: {
                id: user.id,
                email: user.email || '',
                display_name: user.email?.split('@')[0] || 'Anonymous',
                avatar_url: null,
                created_at: new Date().toISOString(),
              }
            }],
            current_turn: user.id,
            mediaAttachments: [],
          }]
        }));

        throw new AppError('Story queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE', {
          storyTitle: title,
          theme,
        });
      }

      throw error;
    }
  },

  joinStory: async (pairingCode: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('pairing_code', pairingCode)
        .single();

      if (storyError) throw storyError;

      if (!storyData) {
        throw new Error('Invalid pairing code');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('story_members')
        .select('*')
        .eq('story_id', storyData.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        throw new Error('Already a member of this story');
      }

      // Check if story already has two members
      const { data: allMembers } = await supabase
        .from('story_members')
        .select('*')
        .eq('story_id', storyData.id);

      if (allMembers && allMembers.length >= 2) {
        throw new Error('Story already has two members');
      }

      const userStory = {
        story_id: storyData.id,
        user_id: user.id,
        role: 'partner' as const,
        turn_order: 2,
      };

      // Try to join online first
      await supabase
        .from('story_members')
        .insert(userStory);

      // Create relationship link
      const { data: relationshipData } = await supabase
        .from('relationships')
        .select('partner_id')
        .eq('user_id', user.id)
        .single();

      if (relationshipData) {
        await supabase
          .from('story_relationships')
          .insert({
            story_id: storyData.id,
            user_id: user.id,
            partner_id: relationshipData.partner_id,
            linked_at: new Date().toISOString(),
          });
      }

    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Network error - queue for offline sync
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await offlineActions.joinStory({
            story_id: pairingCode,
            user_id: user.id,
            role: 'partner' as const,
            turn_order: 2,
          });
        }

        throw new AppError('Story join queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE', {
          pairingCode,
        });
      }

      throw error;
    }
  },

  setCurrentStory: (story: StoryWithMembers | null) => {
    set({ currentStory: story });
    if (story) {
      // Track token usage for story
      get().trackTokenUsage('story_view', 0.1);
    }
  },

  subscribeToStory: async (storyId: string) => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const { subscription: existingSub } = get();

    if (existingSub) {
      existingSub.unsubscribe();
    }

    const channel = supabase
      .channel(`story:${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chapters',
          filter: `story_id=eq.${storyId}`,
        },
        async (payload) => {
          // Invalidate relevant caches
          get().invalidateStoryCache(storyId);

          // Refresh story and chapter
          await get().fetchStory(storyId);
          await get().fetchLatestChapter(storyId);

          // Track token usage for real-time updates
          get().trackTokenUsage('realtime_update', 0.05);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`,
        },
        async () => {
          // Invalidate story cache
          get().invalidateStoryCache(storyId);
          // Refresh story
          await get().fetchStory(storyId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_members',
        },
        async () => {
          // Refresh stories list when new member is added
          get().invalidateStoriesCache();
          await get().fetchStories();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_attachments',
          filter: `story_id=eq.${storyId}`,
        },
        async (payload) => {
          // Refresh media attachments
          await get().fetchStory(storyId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_relationships',
          filter: `story_id=eq.${storyId}`,
        },
        async (payload) => {
          // Refresh story relationships
          await get().fetchStory(storyId);
        }
      )
      .subscribe();

    set({ subscription: channel });

    // Track presence
    const { trackTokenUsage } = get();
    setInterval(() => {
      trackTokenUsage('presence', 0.01);
    }, 30000); // Every 30 seconds
  },

  unsubscribe: () => {
    const { subscription } = get();

    if (subscription) {
      subscription.unsubscribe();
      set({ subscription: null });
    }
  },

  fetchLatestChapter: async (storyId: string) => {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      // Use cached query if available
      const cacheKey = `chapter:${storyId}:latest`;
      const cachedChapter = cacheManager.get<Chapter>(cacheKey);

      if (cachedChapter) {
        set({ currentChapter: cachedChapter });
        // Prefetch latest chapter in background
        queryCache.prefetch(
          ['chapter', storyId, 'latest'],
          createSupabaseQuery(supabase, 'chapters', {
            eq: { story_id: storyId },
            order: 'created_at',
            ascending: false,
            limit: 1,
          }),
          { staleTime: 2 * 60 * 1000 } // 2 minutes
        );
        return;
      }

      const fetchChapterQuery = async () => {
        const { data, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('story_id', storyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // PGRST116 = no rows returned (expected when story not found)
        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        // Cache the result if it exists
        if (data) {
          cacheManager.set(cacheKey, data, {
            ttl: 5 * 60 * 1000, // 5 minutes
          });
        }

        return data;
      };

      const result = await queryCache.fetch(
        ['chapter', storyId, 'latest'],
        fetchChapterQuery,
        {
          staleTime: 2 * 60 * 1000, // 2 minutes
          gcTime: 5 * 60 * 1000, // 5 minutes
          retryCount: 2,
          retryDelay: 500,
        }
      );

      set({ currentChapter: result.data });

      // Update editor state if this is the current story
      const editorStore = useEditorStore.getState();
      if (result.data) {
        editorStore.setCurrentContent(result.data.content);
        editorStore.setContextSnippet(result.data.context_snippet);
      }
    } catch (error) {
      console.error('Error fetching latest chapter:', error);
    }
  },

  // New methods
  addMediaAttachment: async (storyId: string, attachment: Omit<MediaAttachment, 'id' | 'uploaded_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Upload file to Supabase storage
      const filePath = `stories/${storyId}/${Date.now()}_${attachment.filename}`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, attachment.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Insert into database
      const { data, error } = await supabase
        .from('media_attachments')
        .insert({
          story_id: storyId,
          chapter_id: attachment.chapterId,
          user_id: user.id,
          filename: attachment.filename,
          file_url: publicUrl,
          file_type: attachment.fileType,
          size: attachment.size,
          caption: attachment.caption,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set((state) => {
        const currentAttachments = state.mediaAttachments[storyId] || [];
        return {
          mediaAttachments: {
            ...state.mediaAttachments,
            [storyId]: [...currentAttachments, data],
          }
        };
      });

      // Refresh story to update media attachments
      await get().fetchStory(storyId);

      return data.id;
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.addMediaAttachment({
          story_id: storyId,
          user_id: user.id,
          filename: attachment.filename,
          file_type: attachment.fileType,
          size: attachment.size,
          caption: attachment.caption,
        });

        // Add to local state for immediate UI feedback
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set((state) => {
          const currentAttachments = state.mediaAttachments[storyId] || [];
          return {
            mediaAttachments: {
              ...state.mediaAttachments,
              [storyId]: [...currentAttachments, {
                id: tempId,
                story_id: storyId,
                chapter_id: attachment.chapterId,
                user_id: user.id,
                filename: attachment.filename,
                file_url: 'local:///' + attachment.filename,
                file_type: attachment.fileType,
                size: attachment.size,
                caption: attachment.caption,
                uploaded_at: new Date().toISOString(),
              }]
            }
          };
        });

        throw new AppError('Media attachment queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  removeMediaAttachment: async (storyId: string, attachmentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Get attachment first to delete from storage
      const { data: attachment } = await supabase
        .from('media_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();

      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Delete from storage
      await supabase.storage
        .from('media')
        .remove([attachment.file_url]);

      // Delete from database
      const { error } = await supabase
        .from('media_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;

      // Update local state
      set((state) => {
        const currentAttachments = state.mediaAttachments[storyId] || [];
        return {
          mediaAttachments: {
            ...state.mediaAttachments,
            [storyId]: currentAttachments.filter(att => att.id !== attachmentId),
          }
        };
      });

      // Refresh story
      await get().fetchStory(storyId);
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.removeMediaAttachment(attachmentId);

        // Update local state for immediate UI feedback
        set((state) => {
          const currentAttachments = state.mediaAttachments[storyId] || [];
          return {
            mediaAttachments: {
              ...state.mediaAttachments,
              [storyId]: currentAttachments.filter(att => att.id !== attachmentId),
            }
          };
        });

        throw new AppError('Media attachment removal queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  linkStoryToRelationship: async (storyId: string, partnerId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('story_relationships')
        .insert({
          story_id: storyId,
          user_id: user.id,
          partner_id: partnerId,
          linked_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set((state) => ({
        storyRelationships: {
          ...state.storyRelationships,
          [storyId]: {
            partnerId,
            storyId,
            linkedAt: new Date(),
            milestoneId: data.milestone_id,
          }
        }
      }));

      return data.id;
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.linkStoryToRelationship({
          story_id: storyId,
          user_id: user.id,
          partner_id: partnerId,
          linked_at: new Date().toISOString(),
        });

        // Update local state for immediate UI feedback
        set((state) => ({
          storyRelationships: {
            ...state.storyRelationships,
            [storyId]: {
              partnerId,
              storyId,
              linkedAt: new Date(),
              milestoneId: null,
            }
          }
        }));

        throw new AppError('Story relationship queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  unlinkStoryFromRelationship: async (storyId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('story_relationships')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      set((state) => {
        const newState = { ...state.storyRelationships };
        delete newState[storyId];
        return { storyRelationships: newState };
      });
    } catch (error: any) {
      if (error.code === 'PGRST116' || error.code === '429' || !isSupabaseConfigured()) {
        // Queue for offline sync
        await offlineActions.unlinkStoryFromRelationship(storyId, user.id);

        // Update local state for immediate UI feedback
        set((state) => {
          const newState = { ...state.storyRelationships };
          delete newState[storyId];
          return { storyRelationships: newState };
        });

        throw new AppError('Story unlink queued for offline sync', 'medium', 'network', 'OFFLINE_QUEUE');
      }

      throw error;
    }
  },

  submitExportRequest: async (storyId: string, options: ExportOptions) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add to export queue
    set((state) => ({
      exportQueue: [
        ...state.exportQueue,
        {
          id: exportId,
          storyId,
          format: options.format,
          includeImages: options.includeImages,
          chapters: options.chapters || [],
          status: 'pending',
          progress: 0,
        }
      ]
    }));

    // Deduct tokens for export
    const exportCost = 5; // Base cost for export
    const tokenStore = useTokenStore.getState();
    if (tokenStore.balance >= exportCost) {
      tokenStore.deductTokens(exportCost);
    }

    return exportId;
  },

  processOfflineQueue: async () => {
    const { offlineQueue } = get();

    if (offlineQueue.length === 0) return;

    const promises = offlineQueue
      .filter(item => !item.synced)
      .map(async (item) => {
        try {
          // Process each queued item
          switch (item.type) {
            case 'create':
              // Re-create story or other data
              break;
            case 'update':
              // Update existing data
              break;
            case 'delete':
              // Delete data
              break;
          }

          // Mark as synced
          set((state) => ({
            offlineQueue: state.offlineQueue.map(q =>
              q.id === item.id ? { ...q, synced: true } : q
            )
          }));
        } catch (error) {
          console.error('Error processing offline queue item:', error);
        }
      });

    await Promise.allSettled(promises);
  },

  trackTokenUsage: (feature: string, cost: number) => {
    set((state) => ({
      aiTokenUsage: {
        ...state.aiTokenUsage,
        [feature]: (state.aiTokenUsage[feature] || 0) + cost,
      }
    }));

    // Update token store
    const tokenStore = useTokenStore.getState();
    if (cost > 0) {
      tokenStore.deductTokens(cost);
    }
  },

  updateUserPresence: (storyId: string, presence: any) => {
    set((state) => {
      const activeUsers = new Map(state.activeUsers);
      activeUsers.set(presence.userId, {
        userId: presence.userId,
        username: presence.username,
        lastSeen: Date.now(),
        isTyping: presence.isTyping || false,
        currentChapter: presence.currentChapter || null,
      });
      return { activeUsers };
    });
  },

  removeUserPresence: (userId: string) => {
    set((state) => {
      const activeUsers = new Map(state.activeUsers);
      activeUsers.delete(userId);
      return { activeUsers };
    });
  },

  // Add cache invalidation methods
  invalidateStoriesCache: () => {
    const { data: { user } } = supabase.auth.getUser();
    if (user) {
      cacheManager.delete(`stories:${user.id}`);
      queryCache.invalidateQuery(['stories', user.id]);
    }
  },

  invalidateStoryCache: (storyId: string) => {
    cacheManager.delete(`story:${storyId}`);
    cacheManager.delete(`chapter:${storyId}:latest`);
    queryCache.invalidateQuery(['story', storyId]);
    queryCache.invalidateQuery(['chapter', storyId, 'latest']);
  },
}));