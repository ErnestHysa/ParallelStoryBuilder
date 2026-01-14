import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConsistencyRequest {
  storyId: string
  chapterId?: string
  checkNewContent?: string
  userId?: string
  action?: 'check' | 'analyze' | 'update'
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
      storyId,
      chapterId,
      checkNewContent,
      userId,
      action = 'analyze'
    }: ConsistencyRequest = await req.json()

    if (!storyId) {
      return new Response(
        JSON.stringify({ error: 'Story ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get all characters for this story
    const { data: characters, error: charactersError } = await supabaseClient
      .from('story_characters')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true })

    if (charactersError) {
      console.error('Error fetching characters:', charactersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!characters || characters.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            characters: [],
            issues: [],
            suggestions: ['No characters found for this story'],
            consistency_score: 100,
            status: 'no_characters'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get all chapters for this story
    const { data: chapters, error: chaptersError } = await supabaseClient
      .from('story_chapters')
      .select('id, title, content')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true })

    if (chaptersError) {
      console.error('Error fetching chapters:', chaptersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch chapters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    let consistencyData: any = {
      characters: characters.map(c => ({
        id: c.id,
        name: c.character_name,
        description: c.character_description,
        traits: [],
        relationships: [],
        appearances: [],
        consistency_issues: []
      })),
      issues: [],
      suggestions: [],
      consistency_score: 100,
      status: 'analyzed'
    }

    // Analyze character consistency
    for (const character of characters) {
      const characterName = character.character_name.toLowerCase()

      // Check all chapters for character mentions
      const appearances: any = []
      const traitReferences: any = {}
      const relationshipReferences: any = {}

      for (const chapter of chapters || []) {
        if (chapter.content) {
          const content = chapter.content.toLowerCase()
          const chapterIndex = (chapters || []).indexOf(chapter) + 1

          // Find character mentions
          const nameMatches = content.match(new RegExp(`\\b${characterName}\\b`, 'gi')) || []
          if (nameMatches.length > 0) {
            appearances.push({
              chapter_id: chapter.id,
              chapter_number: chapterIndex,
              mention_count: nameMatches.length,
              has_description: content.length > 1000 // Simple heuristic for substantial content
            })
          }

          // Extract potential trait references
          const traitPatterns = [
            { pattern: `\\b${characterName}\\s+(is|was|seems|appears|looks)\\s+(\\w+)`, type: 'trait' },
            { pattern: `\\b${characterName}\\s+(has|had|possesses)\\s+(\\w+)`, type: 'possession' },
            { pattern: `\\b${characterName}\\s+(feels|felt|seems|appears)\\s+(\\w+)`, type: 'emotion' }
          ]

          for (const { pattern, type } of traitPatterns) {
            const matches = content.match(new RegExp(pattern, 'gi'))
            if (matches) {
              for (const match of matches) {
                const words = match.toLowerCase().split(' ')
                const traitIndex = words.indexOf('is') !== -1 ? words.indexOf('is') + 1 :
                                 words.indexOf('was') !== -1 ? words.indexOf('was') + 1 :
                                 words.indexOf('has') !== -1 ? words.indexOf('has') + 1 :
                                 words.indexOf('felt') !== -1 ? words.indexOf('felt') + 1 :
                                 words.indexOf('seems') !== -1 ? words.indexOf('seems') + 1 :
                                 words.indexOf('appears') !== -1 ? words.indexOf('appears') + 1 : -1

                if (traitIndex !== -1 && traitIndex < words.length) {
                  const trait = words[traitIndex]
                  if (trait.length > 2 && !traitReferences[trait]) {
                    traitReferences[trait] = {
                      type,
                      chapters: new Set([chapter.id]),
                      contexts: []
                    }
                  }
                  if (traitReferences[trait]) {
                    traitReferences[trait].chapters.add(chapter.id)
                  }
                }
              }
            }
          }
        }
      }

      // Check for inconsistencies in character descriptions
      const originalDescription = character.character_description.toLowerCase()
      const descriptionKeywords = originalDescription.split(/\s+/).filter(w => w.length > 3)

      for (const keyword of descriptionKeywords) {
        let foundInContent = false
        for (const chapter of chapters || []) {
          if (chapter.content && chapter.content.toLowerCase().includes(keyword)) {
            foundInContent = true
            break
          }
        }

        if (!foundInContent && keyword.length > 4) {
          consistencyData.issues.push({
            character: character.character_name,
            issue: `Potential inconsistency: "${keyword}" from original description not found in story content`,
            severity: 'medium',
            suggestion: `Consider adding references to ${keyword} to maintain character consistency`
          })
        }
      }

      // Analyze trait consistency
      const traits = Object.keys(traitReferences)
      const consistencyDataCharacter = consistencyData.characters.find((c: any) => c.name === character.character_name)
      if (consistencyDataCharacter) {
        consistencyDataCharacter.traits = traits.map(trait => ({
          name: trait,
          type: traitReferences[trait].type,
          chapters_in: traitReferences[trait].chapters.size,
          consistency: traitReferences[trait].chapters.size >= (chapters?.length || 0) * 0.7 ? 'high' : 'medium'
        }))

        // Check for contradictory traits
        const emotionalTraits = traits.filter(t => traitReferences[t].type === 'emotion')
        if (emotionalTraits.length > 1) {
          // Simple check for opposite emotions
          const opposites = [
            ['happy', 'sad'], ['angry', 'calm'], ['excited', 'bored'],
            ['confident', 'insecure'], ['brave', 'scared'], ['hopeful', 'hopeless']
          ]

          for (const [pos, neg] of opposites) {
            if (emotionalTraits.includes(pos) && emotionalTraits.includes(neg)) {
              consistencyData.issues.push({
                character: character.character_name,
                issue: `Contradictory emotions: ${pos} and ${neg}`,
                severity: 'high',
                suggestion: 'Consider the character's emotional consistency and development arc'
              })
            }
          }
        }
      }
    }

    // Check for character relationships
    const characterNames = characters.map(c => c.character_name.toLowerCase())
    const relationships: any = {}

    for (const chapter of chapters || []) {
      if (chapter.content) {
        // Find character name pairs
        for (let i = 0; i < characterNames.length; i++) {
          for (let j = i + 1; j < characterNames.length; j++) {
            const name1 = characterNames[i]
            const name2 = characterNames[j]
            const pairKey = `${name1}-${name2}`

            if (chapter.content.toLowerCase().includes(name1) && chapter.content.toLowerCase().includes(name2)) {
              if (!relationships[pairKey]) {
                relationships[pairKey] = {
                  characters: [name1, name2],
                  chapters: new Set(),
                  relationship_type: 'unknown'
                }
              }
              relationships[pairKey].chapters.add(chapter.id)
            }
          }
        }
      }
    }

    // Analyze relationship consistency
    for (const [pairKey, rel] of Object.entries(relationships)) {
      const character1 = characters.find(c => c.character_name.toLowerCase() === rel.characters[0])
      const character2 = characters.find(c => c.character_name.toLowerCase() === rel.characters[1])

      if (character1 && character2) {
        const relCount = rel.chapters.size
        const totalChapters = chapters?.length || 0

        if (relCount / totalChapters < 0.3) {
          consistencyData.issues.push({
            issue: `Characters ${character1.character_name} and ${character2.character_name} rarely interact (${relCount}/${totalChapters} chapters)`,
            severity: 'low',
            suggestion: 'Consider developing their relationship more consistently'
          })
        }
      }
    }

    // Calculate overall consistency score
    let totalIssues = 0
    let highSeverityIssues = 0

    for (const issue of consistencyData.issues) {
      totalIssues++
      if (issue.severity === 'high') highSeverityIssues++
    }

    if (totalIssues > 0) {
      consistencyData.consistency_score = Math.max(0, 100 - (totalIssues * 10) - (highSeverityIssues * 20))
    }

    // Generate suggestions
    if (totalIssues === 0 && characters.length > 1) {
      consistencyData.suggestions.push('Great job maintaining character consistency!')
      consistencyData.suggestions.push('Consider developing character relationships further')
    } else if (consistencyData.consistency_score < 70) {
      consistencyData.suggestions.push('Focus on maintaining consistent character traits and descriptions')
      consistencyData.suggestions.push('Review character development arcs for logical progression')
      if (characters.length > 1) {
        consistencyData.suggestions.push('Develop relationships between characters more consistently')
      }
    } else {
      consistencyData.suggestions.push('Good character consistency overall')
      consistencyData.suggestions.push('Continue to develop character depth and relationships')
    }

    // Check new content if provided
    if (checkNewContent && action === 'check') {
      const newContentIssues = []

      for (const character of characters) {
        const characterName = character.character_name.toLowerCase()
        const content = checkNewContent.toLowerCase()

        // Check if new content contradicts character traits
        const originalTraits = character.character_description.toLowerCase().split(/\s+/)

        for (const trait of originalTraits) {
          if (trait.length > 3) {
            // Look for contradictions
            const negations = ['not', 'never', 'no', 'without', "doesn't", "don't", "isn't", "aren't"]
            const hasNegation = negations.some(neg => content.includes(`${neg} ${trait}`))

            if (hasNegation) {
              newContentIssues.push({
                character: character.character_name,
                issue: `Contradiction: Original character described as "${trait}" but new content suggests otherwise`,
                severity: 'high'
              })
            }
          }
        }
      }

      consistencyData.new_content_check = {
        content_preview: checkNewContent.substring(0, 100) + '...',
        issues: newContentIssues,
        safe: newContentIssues.length === 0
      }
    }

    // Save analysis result
    await supabaseClient
      .from('character_consistency_analyses')
      .upsert({
        story_id: storyId,
        user_id: userId,
        analysis_data: consistencyData,
        generated_at: new Date().toISOString(),
        chapter_id: chapterId
      })

    // Log usage
    if (userId) {
      await supabaseClient.rpc('log_ai_usage', {
        p_user_id: userId,
        p_function_name: 'ai-character-consistency',
        p_tokens_used: 0,
        p_cost: 0.01, // Flat fee for consistency check
        p_story_id: storyId,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: consistencyData,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Character consistency error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})