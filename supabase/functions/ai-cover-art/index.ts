import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CoverArtRequest {
  prompt: string
  storyTitle?: string
  style?: string
  width?: number
  height?: number
  userId?: string
  storyId?: string
}

interface OpenAIResponse {
  data: Array<{
    url: string
    revised_prompt?: string
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { prompt, storyTitle, style = 'professional book cover', width = 1024, height = 1024, userId, storyId }: CoverArtRequest = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const enhancedPrompt = storyTitle
      ? `Book cover for "${storyTitle}": ${prompt}. Professional book cover design, ${style}, high quality, detailed illustration, cinematic lighting`
      : `Professional book cover: ${prompt}. ${style}, high quality, detailed illustration, cinematic lighting`

    // Cache check
    const cacheKey = `cover-art:${Buffer.from(enhancedPrompt).toString('base64')}`
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

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: `${width}x${height}`,
        quality: 'hd',
        response_format: 'url',
        user: userId,
      }),
    })

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text()
      console.error('OpenAI API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to generate cover art' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const openAIResult: OpenAIResponse = await openAIResponse.json()

    // Save to cache
    await supabaseClient
      .from('ai_cache')
      .insert({
        cache_key: cacheKey,
        request: enhancedPrompt,
        response: openAIResult,
        type: 'cover-art',
        user_id: userId,
        story_id: storyId,
        cost: 0.04, // DALL-E 3 cost estimate
      })

    // Log usage
    if (userId) {
      await supabaseClient.rpc('log_ai_usage', {
        p_user_id: userId,
        p_function_name: 'ai-cover-art',
        p_tokens_used: 0,
        p_cost: 0.04,
        p_story_id: storyId,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: openAIResult,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Cover art generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})