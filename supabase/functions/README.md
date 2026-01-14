# AI Features Documentation

This directory contains Supabase Edge Functions that implement various AI features for Parallel Story Builder.

## Available Functions

### 1. ai-cover-art
- **Path**: `/supabase/functions/ai-cover-art`
- **Purpose**: Generate story cover images using DALL-E 3
- **Features**:
  - Customizable prompts and styles
  - Multiple size options
  - Response caching
  - Cost tracking
  - Content safety filtering

**Request Body**:
```typescript
{
  prompt: string;
  storyTitle?: string;
  style?: string;
  width?: number;
  height?: number;
  userId?: string;
  storyId?: string;
}
```

### 2. ai-story-summary
- **Path**: `/supabase/functions/ai-story-summary`
- **Purpose**: Generate story summaries for overviews
- **Features**:
  - Multiple summary styles (short, detailed, tagline)
  - Content length control
  - Response caching
  - Token usage tracking
  - Content safety filtering

**Request Body**:
```typescript
{
  storyContent: string;
  title?: string;
  style?: 'short' | 'detailed' | 'tagline';
  maxLength?: number;
  userId?: string;
  storyId?: string;
}
```

### 3. ai-character-avatar
- **Path**: `/supabase/functions/ai-character-avatar`
- **Purpose**: Generate character portrait images
- **Features**:
  - Multiple art styles (realistic, cartoon, anime, fantasy)
  - Character consistency tracking
  - Response caching
  - Cost tracking
  - Content safety filtering

**Request Body**:
```typescript
{
  characterName: string;
  characterDescription: string;
  age?: string;
  gender?: string;
  style?: 'realistic' | 'cartoon' | 'anime' | 'fantasy';
  width?: number;
  height?: number;
  userId?: string;
  storyId?: string;
}
```

### 4. ai-narrative-analysis
- **Path**: `/supabase/functions/ai-narrative-analysis`
- **Purpose**: Analyze story arc and character development
- **Features**:
  - Comprehensive narrative structure analysis
  - Character development assessment
  - Writing style evaluation
  - Theme identification
  - Detailed breakdown option

**Request Body**:
```typescript
{
  storyContent: string;
  chapterId?: string;
  userId?: string;
  storyId?: string;
  includeDetailedBreakdown?: boolean;
}
```

### 5. ai-style-transfer
- **Path**: `/supabase/functions/ai-style-transfer`
- **Purpose**: Transform writing style (romantic, playful, dramatic, etc.)
- **Features**:
  - 8 different style options
  - Meaning preservation option
  - Length change tracking
  - Response caching
  - Style usage logging

**Request Body**:
```typescript
{
  text: string;
  targetStyle: 'romantic' | 'playful' | 'dramatic' | 'mysterious' | 'humorous' | 'gothic' | 'modern' | 'classical';
  preserveMeaning?: boolean;
  userId?: string;
  storyId?: string;
  chapterId?: string;
}
```

### 6. ai-character-consistency
- **Path**: `/supabase/functions/ai-character-consistency`
- **Purpose**: Check and maintain character consistency
- **Features**:
  - Character trait analysis
  - Relationship tracking
  - Inconsistency detection
  - Character arc evaluation
  - Consistency scoring

**Request Body**:
```typescript
{
  storyId: string;
  chapterId?: string;
  checkNewContent?: string;
  userId?: string;
  action?: 'check' | 'analyze' | 'update';
}
```

## Database Tables

### ai_cache
Stores cached AI responses to reduce costs and improve performance.

### story_characters
Stores character information including avatars and descriptions.

### story_analyses
Stores narrative analysis results for stories and chapters.

### character_consistency_analyses
Stores character consistency analysis results.

### style_usage
Tracks style transfer usage across stories.

### ai_usage
Logs all AI function calls with costs and token usage.

## Required Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `OPENAI_API_KEY`: Your OpenAI API key for accessing GPT and DALL-E models

## Security Notes

1. All functions include CORS headers for web access
2. Content safety filtering is implemented using OpenAI's moderation API
3. User authentication is required for most functions
4. Rate limiting should be implemented at the Supabase level
5. All responses are cached to reduce API costs

## Cost Tracking

Each function includes cost tracking:
- DALL-E 3: ~$0.04 per image
- GPT-3.5-Turbo: ~$0.002 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens

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