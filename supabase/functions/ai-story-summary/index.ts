import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Content safety check
    const moderationCheck = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: storyContent.substring(0, 1000) // Check first 1000 characters
      }),
    })

    const moderationResult = await moderationCheck.json()
    if (moderationResult.results[0]?.flagged) {
      return new Response(
        JSON.stringify({ error: 'Content violates safety guidelines' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Cache check
    const contentHash = Buffer.from(storyContent).toString('base64').substring(0, 32)
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

    const fullPrompt = title
      ? `Story: "${title}"\n\n${storyContent.substring(0, 4000)}`
      : storyContent.substring(0, 4000)

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo-16k',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: maxLength * 2,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    })

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text()
      console.error('OpenAI API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to generate summary' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const openAIResult = await openAIResponse.json()
    const summary = openAIResult.choices[0]?.message?.content || 'Failed to generate summary'

    // Calculate estimated tokens used
    const tokensUsed = openAIResult.usage?.total_tokens || 0
    const estimatedCost = (tokensUsed / 1000) * 0.003 // gpt-3.5-turbo cost

    // Save to cache
    await supabaseClient
      .from('ai_cache')
      .insert({
        cache_key: cacheKey,
        request: fullPrompt,
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
        p_tokens_used: tokensUsed,
        p_cost: estimatedCost,
        p_story_id: storyId,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { summary },
        cached: false,
        tokens_used: tokensUsed,
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