import { supabase } from './supabase';

// AI Request/Response types

export interface AICoverArtRequest {
  prompt: string;
  storyTitle?: string;
  style?: string;
  width?: number;
  height?: number;
  userId?: string;
  storyId?: string;
}

export interface AICoverArtResponse {
  success: boolean;
  data?: {
    data: Array<{
      url: string;
      revised_prompt?: string;
    }>;
  };
  error?: string;
  cached?: boolean;
}

export interface AIStorySummaryRequest {
  storyContent: string;
  title?: string;
  style?: 'short' | 'detailed' | 'tagline';
  maxLength?: number;
  userId?: string;
  storyId?: string;
}

export interface AIStorySummaryResponse {
  success: boolean;
  data?: {
    summary: string;
  };
  error?: string;
  cached?: boolean;
  tokens_used?: number;
  estimated_cost?: number;
}

export interface AICharacterAvatarRequest {
  characterName: string;
  characterDescription: string;
  age?: string;
  gender?: string;
  style?: 'realistic' | 'cartoon' | 'anime' | 'fantasy';
  width?: number;
  height?: number;
  userId?: string;
  storyId?: string;
}

export interface AICharacterAvatarResponse {
  success: boolean;
  data?: {
    data: Array<{
      url: string;
    }>;
  };
  error?: string;
  cached?: boolean;
  character_name?: string;
}

export interface AINarrativeAnalysisRequest {
  storyContent: string;
  chapterId?: string;
  userId?: string;
  storyId?: string;
  includeDetailedBreakdown?: boolean;
}

export interface AINarrativeAnalysisResponse {
  success: boolean;
  data?: {
    narrative_structure?: {
      arc_status: string;
      pacing_assessment: string;
      tension_level: number;
    };
    character_analysis?: {
      main_character_development: string;
      relationship_dynamics: string;
      character_depth: number;
    };
    writing_style?: {
      tone: string;
      dialogue_effectiveness: number;
      description_quality: number;
      pacing: string;
    };
    themes?: string[];
    suggestions?: string[];
    overall_score?: {
      storytelling: number;
      character_development: number;
      writing_quality: number;
    };
  };
  error?: string;
  cached?: boolean;
  tokens_used?: number;
  estimated_cost?: number;
  chapter_id?: string;
}

export interface AIStyleTransferRequest {
  text: string;
  targetStyle: 'romantic' | 'playful' | 'dramatic' | 'mysterious' | 'humorous' | 'gothic' | 'modern' | 'classical';
  preserveMeaning?: boolean;
  userId?: string;
  storyId?: string;
  chapterId?: string;
}

export interface AIStyleTransferResponse {
  success: boolean;
  data?: {
    original_text: string;
    transformed_text?: string;
    style: string;
    length_change?: string;
    original_words?: number;
    transformed_words?: number;
  };
  error?: string;
  cached?: boolean;
  tokens_used?: number;
  estimated_cost?: number;
}

export interface AICharacterConsistencyRequest {
  storyId: string;
  chapterId?: string;
  checkNewContent?: string;
  userId?: string;
  action?: 'check' | 'analyze' | 'update';
}

export interface AICharacterConsistencyResponse {
  success: boolean;
  data?: {
    characters?: Array<{
      id?: string;
      name: string;
      description: string;
      traits: any[];
      relationships: any[];
      appearances: any[];
      consistency_issues: any[];
    }>;
    issues?: Array<{
      character?: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
      suggestion?: string;
    }>;
    suggestions?: string[];
    consistency_score?: number;
    status?: string;
    new_content_check?: {
      content_preview: string;
      issues: any[];
      safe: boolean;
    };
  };
  error?: string;
  cached?: boolean;
}

export interface AIUsageStats {
  total_cost: number;
  total_tokens: number;
  function_calls: {
    [key: string]: {
      count: number;
      total_cost: number;
      last_used: string;
    };
  };
}

// Internal type for AI usage records
interface AIUsageRecord {
  id: string;
  user_id: string;
  function_name: string;
  cost?: number;
  tokens_used?: number;
  created_at: string;
}

class AIClient {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultCacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  private generateCacheKey(functionName: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join('|');
    return `${functionName}:${sortedParams}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.defaultCacheTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async callAIFunction<T>(
    functionName: string,
    request: any,
    useCache: boolean = true
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(functionName, request);

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: request,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'AI function failed');
      }

      // Cache the successful response
      if (useCache && data.data) {
        this.setCache(cacheKey, data.data);
      }

      return data.data as T;
    } catch (error) {
      console.error(`AI Function ${functionName} error:`, error);
      throw error;
    }
  }

  // Cover Art Generation
  async generateCoverArt(request: AICoverArtRequest): Promise<AICoverArtResponse> {
    return this.callAIFunction('ai-cover-art', request);
  }

  // Story Summarization
  async generateStorySummary(request: AIStorySummaryRequest): Promise<AIStorySummaryResponse> {
    return this.callAIFunction('ai-story-summary', request);
  }

  // Character Avatar Generation
  async generateCharacterAvatar(request: AICharacterAvatarRequest): Promise<AICharacterAvatarResponse> {
    return this.callAIFunction('ai-character-avatar', request);
  }

  // Narrative Analysis
  async analyzeNarrative(request: AINarrativeAnalysisRequest): Promise<AINarrativeAnalysisResponse> {
    return this.callAIFunction('ai-narrative-analysis', request);
  }

  // Style Transfer
  async transferStyle(request: AIStyleTransferRequest): Promise<AIStyleTransferResponse> {
    return this.callAIFunction('ai-style-transfer', request);
  }

  // Character Consistency Check
  async checkCharacterConsistency(request: AICharacterConsistencyRequest): Promise<AICharacterConsistencyResponse> {
    return this.callAIFunction('ai-character-consistency', request);
  }

  // Helper methods
  async clearCache(): Promise<void> {
    this.cache.clear();
  }

  async getUsageStats(userId: string): Promise<AIUsageStats> {
    try {
      const { data, error } = await supabase
        .from('ai_usage')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .returns<AIUsageRecord[]>();

      if (error) throw error;

      const stats: AIUsageStats = {
        total_cost: 0,
        total_tokens: 0,
        function_calls: {},
      };

      data?.forEach((usage) => {
        stats.total_cost += usage.cost || 0;
        stats.total_tokens += usage.tokens_used || 0;

        const functionName = usage.function_name;
        if (!stats.function_calls[functionName]) {
          stats.function_calls[functionName] = {
            count: 0,
            total_cost: 0,
            last_used: '',
          };
        }

        stats.function_calls[functionName].count += 1;
        stats.function_calls[functionName].total_cost += usage.cost || 0;

        if (
          !stats.function_calls[functionName].last_used ||
          new Date(usage.created_at) > new Date(stats.function_calls[functionName].last_used)
        ) {
          stats.function_calls[functionName].last_used = usage.created_at;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw error;
    }
  }

  // Batch operations
  async generateMultipleVariations(
    prompt: string,
    count: number = 3,
    options: {
      style?: string;
      width?: number;
      height?: number;
    } = {}
  ): Promise<AICoverArtResponse[]> {
    const requests = Array.from({ length: count }, (_, i) => ({
      prompt: `${prompt} (variation ${i + 1})`,
      ...options,
    }));

    const results = await Promise.allSettled(requests.map((req) => this.generateCoverArt(req)));

    return results
      .filter((result): result is PromiseFulfilledResult<AICoverArtResponse> =>
        result.status === 'fulfilled' && result.value.success
      )
      .map((result) => result.value);
  }

  async analyzeStoryChapters(
    storyId: string,
    chapterIds: string[],
    userId: string
  ): Promise<AINarrativeAnalysisResponse[]> {
    const results = await Promise.allSettled(
      chapterIds.map((chapterId) =>
        this.analyzeNarrative({
          storyContent: '', // This would be fetched separately
          chapterId,
          userId,
          storyId,
          includeDetailedBreakdown: true,
        })
      )
    );

    return results
      .filter((result): result is PromiseFulfilledResult<AINarrativeAnalysisResponse> =>
        result.status === 'fulfilled' && result.value.success
      )
      .map((result) => result.value);
  }
}

// Export singleton instance
export const aiClient = new AIClient();
