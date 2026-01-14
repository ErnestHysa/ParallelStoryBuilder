// supabase/functions/ai-cover-art/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

serve(async (req: Request) => {
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
    const cacheKey = `cover-art:${btoa(enhancedPrompt).substring(0, 32)}`
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

    // Generate Image using Pollinations.ai (free & high quality alternative)
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    const result = {
      data: [{ url: imageUrl }]
    };

    // Save to cache
    const estimatedCost = 0.0001;
    await supabaseClient
      .from('ai_cache')
      .insert({
        cache_key: cacheKey,
        request: enhancedPrompt.substring(0, 500),
        response: result,
        type: 'cover-art',
        user_id: userId,
        story_id: storyId,
        cost: estimatedCost,
      })

    // Log usage
    if (userId) {
      await supabaseClient.rpc('log_ai_usage', {
        p_user_id: userId,
        p_function_name: 'ai-cover-art',
        p_tokens_used: 0,
        p_cost: estimatedCost,
        p_story_id: storyId,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Cover art generation error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
