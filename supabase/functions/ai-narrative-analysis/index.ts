// supabase/functions/ai-narrative-analysis/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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

    // Cache check
    const contentHash = btoa(storyContent.substring(0, 500)).substring(0, 32)
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
    const analysisPrompt = `Analyze the following narrative content and provide insights as an expert literary analyst.
Story Content: "${storyContent.substring(0, 15000)}"

${includeDetailedBreakdown ? 'Provide a comprehensive analysis covering: Story Arc, Character Development, Writing Style, Themes and Motifs, and Strengths/Improvements.' : 'Provide a concise analysis of narrative structure, character development, writing style, and themes.'}

Format your response as a valid JSON object with the following structure:
{
  "narrative_structure": {
    "arc_status": "string",
    "pacing_assessment": "string",
    "tension_level": number (0-100)
  },
  "character_analysis": {
    "main_character_development": "string",
    "relationship_dynamics": "string",
    "character_depth": number (0-100)
  },
  "writing_style": {
    "tone": "string",
    "dialogue_effectiveness": number (0-100),
    "description_quality": number (0-100),
    "pacing": "string"
  },
  "themes": ["string"],
  "suggestions": ["string"],
  "overall_score": {
    "storytelling": number (0-100),
    "character_development": number (0-100),
    "writing_quality": number (0-100)
  }
}
Return ONLY the JSON.`;

    // Call Gemini API
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
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
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let analysis: any;
    try {
      analysis = JSON.parse(responseText.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      throw new Error('Invalid analysis format received from AI');
    }

    const estimatedCost = 0.0002;

    // Save to cache
    await supabaseClient
      .from('ai_cache')
      .insert({
        cache_key: cacheKey,
        request: analysisPrompt.substring(0, 500),
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
          tokens_used: 0,
          cost: estimatedCost,
          generated_at: new Date().toISOString(),
        })
    }

    // Log usage
    if (userId) {
      await supabaseClient.rpc('log_ai_usage', {
        p_user_id: userId,
        p_function_name: 'ai-narrative-analysis',
        p_tokens_used: 0,
        p_cost: estimatedCost,
        p_story_id: storyId,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: analysis,
        cached: false,
        estimated_cost: estimatedCost,
        chapter_id: chapterId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Narrative analysis error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
