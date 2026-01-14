// supabase/functions/ai-story-summary/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SummaryRequest {
  storyContent: string
  title?: string
  style?: 'short' | 'detailed' | 'tagline'
  maxLength?: number
  userId?: string
  storyId?: string
}

// Helper function to sanitize user input to prevent prompt injection
function sanitizeInput(input: string): string {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { storyContent, title, style = 'short', maxLength = 200, userId, storyId }: SummaryRequest = await req.json()

    if (!storyContent) {
      return new Response(
        JSON.stringify({ error: 'Story content is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Cache check
    const sanitizedContent = sanitizeInput(storyContent);
    const contentHash = btoa(sanitizedContent).substring(0, 32)
    const cacheKey = `summary:${contentHash}:${style}:${maxLength}`
    const cachedResponse = await supabaseClient
      .from('ai_cache')
      .select('response')
      .eq('cache_key', cacheKey)
      .single()

    if (cachedResponse.data) {
      return new Response(
        JSON.stringify({
          success: true,
          data: cachedResponse.data.response,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Prepare prompt
    let systemPrompt = ''
    switch (style) {
      case 'tagline':
        systemPrompt = 'Create a compelling tagline or one-sentence summary for this story. Make it engaging and mysterious.'
        break
      case 'detailed':
        systemPrompt = `Write a detailed summary of this story (maximum ${maxLength} words). Include the main plot, setting, key characters, and themes. Make it engaging and spoiler-free.`
        break
      default:
        systemPrompt = `Write a short summary of this story (around ${maxLength} words). Include the main plot and protagonist. Make it engaging and spoiler-free.`
    }

    const fullPrompt = `${systemPrompt}\n\n${title ? `Story: "${title}"\n\n` : ''}${sanitizedContent.substring(0, 12000)}`;

    // Call Gemini API
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxLength * 2,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text()
      console.error('Gemini API error:', error)
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();

    // Check for safety blocks
    if (geminiData.promptFeedback?.blockReason) {
      return new Response(
        JSON.stringify({ error: 'Content violates safety guidelines' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const summary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate summary'

    // Save to cache
    const estimatedCost = 0.0001; // Gemini 2.0 Flash is extremely cheap

    await supabaseClient
      .from('ai_cache')
      .insert({
        cache_key: cacheKey,
        request: fullPrompt.substring(0, 500),
        response: { summary },
        type: 'story-summary',
        user_id: userId,
        story_id: storyId,
        cost: estimatedCost,
      })

    // Log usage
    if (userId) {
      await supabaseClient.rpc('log_ai_usage', {
        p_user_id: userId,
        p_function_name: 'ai-story-summary',
        p_tokens_used: 0,
        p_cost: estimatedCost,
        p_story_id: storyId,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { summary },
        cached: false,
        estimated_cost: estimatedCost
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Story summary generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
