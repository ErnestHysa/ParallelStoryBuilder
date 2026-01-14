# AI Features Documentation

This directory contains Supabase Edge Functions that implement various AI features for Parallel Story Builder.

## Available Functions

### 1. ai-cover-art
- **Path**: `/supabase/functions/ai-cover-art`
- **Purpose**: Generate story cover images using Pollinations.ai (Free/Cheap alternative)
- **Features**:
  - Customizable prompts and styles
  - Multiple size options
  - Response caching
  - Cost tracking (effectively free)
  - Content safety filtering

### 2. ai-story-summary
- **Path**: `/supabase/functions/ai-story-summary`
- **Purpose**: Generate story summaries using Gemini 2.0 Flash
- **Features**:
  - Multiple summary styles (short, detailed, tagline)
  - Content length control
  - Response caching
  - Cost tracking (fraction of a cent)
  - Content safety filtering via Gemini safety tokens

### 3. ai-character-avatar
- **Path**: `/supabase/functions/ai-character-avatar`
- **Purpose**: Generate character portrait images using Pollinations.ai
- **Features**:
  - Multiple art styles (realistic, cartoon, anime, fantasy)
  - Character consistency tracking
  - Response caching
  - Cost tracking
  - Content safety filtering using Gemini 2.0 Flash

### 4. ai-narrative-analysis
- **Path**: `/supabase/functions/ai-narrative-analysis`
- **Purpose**: Analyze story arc and character development using Gemini 2.0 Flash
- **Features**:
  - Comprehensive narrative structure analysis
  - Character development assessment
  - Writing style evaluation
  - Theme identification
  - Detailed breakdown option

### 5. ai-style-transfer
- **Path**: `/supabase/functions/ai-style-transfer`
- **Purpose**: Transform writing style using Gemini 2.0 Flash
- **Features**:
  - 8 different style options
  - Meaning preservation option
  - Length change tracking
  - Response caching
  - Style usage logging

### 6. ai-character-consistency
- **Path**: `/supabase/functions/ai-character-consistency`
- **Purpose**: Check and maintain character consistency (Manual/Regex logic)
- **Features**:
  - Character trait analysis
  - Relationship tracking
  - Inconsistency detection
  - Character arc evaluation
  - Consistency scoring

## Required Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `GEMINI_API_KEY`: Your Google Gemini API key (Required for text features and safety)

## Security Notes

1. All functions include CORS headers for web access
2. Content safety filtering is implemented using Gemini's safety settings
3. User authentication is required for most functions
4. Rate limiting should be implemented at the Supabase level
5. All responses are cached to reduce API costs

## Cost Tracking

Each function includes cost tracking:
- Pollinations.ai: Free
- Gemini 2.0 Flash: ~$0.0001 per 1K tokens (extremely cheap)
- Gemini 1.5 Pro (if used): ~$0.0005 per 1K tokens

Functions log usage to the `ai_usage` table for billing and analytics purposes.


## Mobile Components

The AI features are integrated with mobile components:

### AICoverArtGenerator
Cover art generation UI with prompt input, style selection, and image preview.

### AICharacterCreator
Character creation with AI avatar generation, name and description input.

### AIPanel
Collapsible AI tools panel with access to all AI features.

### aiClient
Type-safe TypeScript client for calling all AI functions with caching and error handling.

## Usage Examples

```typescript
// Generate cover art
const result = await aiClient.generateCoverArt({
  prompt: "A magical forest at sunset",
  storyTitle: "The Enchanted Woods",
  style: "fantasy",
  storyId: "story-123",
  userId: "user-456"
});

// Analyze narrative structure
const analysis = await aiClient.analyzeNarrative({
  storyContent: "Once upon a time...",
  userId: "user-456",
  storyId: "story-123",
  includeDetailedBreakdown: true
});

// Transform writing style
const transformed = await aiClient.transferStyle({
  text: "She walked through the forest.",
  targetStyle: "romantic",
  preserveMeaning: true,
  userId: "user-456",
  storyId: "story-123"
});
```