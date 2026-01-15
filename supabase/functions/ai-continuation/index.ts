// supabase/functions/ai-continuation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface ContinuationRequest {
  storyContext: string;
  recentChapters: string[];
  theme: string;
}

interface ContinuationResponse {
  suggestions: string[];
}

// Security constants
const MAX_STORY_CONTEXT_LENGTH = 1000;
const MAX_CHAPTER_LENGTH = 5000;
const MAX_CHAPTERS = 10;
const MAX_REQUEST_SIZE = 1_048_576; // 1MB in bytes

// Allowed themes - validated against this list
const ALLOWED_THEMES = ['romance', 'fantasy', 'our_future'] as const;
type Theme = typeof ALLOWED_THEMES[number];

// Rate limit
const DAILY_RATE_LIMIT = 10;

// Helper function to sanitize user input to prevent prompt injection
function sanitizeInput(input: string): string {
  // Remove potential prompt injection patterns
  return input
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove any HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

// Helper function to get CORS headers with proper origin validation
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [];
  const requestOrigin = origin || '';

  // Default allowed origins for local development
  const defaultLocalOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8081',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://192.168.1.1:8081',
    'exp://192.168.1.1:8081',
    'exp://127.0.0.1:8081',
  ];

  const allAllowedOrigins = [...defaultLocalOrigins, ...allowedOrigins];

  // Validate origin against allowed list
  const validOrigin = allAllowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0] || requestOrigin || '*';

  return {
    'Access-Control-Allow-Origin': validOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Helper function to validate GEMINI_API_KEY
function validateApiKey(): string {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return apiKey;
}

// Helper function to check request size
function validateRequestSize(req: Request): void {
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_REQUEST_SIZE) {
      throw new Error(`Request size exceeds ${MAX_REQUEST_SIZE} bytes`);
    }
  }
}

// Helper function to validate theme
function validateTheme(theme: string): Theme {
  if (!ALLOWED_THEMES.includes(theme as Theme)) {
    throw new Error(`Invalid theme. Must be one of: ${ALLOWED_THEMES.join(', ')}`);
  }
  return theme as Theme;
}

// Helper function for atomic rate limit check and increment
async function checkAndIncrementRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  date: string
): Promise<{ allowed: boolean; currentCount: number }> {
  // Use PostgreSQL's atomic operations to prevent race conditions
  const { data, error } = await supabase.rpc('increment_ai_usage', {
    p_user_id: userId,
    p_date: date,
    p_limit: DAILY_RATE_LIMIT,
  });

  if (error) {
    console.error('Rate limit check error:', error);
    // Fallback to manual implementation if RPC doesn't exist
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (usage && usage.count >= DAILY_RATE_LIMIT) {
      return { allowed: false, currentCount: usage.count };
    }

    // Increment or create
    if (usage) {
      await supabase
        .from('ai_usage')
        .update({ count: usage.count + 1 })
        .eq('user_id', userId)
        .eq('date', date);
    } else {
      await supabase
        .from('ai_usage')
        .insert({ user_id: userId, date, count: 1 });
    }

    return { allowed: true, currentCount: usage ? usage.count + 1 : 1 };
  }

  return { allowed: data?.allowed ?? false, currentCount: data?.count ?? 0 };
}

serve(async (req) => {
  // Validate GEMINI_API_KEY at function start
  let geminiApiKey: string;
  try {
    geminiApiKey = validateApiKey();
  } catch (error) {
    console.error('API key validation error:', error);
    return new Response(JSON.stringify({ error: 'Service configuration error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
    });
  }

  // Get CORS headers with origin validation
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Validate POST method
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    // Validate request size before parsing JSON
    try {
      validateRequestSize(req);
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit (atomic operation)
    const today = new Date().toISOString().split('T')[0];
    const rateLimitResult = await checkAndIncrementRateLimit(supabase, user.id, today);

    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: `Daily AI limit reached (${DAILY_RATE_LIMIT} calls per day)`,
        count: rateLimitResult.currentCount
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { storyContext, recentChapters, theme }: ContinuationRequest = await req.json();

    // Validate required fields
    if (!storyContext || typeof storyContext !== 'string') {
      return new Response(JSON.stringify({ error: 'storyContext is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(recentChapters)) {
      return new Response(JSON.stringify({ error: 'recentChapters must be an array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!theme || typeof theme !== 'string') {
      return new Response(JSON.stringify({ error: 'theme is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate theme against allowed values
    let validatedTheme: Theme;
    try {
      validatedTheme = validateTheme(theme);
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate array length
    if (recentChapters.length > MAX_CHAPTERS) {
      return new Response(JSON.stringify({
        error: `recentChapters exceeds maximum of ${MAX_CHAPTERS} items`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate storyContext length
    if (storyContext.length > MAX_STORY_CONTEXT_LENGTH) {
      return new Response(JSON.stringify({
        error: `storyContext exceeds maximum length of ${MAX_STORY_CONTEXT_LENGTH} characters`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (storyContext.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'storyContext cannot be empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate each chapter
    for (let i = 0; i < recentChapters.length; i++) {
      const chapter = recentChapters[i];
      if (typeof chapter !== 'string') {
        return new Response(JSON.stringify({
          error: `recentChapters[${i}] must be a string`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (chapter.length > MAX_CHAPTER_LENGTH) {
        return new Response(JSON.stringify({
          error: `recentChapters[${i}] exceeds maximum length of ${MAX_CHAPTER_LENGTH} characters`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Sanitize inputs to prevent prompt injection
    const sanitizedStoryContext = sanitizeInput(storyContext);
    const sanitizedChapters = recentChapters.map(ch => sanitizeInput(ch));

    const themeGuidance: Record<Theme, string> = {
      romance: 'Keep suggestions romantic, focusing on emotional connection and relationship development.',
      fantasy: 'Include magical elements, adventures, and fantastical possibilities.',
      our_future: 'Keep suggestions grounded in reality, focusing on realistic relationship milestones and shared dreams.',
    };

    // Call Gemini API with API key in header
    const prompt = `Story context: "${sanitizedStoryContext}"
Theme: ${validatedTheme}
Recent chapters: ${sanitizedChapters.map((c, i) => `Chapter ${i + 1}: ${c}`).join('\n')}

${themeGuidance[validatedTheme]}

Suggest 3 potential narrative directions for the next chapter.
Each should be 1-2 sentences max.
Return as a JSON array of strings: ["direction 1", "direction 2", "direction 3"]`;

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 500 },
      }),
    });

    if (!geminiResponse.ok) {
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(responseText);
    } catch {
      suggestions = responseText
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .slice(0, 3);
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-continuation function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
