// supabase/functions/ai-style-transfer/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StyleTransferRequest {
  text: string
  targetStyle: 'romantic' | 'playful' | 'dramatic' | 'mysterious' | 'humorous' | 'gothic' | 'modern' | 'classical'
  preserveMeaning?: boolean
  userId?: string
  storyId?: string
  chapterId?: string
}

const stylePrompts = {
  romantic: 'Rewrite with a romantic tone. Use poetic language, tender emotions, beautiful descriptions, and heartfelt expressions. Focus on love, passion, and emotional depth.',
  playful: 'Rewrite with a playful and light-hearted tone. Use humor, wit, and creative wordplay. Make it fun and engaging while maintaining the original meaning.',
  dramatic: 'Rewrite with a dramatic and intense tone. Use powerful language, emotional impact, and heightened emotions. Build tension and create vivid imagery.',
  mysterious: 'Rewrite with a mysterious tone. Use enigmatic language, subtle hints, and create an atmosphere of intrigue and suspense.',
  humorous: 'Rewrite with a humorous tone. Include jokes, witty remarks, and comedic timing while preserving the original message.',
  gothic: 'Rewrite with a gothic tone. Use dark imagery, atmospheric descriptions, and a sense of foreboding. Create a mysterious and ominous atmosphere.',
  modern: 'Rewrite with a modern, contemporary tone. Use current language, crisp sentences, and a direct approach. Make it relatable and contemporary.',
  classical: 'Rewrite with a classical tone. Use elegant prose, formal language, and structured sentences. Create a sophisticated and timeless feel.'
}

serve(async (req: Request) => {
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

    const {
      text,
      targetStyle,
      preserveMeaning = true,
      userId,
      storyId,
      chapterId
    }: StyleTransferRequest = await req.json()

    if (!text || !targetStyle) {
      return new Response(
        JSON.stringify({ error: 'Text and target style are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!stylePrompts[targetStyle as keyof typeof stylePrompts]) {
      return new Response(
        JSON.stringify({ error: 'Invalid target style' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Cache check
    const cacheKey = `style-transfer:${btoa(text.substring(0, 100) + targetStyle)}`
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

    const stylePrompt = stylePrompts[targetStyle as keyof typeof stylePrompts]
    const fullPrompt = `Original Text: "${text}"\n\nStyle Instructions: ${stylePrompt}\n\n${preserveMeaning ? 'Important: Preserve the original meaning and core facts.' : 'Feel free to adapt the content slightly for the style.'}\n\nPlease rewrite the text in the specified style. Return only the rewritten text.`;

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

    if (geminiData.promptFeedback?.blockReason) {
      return new Response(
        JSON.stringify({ error: 'Content violates safety guidelines' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const transformedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || text
    const estimatedCost = 0.0001;

    // Save to cache
    await supabaseClient
      .from('ai_cache')
      .insert({
        cache_key: cacheKey,
        request: { original_text: text.substring(0, 500), style: targetStyle },
        response: { transformed_text: transformedText, style: targetStyle },
        type: 'style-transfer',
        user_id: userId,
        story_id: storyId,
        metadata: {
          chapter_id: chapterId,
          preserve_meaning: preserveMeaning
        },
        cost: estimatedCost,
      })

    // Log usage
    if (userId) {
      await supabaseClient.rpc('log_ai_usage', {
        p_user_id: userId,
        p_function_name: 'ai-style-transfer',
        p_tokens_used: 0,
        p_cost: estimatedCost,
        p_story_id: storyId,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          original_text: text,
          transformed_text: transformedText,
          style: targetStyle,
        },
        cached: false,
        estimated_cost: estimatedCost
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Style transfer error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
