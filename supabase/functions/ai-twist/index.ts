// supabase/functions/ai-twist/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface TwistRequest {
  storyContext: string;
  recentChapters: string[];
  context?: string;
}

interface TwistResponse {
  twists: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Validate POST method
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
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

    // Check rate limit (simple implementation)
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (usage && usage.count >= 10) {
      return new Response(JSON.stringify({ error: 'Daily AI limit reached (10 calls per day)' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { storyContext, recentChapters, context }: TwistRequest = await req.json();

    const prompt = `Given this story context: "${storyContext}"
Recent chapters: ${recentChapters.map((c, i) => `Chapter ${i + 1}: ${c}`).join('\n')}
${context ? `Real-life context: "${context}"` : ''}

Suggest 2-3 plot twists that would surprise and delight a couple writing this story together.
Each twist should be 1-2 sentences max. Consider their real-life context if provided.
Return as a JSON array of strings, like: ["twist 1", "twist 2", "twist 3"]`;

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 500 },
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

    // Parse JSON response
    let twists: string[] = [];
    try {
      twists = JSON.parse(responseText);
    } catch {
      // Fallback: extract from text
      twists = responseText
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .slice(0, 3);
    }

    // Record usage
    if (usage) {
      await supabase
        .from('ai_usage')
        .update({ count: usage.count + 1 })
        .eq('user_id', user.id)
        .eq('date', today);
    } else {
      await supabase
        .from('ai_usage')
        .insert({ user_id: user.id, date: today, count: 1 });
    }

    return new Response(JSON.stringify({ twists }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-twist function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
