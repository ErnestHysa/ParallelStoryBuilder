import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface PresenceData {
  id: string;
  email?: string;
  displayName?: string;
  status: 'online' | 'away' | 'idle';
  lastSeen?: number;
  typing: boolean;
  currentChapter?: string;
  currentSection?: string;
}

export interface RealtimeMessage {
  type: 'presence' | 'message' | 'cursor' | 'typing' | 'typing-stop';
  payload: any;
  userId: string;
  timestamp: number;
}

export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private userPresences: Map<string, PresenceData> = new Map();
  private isConnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private presenceUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Setup heartbeat for connection health
    this.setupHeartbeat();
  }

  /**
   * Connect to a realtime channel for a specific story
   */
  async connectToStory(
    storyId: string,
    options: {
      onPresenceChange?: (presence: Map<string, PresenceData>) => void;
      onMessage?: (message: RealtimeMessage) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<RealtimeChannel | null> {
    if (this.channels.has(storyId)) {
      return this.channels.get(storyId) || null;
    }

    try {
      const channel = supabase.channel(`story:${storyId}`);

      // Track presence
      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState<PresenceData>();
        const newPresences = new Map<string, PresenceData>();

        Object.entries(newState).forEach(([key, presence]) => {
          if (Array.isArray(presence)) {
            presence.forEach(p => {
              newPresences.set(p.id, p);
            });
          }
        });

        this.userPresences = newPresences;
        options.onPresenceChange?.(newPresences);
      });

      // Listen for messages
      channel.on('broadcast', { event: 'message' }, (payload) => {
        try {
          const message: RealtimeMessage = {
            type: payload.type || 'message',
            payload: payload.payload,
            userId: payload.userId || 'unknown',
            timestamp: payload.timestamp || Date.now(),
          };
          options.onMessage?.(message);
        } catch (error) {
          console.error('Error processing realtime message:', error);
        }
      });

      // Listen for typing indicators
      channel.on('broadcast', { event: 'typing' }, (payload) => {
        options.onMessage?.({
          type: 'typing',
          payload: payload,
          userId: payload.userId || 'unknown',
          timestamp: Date.now(),
        });
      });

      channel.on('broadcast', { event: 'typing-stop' }, (payload) => {
        options.onMessage?.({
          type: 'typing-stop',
          payload: payload,
          userId: payload.userId || 'unknown',
          timestamp: Date.now(),
        });
      });

      // Listen for errors
      channel.on('broadcast', { event: 'error' }, (payload) => {
        options.onError?.(new Error(payload.error || 'Realtime error'));
      });

      // Subscribe to the channel
      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.channels.set(storyId, channel);
          this.isConnecting = false;
          console.log(`Connected to story ${storyId}`);
        } else if (status === 'CHANNEL_ERROR') {
          options.onError?.(new Error('Failed to connect to realtime channel'));
          this.handleReconnect(storyId);
        } else if (status === 'TIMED_OUT') {
          options.onError?.(new Error('Realtime connection timed out'));
          this.handleReconnect(storyId);
        }
      });

      return channel;
    } catch (error) {
      console.error('Error connecting to realtime channel:', error);
      options.onError?.(error as Error);
      this.handleReconnect(storyId);
      return null;
    }
  }

  /**
   * Disconnect from a realtime channel
   */
  async disconnectFromStory(storyId: string): Promise<void> {
    const channel = this.channels.get(storyId);
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(storyId);
      console.log(`Disconnected from story ${storyId}`);
    }
  }

  /**
   * Update user presence
   */
  updatePresence(
    storyId: string,
    presence: Partial<PresenceData>,
    channel?: RealtimeChannel
  ): Promise<RealtimeChannelSendResponse | null> {
    const targetChannel = channel || this.channels.get(storyId);
    if (!targetChannel) {
      console.warn(`No channel found for story ${storyId}`);
      return null;
    }

    return targetChannel.send({
      type: 'presence',
      payload: presence,
    });
  }

  /**
   * Send a message
   */
  sendMessage(
    storyId: string,
    message: {
      type: string;
      payload: any;
    },
    channel?: RealtimeChannel
  ): Promise<RealtimeChannelSendResponse | null> {
    const targetChannel = channel || this.channels.get(storyId);
    if (!targetChannel) {
      console.warn(`No channel found for story ${storyId}`);
      return null;
    }

    return targetChannel.send({
      type: 'message',
      payload: message,
      userId: this.getCurrentUserId(),
      timestamp: Date.now(),
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(
    storyId: string,
    isTyping: boolean,
    chapterId?: string,
    sectionId?: string,
    channel?: RealtimeChannel
  ): Promise<RealtimeChannelSendResponse | null> {
    const targetChannel = channel || this.channels.get(storyId);
    if (!targetChannel) {
      console.warn(`No channel found for story ${storyId}`);
      return null;
    }

    return targetChannel.send({
      type: isTyping ? 'typing' : 'typing-stop',
      payload: {
        userId: this.getCurrentUserId(),
        chapterId,
        sectionId,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Get current presences
   */
  getPresences(): Map<string, PresenceData> {
    return new Map(this.userPresences);
  }

  /**
   * Get user presence by ID
   */
  getPresence(userId: string): PresenceData | undefined {
    return this.userPresences.get(userId);
  }

  /**
   * Reconnect to a channel if connection fails
   */
  private handleReconnect(storyId: string, attempt = 1): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (attempt > 5) {
      console.error(`Max reconnection attempts reached for story ${storyId}`);
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff

    this.reconnectTimeout = setTimeout(async () => {
      console.log(`Attempting to reconnect to story ${storyId} (attempt ${attempt + 1})`);

      const channel = this.channels.get(storyId);
      if (channel) {
        try {
          await channel.unsubscribe();
          await this.connectToStory(storyId);
        } catch (error) {
          this.handleReconnect(storyId, attempt + 1);
        }
      }
    }, delay);
  }

  /**
   * Setup heartbeat to maintain connection
   */
  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.channels.forEach((channel, storyId) => {
        if (channel.state === 'SUBSCRIBED') {
          // Send a ping to keep connection alive
          channel.send({
            type: 'ping',
            payload: { timestamp: Date.now() },
          }).catch(error => {
            console.error(`Heartbeat failed for story ${storyId}:`, error);
          });
        }
      });
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Get current user ID from Supabase session
   */
  private getCurrentUserId(): string {
    // This would typically come from the auth store
    // For now, return a placeholder
    return 'current-user-id';
  }

  /**
   * Cleanup all connections
   */
  async disconnectAll(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval);
    }

    for (const [storyId, channel] of this.channels.entries()) {
      await this.disconnectFromStory(storyId);
    }

    this.channels.clear();
    this.userPresences.clear();
    this.isConnecting = false;
  }

  /**
   * Check if user is currently typing in a specific chapter
   */
  isUserTyping(storyId: string, userId: string, chapterId?: string): boolean {
    const presence = this.getPresence(userId);
    if (!presence) return false;

    return presence.typing && (!chapterId || presence.currentChapter === chapterId);
  }

  /**
   * Get all users currently typing in a story
   */
  getTypingUsers(storyId: string, chapterId?: string): string[] {
    const typingUsers: string[] = [];

    this.userPresences.forEach((presence, userId) => {
      if (presence.typing && (!chapterId || presence.currentChapter === chapterId)) {
        typingUsers.push(userId);
      }
    });

    return typingUsers;
  }
}

// Singleton instance
export const realtime = new RealtimeManager();