import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Content safety check
    const moderationCheck = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text.substring(0, 1000)
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
    const cacheKey = `style-transfer:${Buffer.from(text + targetStyle).toString('base64')}`
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

    const fullPrompt = `
Original Text:
${text}

Style Instructions:
${stylePrompt}

${preserveMeaning ? 'Important: Preserve the original meaning, plot points, and factual information of the text. Only change the tone, style, and emotional quality.' : 'Feel free to adapt the content to better suit the target style, while maintaining core narrative elements.'}

Please rewrite the text in the specified style. Return only the rewritten text.
`

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a skilled writer specializing in different writing styles. Rewrite text while maintaining or adapting meaning as requested.' },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: Math.max(text.length * 2, 1000),
        temperature: 0.7,
        top_p: 1,
      }),
    })

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text()
      console.error('OpenAI API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to transform text style' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const openAIResult = await openAIResponse.json()
    const transformedText = openAIResult.choices[0]?.message?.content || text

    const tokensUsed = openAIResult.usage?.total_tokens || 0
    const estimatedCost = (tokensUsed / 1000) * 0.002 // gpt-3.5-turbo cost

    // Compare original and transformed text
    const wordsOriginal = text.split(' ').length
    const wordsTransformed = transformedText.split(' ').length
    const lengthChange = ((wordsTransformed - wordsOriginal) / wordsOriginal * 100).toFixed(1)

    // Save to cache
    await supabaseClient
      .from('ai_cache')
      .insert({
        cache_key: cacheKey,
        request: { original_text: text, style: targetStyle },
        response: { transformed_text: transformedText, style: targetStyle },
        type: 'style-transfer',
        user_id: userId,
        story_id: storyId,
        metadata: {
          chapter_id: chapterId,
          preserve_meaning: preserveMeaning,
          length_change: lengthChange,
          original_words: wordsOriginal,
          transformed_words: wordsTransformed
        },
        cost: estimatedCost,
      })

    // Log style usage
    if (userId && storyId) {
      await supabaseClient
        .from('style_usage')
        .upsert({
          user_id: userId,
          story_id: storyId,
          chapter_id: chapterId,
          style: targetStyle,
          original_length: wordsOriginal,
          transformed_length: wordsTransformed,
          usage_count: 1,
          last_used: new Date().toISOString(),
        }, {
          onConflict: 'user_id,story_id,chapter_id,style'
        })
    }

    // Log usage
    if (userId) {
      await supabaseClient.rpc('log_ai_usage', {
        p_user_id: userId,
        p_function_name: 'ai-style-transfer',
        p_tokens_used: tokensUsed,
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
          length_change: `${lengthChange}%`,
          original_words: wordsOriginal,
          transformed_words: wordsTransformed
        },
        cached: false,
        tokens_used: tokensUsed,
        estimated_cost: estimatedCost
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Style transfer error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})