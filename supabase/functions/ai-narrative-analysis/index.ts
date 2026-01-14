import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  storyContent: string
  chapterId?: string
  userId?: string
  storyId?: string
  includeDetailedBreakdown?: boolean
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
      storyContent,
      chapterId,
      userId,
      storyId,
      includeDetailedBreakdown = false
    }: AnalysisRequest = await req.json()

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
        input: storyContent.substring(0, 1000)
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
    const cacheKey = `narrative-analysis:${contentHash}:${includeDetailedBreakdown}`
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

    // Prepare detailed prompt
    const analysisPrompt = `
Analyze the following narrative content and provide insights:

Story Content:
${storyContent.substring(0, 8000)}

${includeDetailedBreakdown ? `
Please provide a comprehensive analysis covering:

1. **Story Arc Analysis:**
   - Identify the inciting incident, rising action, climax, falling action, and resolution
   - Plot pacing and tension analysis
   - Narrative structure assessment

2. **Character Development:**
   - Main character traits and evolution
   - Character relationships dynamics
   - Character motivations and growth

3. **Writing Style Analysis:**
   - Tone and mood assessment
   - Dialogue effectiveness
   - Description quality
   - Pacing and rhythm

4. **Themes and Motifs:**
   - Identified themes
   - Symbolic elements
   - Underlying messages

5. **Strengths and Improvement Areas:**
   - What works well
   - Suggested improvements
   - Common storytelling patterns

Provide specific examples from the text to support your analysis. Use bullet points for clarity and maintain a constructive tone.
` : `
Please provide a concise analysis of:
- Overall narrative structure
- Character development status
- Writing style assessment
- Key themes and suggestions for improvement
`}

Format your response as JSON with these fields:
{
  "narrative_structure": {
    "arc_status": "string",
    "pacing_assessment": "string",
    "tension_level": "number"
  },
  "character_analysis": {
    "main_character_development": "string",
    "relationship_dynamics": "string",
    "character_depth": "number"
  },
  "writing_style": {
    "tone": "string",
    "dialogue_effectiveness": "number",
    "description_quality": "number",
    "pacing": "string"
  },
  "themes": ["string"],
  "suggestions": ["string"],
  "overall_score": {
    "storytelling": "number",
    "character_development": "number",
    "writing_quality": "number"
  }
}
`

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert literary analyst. Provide thoughtful, detailed analysis of narrative content.' },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        top_p: 1,
      }),
    })

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text()
      console.error('OpenAI API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to generate narrative analysis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const openAIResult = await openAIResponse.json()
    let analysis: any

    try {
      // Extract JSON from response
      const responseText = openAIResult.choices[0]?.message?.content || '{}'
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Invalid JSON response')
      }
    } catch (parseError) {
      // Fallback to structured format
      analysis = {
        narrative_structure: {
          arc_status: 'Analysis incomplete',
          pacing_assessment: 'Unable to assess',
          tension_level: 0
        },
        character_analysis: {
          main_character_development: 'Analysis unavailable',
          relationship_dynamics: 'Analysis unavailable',
          character_depth: 0
        },
        writing_style: {
          tone: 'Analysis unavailable',
          dialogue_effectiveness: 0,
          description_quality: 0,
          pacing: 'Analysis unavailable'
        },
        themes: [],
        suggestions: ['Unable to generate detailed analysis due to response format'],
        overall_score: {
          storytelling: 0,
          character_development: 0,
          writing_quality: 0
        }
      }
    }

    const tokensUsed = openAIResult.usage?.total_tokens || 0
    const estimatedCost = (tokensUsed / 1000) * 0.03 // gpt-4 cost

    // Save to cache
    await supabaseClient
      .from('ai_cache')
      .insert({
        cache_key: cacheKey,
        request: analysisPrompt,
        response: analysis,
        type: 'narrative-analysis',
        user_id: userId,
        story_id: storyId,
        metadata: {
          chapter_id: chapterId,
          detailed_breakdown: includeDetailedBreakdown
        },
        cost: estimatedCost,
      })

    // Save analysis result to story_analyses table
    if (userId && storyId) {
      await supabaseClient
        .from('story_analyses')
        .upsert({
          user_id: userId,
          story_id: storyId,
          chapter_id: chapterId,
          analysis_data: analysis,
          tokens_used: tokensUsed,
          cost: estimatedCost,
          generated_at: new Date().toISOString(),
        })
    }

    // Log usage
    if (userId) {
      await supabaseClient.rpc('log_ai_usage', {
        p_user_id: userId,
        p_function_name: 'ai-narrative-analysis',
        p_tokens_used: tokensUsed,
        p_cost: estimatedCost,
        p_story_id: storyId,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: analysis,
        cached: false,
        tokens_used: tokensUsed,
        estimated_cost: estimatedCost,
        chapter_id: chapterId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Narrative analysis error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})