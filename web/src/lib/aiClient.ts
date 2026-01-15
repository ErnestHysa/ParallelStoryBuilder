import { getSupabaseClient } from './supabase';

// Get Supabase URL for direct fetch calls
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Use the newer publishable key format that bypasses some JWT validation
const SUPABASE_ANON_KEY = 'sb_publishable_F6Qb9Wv_yN6g8yipRXrQOw_NXsMd80u';

// AI Request/Response Types

export interface AIEnhanceRequest {
  content: string;
  storyId?: string;
  features?: string[];
}

export interface AIEnhanceResponse {
  success: boolean;
  data?: {
    enhancedContent: string;
  };
  error?: string;
  cached?: boolean;
}

export interface AIContinuationRequest {
  storyContent: string;
  theme?: 'romance' | 'fantasy' | 'our_future';
  chapterCount?: number;
  storyId?: string;
}

export interface AIContinuationResponse {
  success: boolean;
  data?: {
    suggestions: Array<{
      direction: string;
      content: string;
    }>;
  };
  error?: string;
}

export interface AINarrativeAnalysisRequest {
  storyContent: string;
  chapterId?: string;
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
  tokens_used?: number;
}

export interface AIStyleTransferRequest {
  text: string;
  targetStyle: 'romantic' | 'playful' | 'dramatic' | 'mysterious' | 'humorous' | 'gothic' | 'modern' | 'classical';
  preserveMeaning?: boolean;
  storyId?: string;
  chapterId?: string;
}

export interface AIStyleTransferResponse {
  success: boolean;
  data?: {
    original_text: string;
    transformed_text?: string;
    style: string;
  };
  error?: string;
}

// Enhancement type for web write page
export type EnhancementType = 'sensory' | 'dialogue' | 'emotional' | 'creative';

class AIClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
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

    if (Date.now() - cached.timestamp > this.defaultCacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
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

    const supabase = getSupabaseClient();

    // Get the current session to explicitly pass the auth token
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('You must be logged in to use AI features');
    }

    try {
      // Use direct fetch with both Authorization and apikey headers
      // The sb_publishable key format bypasses PKCE JWT validation issues
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,  // User's JWT
          'apikey': SUPABASE_ANON_KEY,  // Publishable key format
        },
        credentials: 'omit',
        body: JSON.stringify({
          ...request,
          userId: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI Function ${functionName} error response:`, response.status, errorText);
        throw new Error(`AI function error: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Cache the successful response
      if (useCache && data) {
        this.setCache(cacheKey, data);
      }

      return data as T;
    } catch (error) {
      console.error(`AI Function ${functionName} error:`, error);
      throw error;
    }
  }

  // Enhanced content based on type
  async enhanceContent(content: string, type: EnhancementType, storyId?: string): Promise<string> {
    const prompts: Record<EnhancementType, string> = {
      sensory: 'Add vivid sensory details to this text. Enhance descriptions of sight, sound, smell, touch, and taste. Keep the original meaning intact.',
      dialogue: 'Improve the dialogue in this text. Make conversations more natural, engaging, and character-driven. Keep the original meaning intact.',
      emotional: 'Deepen the emotional impact of this text. Add more feeling, depth, and emotional resonance. Keep the original meaning intact.',
      creative: 'Expand this text with creative and imaginative elements. Add vivid imagery, metaphors, or creative flourishes that enhance the narrative.',
    };

    const result = await this.callAIFunction<AIEnhanceResponse>('ai-enhance', {
      content,
      storyId,
      prompt: prompts[type],
      features: [type],
    });

    if (result.success && result.data?.enhancedContent) {
      return result.data.enhancedContent;
    }

    throw new Error(result.error || 'AI enhancement failed');
  }

  // Story continuation
  async getContinuation(request: AIContinuationRequest): Promise<AIContinuationResponse> {
    return this.callAIFunction<AIContinuationResponse>('ai-continuation', request);
  }

  // Narrative analysis
  async analyzeNarrative(request: AINarrativeAnalysisRequest): Promise<AINarrativeAnalysisResponse> {
    return this.callAIFunction<AINarrativeAnalysisResponse>('ai-narrative-analysis', request);
  }

  // Style transfer
  async transferStyle(request: AIStyleTransferRequest): Promise<AIStyleTransferResponse> {
    return this.callAIFunction<AIStyleTransferResponse>('ai-style-transfer', request);
  }

  // Update existing chapter
  async updateChapter(chapterId: string, content: string, contextSnippet?: string): Promise<void> {
    const { getSupabaseClient } = await import('./supabase');
    const supabase = getSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be logged in to update chapters');
    }

    // First verify the user owns this chapter
    const { data: chapter, error: fetchError } = await supabase
      .from('chapters')
      .select('author_id')
      .eq('id', chapterId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    const chapterData = chapter as { author_id: string } | null;
    if (!chapterData) throw new Error('Chapter not found');
    if (chapterData.author_id !== user.id) {
      throw new Error('You can only edit your own chapters');
    }

    // Update the chapter
    const { error: updateError } = await supabase
      .from('chapters')
      .update({
        content,
        context_snippet: contextSnippet || null,
      })
      .eq('id', chapterId);

    if (updateError) throw updateError;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const aiClient = new AIClient();
