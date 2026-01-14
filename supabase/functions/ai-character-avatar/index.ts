// supabase/functions/ai-character-avatar/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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

    // Safety check using Gemini
    const safetyPrompt = `Analyze this character description for safety violations (hate speech, sexual explicitness, or extreme violence): "${characterName}: ${characterDescription}". 
Return ONLY "SAFE" if it is safe, or "UNSAFE: [reason]" if it is not.`;

    const safetyCheck = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: safetyPrompt }] }],
      }),
    });

    const safetyData = await safetyCheck.json();
    const safetyResult = safetyData.candidates?.[0]?.content?.parts?.[0]?.text || 'SAFE';

    if (safetyResult.includes('UNSAFE')) {
      return new Response(
        JSON.stringify({ error: 'Character description violates safety guidelines' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create enhanced prompt
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

    const basePrompt = `Portrait of ${characterName}, ${gender || ''} ${age || ''}. ${characterDescription}. Professional character portrait, ${styleDescription}, eye-level view, studio lighting, high quality, detailed facial features, expressive eyes`;

    // Cache check
    const cacheKey = `avatar:${btoa(basePrompt).substring(0, 32)}`
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

    // Generate Image using Pollinations.ai (free & high quality alternative)
    // Format: https://image.pollinations.ai/prompt/[prompt]?width=[width]&height=[height]&model=[model]&seed=[seed]&nologo=true
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    const result = {
      data: [{ url: imageUrl }]
    };

    // Save to cache
    const estimatedCost = 0.0001; // Effectively free
    await supabaseClient
      .from('ai_cache')
      .insert({
        cache_key: cacheKey,
        request: basePrompt.substring(0, 500),
        response: result,
        type: 'character-avatar',
        user_id: userId,
        story_id: storyId,
        metadata: { character_name: characterName, style },
        cost: estimatedCost,
      })

    // Log character usage
    if (userId && storyId) {
      await supabaseClient
        .from('story_characters')
        .upsert({
          story_id: storyId,
          character_name: characterName,
          character_description: characterDescription,
          avatar_url: imageUrl,
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
        p_cost: estimatedCost,
        p_story_id: storyId,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        cached: false,
        character_name: characterName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Character avatar generation error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
