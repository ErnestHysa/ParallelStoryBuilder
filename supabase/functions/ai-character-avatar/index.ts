import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AvatarRequest {
  characterName: string
  characterDescription: string
  age?: string
  gender?: string
  style?: 'realistic' | 'cartoon' | 'anime' | 'fantasy'
  width?: number
  height?: number
  userId?: string
  storyId?: string
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

    const {
      characterName,
      characterDescription,
      age,
      gender,
      style = 'realistic',
      width = 512,
      height = 512,
      userId,
      storyId
    }: AvatarRequest = await req.json()

    if (!characterName || !characterDescription) {
      return new Response(
        JSON.stringify({ error: 'Character name and description are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Content safety check
    const moderationCheck = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: `${characterName}: ${characterDescription}`
      }),
    })

    const moderationResult = await moderationCheck.json()
    if (moderationResult.results[0]?.flagged) {
      return new Response(
        JSON.stringify({ error: 'Character description violates safety guidelines' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create enhanced prompt based on style
    let styleDescription = ''
    switch (style) {
      case 'cartoon':
        styleDescription = 'cartoon character design, Pixar style, vibrant colors'
        break
      case 'anime':
        styleDescription = 'anime character design, Studio Ghibli style, detailed features'
        break
      case 'fantasy':
        styleDescription = 'fantasy character design, epic art style, intricate details'
        break
      default:
        styleDescription = 'photorealistic portrait, professional photography, detailed features'
    }

    const enhancedPrompt = `Portrait of ${characterName}, ${gender || ''} ${age || ''}. ${characterDescription}. Professional character portrait, ${styleDescription}, eye-level view, studio lighting, high quality, detailed facial features, expressive eyes`

    // Cache check
    const cacheKey = `avatar:${Buffer.from(enhancedPrompt).toString('base64')}`
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
          cached: true,
          character_name: characterName
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
        JSON.stringify({ error: 'Failed to generate character avatar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const openAIResult = await openAIResponse.json()

    // Save to cache
    await supabaseClient
      .from('ai_cache')
      .insert({
        cache_key: cacheKey,
        request: enhancedPrompt,
        response: openAIResult,
        type: 'character-avatar',
        user_id: userId,
        story_id: storyId,
        metadata: { character_name: characterName, style },
        cost: 0.04, // DALL-E 3 cost estimate
      })

    // Log character usage for consistency tracking
    if (userId && storyId) {
      await supabaseClient
        .from('story_characters')
        .upsert({
          story_id: storyId,
          character_name: characterName,
          character_description: characterDescription,
          avatar_url: openAIResult.data[0]?.url,
          style,
          user_id: userId,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'story_id,character_name'
        })
    }

    // Log usage
    if (userId) {
      await supabaseClient.rpc('log_ai_usage', {
        p_user_id: userId,
        p_function_name: 'ai-character-avatar',
        p_tokens_used: 0,
        p_cost: 0.04,
        p_story_id: storyId,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: openAIResult,
        cached: false,
        character_name: characterName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Character avatar generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})