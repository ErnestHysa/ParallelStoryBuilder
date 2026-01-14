# Deployment Guide - Parallel Story Builder

## Table of Contents
1. [Build Instructions](#build-instructions)
2. [Environment Setup](#environment-setup)
3. [Supabase Deployment](#supabase-deployment)
4. [Edge Functions Deployment](#edge-functions-deployment)
5. [App Store Submission](#app-store-submission)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Build Instructions

### 1. Development Builds

#### iOS Development Build
```bash
cd mobile
npx expo build:ios -t development
```

#### Android Development Build
```bash
cd mobile
npx expo build:android -t development
```

### 2. Production Builds

#### EAS Build Configuration
First, install and configure EAS:
```bash
npm install -g eas-cli
eas build:configure
```

#### iOS Production Build
```bash
eas build --platform ios --profile production
```

#### Android Production Build
```bash
eas build --platform android --profile production
```

#### Universal Build (All Platforms)
```bash
eas build --platform all --profile production
```

### 3. Build Customization

#### Build Configuration File
Create `eas.json`:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:assembleRelease"
      },
      "ios": {
        "buildType": "archive"
      }
    }
  }
}
```

#### Build Secrets Management
```bash
# Add build secrets
eas secret:push --scope project --name SUPABASE_URL --value https://your-project.supabase.co
eas secret:push --scope project --name SUPABASE_ANON_KEY --value your-anon-key
```

## Environment Setup

### 1. Production Environment Variables

Create `.env.production`:
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key

# Analytics
EXPO_PUBLIC_AMPLITUDE_API_KEY=prod-amplitude-key
EXPO_PUBLIC_SEGMENT_WRITE_KEY=prod-segment-key

# Sentry
EXPO_PUBLIC_SENTRY_DSN=prod-sentry-dsn

# App Store Configuration
EXPO_PUBLIC_APP_STORE_ID=123456789
EXPO_PUBLIC_APP_NAME=ParallelStoryBuilder

# Feature Flags
EXPO_PUBLIC_ENABLE_AI=true
EXPO_PUBLIC_ENABLE_SOCIAL_SHARING=true
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

### 2. Environment-Specific Builds

#### Development Environment
```env
# .env.development
EXPO_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
EXPO_PUBLIC_ENABLE_ANALYTICS=false
```

#### Staging Environment
```env
# .env.staging
EXPO_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=staging-anon-key
EXPO_PUBLIC_ENABLE_AI=true
```

### 3. Build Asset Management

#### App Icons
- Generate using `expo eas build:configure`
- Follow [Expo icon guidelines](https://docs.expo.dev/guides/app-icons/)
- Support for adaptive icons on Android

#### Splash Screens
```bash
npx expo install expo-splash-screen
```
Configure in `app.json`:
```json
"splash": {
  "image": "./assets/splash.png",
  " resizeMode": "contain",
  "backgroundColor": "#ffffff"
}
```

## Supabase Deployment

### 1. Database Deployment

#### Apply Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

#### Database Seeding
```sql
-- Run seed data
\i supabase/seed-data.sql

-- Or use CLI
supabase db seed
```

### 2. Row Level Security (RLS)

#### Enable RLS
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
-- ... for all tables
```

#### Create Policies
```sql
-- Example policy for profiles
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

### 3. Storage Setup

#### Create Storage Buckets
```bash
supabase storage create story-images
supabase storage create avatars
supabase storage create attachments
```

#### Set Storage Policies
```sql
-- Public read access for story images
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES ('story-images', 'Public read access', `bucket_id = 'story-images' and auth.role() = 'authenticated'`);

-- Restricted access for avatars
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES ('avatars', 'User avatar access', `bucket_id = 'avatars' and auth.uid() = storage.folder_name(name)[1]`);
```

## Edge Functions Deployment

### 1. Edge Functions Structure

```
supabase/functions/
├── ai-generate-story/
│   ├── index.ts
│   ├── tsconfig.json
│   └── .env
├── ai-suggest-content/
│   ├── index.ts
│   ├── tsconfig.json
│   └── .env
├── process-image/
│   ├── index.ts
│   ├── tsconfig.json
│   └── .env
└── send-notification/
    ├── index.ts
    ├── tsconfig.json
    └── .env
```

### 2. Edge Function Implementation

#### AI Generate Story Function
```typescript
// supabase/functions/ai-generate-story/index.ts
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { prompt, style, length, userId } = await req.json()

    // Call AI service (OpenAI, etc.)
    const story = await generateStory(prompt, style, length)

    // Save to database
    const { error } = await supabase
      .from('chapters')
      .insert({
        story_id: story.storyId,
        content: story.content,
        token_cost: story.tokens,
        generated_by_ai: true
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, story }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

### 3. Deploy Edge Functions

#### Deploy Individual Functions
```bash
# Deploy AI story generation
supabase functions deploy ai-generate-story

# Deploy content suggestions
supabase functions deploy ai-suggest-content

# Deploy image processing
supabase functions deploy process-image

# Deploy notifications
supabase functions deploy send-notification
```

#### Deploy All Functions
```bash
# Deploy all functions at once
for func in supabase/functions/*/; do
  supabase functions deploy $(basename "$func")
done
```

### 4. Edge Function Configuration

#### Environment Variables for Functions
```bash
# Set environment variables
supabase secrets set SUPABASE_URL=your-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-key
supabase secrets set OPENAI_API_KEY=your-openai-key
supabase secrets set REPLICATE_API_TOKEN=your-replicate-token
```

#### Function Permissions
```sql
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION ai.generate_story TO authenticated;
GRANT EXECUTE ON FUNCTION ai.suggest_content TO authenticated;
```

## App Store Submission

### 1. iOS App Store

#### Prepare for Submission
1. **App Information**
   - App name: Parallel Story Builder
   - Description: Collaborative storytelling for couples
   - Category: Lifestyle
   - Subcategory: Family

2. **App Store Connect**
   - Create new app
   - Fill out all metadata
   - Upload screenshots (minimum 3)
   - Create app preview video
   - Set up pricing (if applicable)

3. **Privacy Information**
   - Data collection details
   - Privacy policy link
   - Child directed status (if applicable)

#### Build Submission
```bash
# Archive build
xcodebuild archive -project ParallelStoryBuilder.xcodeproj \
  -scheme ParallelStoryBuilder -configuration Release \
  -archivePath ./ParallelStoryBuilder.xcarchive

# Export IPA
xcodebuild -exportArchive -archivePath ./ParallelStoryBuilder.xcarchive \
  -exportPath . -exportOptionsPlist ExportOptions.plist
```

#### App Store Review Guidelines
- [ ] All functionality works as described
- [ ] No misleading information
- [ ] Proper age rating
- [ ] Clear privacy policy
- [ ] Correct app category

### 2. Android Play Store

#### Prepare for Submission
1. **Google Play Console**
   - Create new app listing
   - Fill out store description
   - Upload feature graphic
   - Prepare screenshots (8 minimum)
   - Create promo graphics

2. **App Content**
   - Complete store listing
   - APK or AAB file
   - Privacy policy
   - Content rating

#### Build AAB
```bash
# Generate Android App Bundle
eas build --platform android --profile production --archive
```

#### Play Store Requirements
- [ ] APK signing completed
- [ ] APK signature scheme v2 or higher
- [  ] Proper target SDK version
- [ ] Appropriate permissions declared
- [ ] Privacy policy linked

### 3. App Store Assets

#### Required Assets
- **iOS**: App Icon (1024x1024), Screenshots (multiple sizes), App Preview
- **Android**: App Icon (512x512), Feature Graphic (1024x500), Screenshots (multiple sizes)

#### Asset Guidelines
- Follow platform-specific design guidelines
- Include app branding
- Show key features
- Use actual screenshots, not mockups
- Dark mode support where applicable

## Post-Deployment Checklist

### 1. Immediate Actions
- [ ] Deploy database migrations
- [ ] Deploy edge functions
- [ ] Configure environment variables
- [ ] Test all critical paths
- [ ] Set up monitoring
- [ ] Configure analytics

### 2. Testing in Production
- [ ] User authentication flow
- [ ] Story creation and editing
- [ ] Real-time collaboration
- [ ] AI features
- [ ] Push notifications
- [ ] Payment processing (if applicable)

### 3. Performance Checks
- [ ] App load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Memory usage within limits
- [ ] Battery consumption acceptable
- [ ] No crashes or ANRs

### 4. Security Verification
- [ ] All data encrypted at rest
- [ ] Secure API communication
- [ ] Proper authentication
- [ ] No exposed secrets
- [ ] Rate limiting active

## Monitoring and Maintenance

### 1. Error Monitoring

#### Sentry Configuration
```typescript
// lib/sentry.ts
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: true,
  debug: __DEV__,
  tracesSampleRate: 1.0,
});
```

#### Error Tracking Setup
- Configure error grouping
- Set up alert thresholds
- Monitor error rates
- Track user impact

### 2. Performance Monitoring

#### Performance Metrics
```typescript
// Track key performance indicators
const metrics = {
  appLaunchTime: Date.now(),
  apiResponseTime: responseTime,
  memoryUsage: performance.memory,
  batteryLevel: await getBatteryLevel(),
};
```

#### Analytics Integration
```typescript
// Amplitude or Segment integration
import { Analytics } from 'analytics';
const analytics = Analytics({
  app: 'parallel-story-builder',
  plugins: [
    AmplitudeBrowserPlugin({
      apiKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
    }),
  ],
});
```

### 3. Automated Maintenance

#### Database Maintenance
```bash
# Regular maintenance tasks
supabase db maintain --vacuum
supabase db maintain --analyze
supabase db maintain --reindex
```

#### Function Monitoring
```bash
# Monitor function performance
supabase functions logs ai-generate-story --follow
supabase functions metrics ai-generate-story
```

### 4. Backup Strategy

#### Database Backups
```bash
# Daily backup
supabase db dump --db-name parallel_story_builder > backup-$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
supabase db dump --db-name parallel_story_builder > "backup-$DATE.sql"
# Store in cloud storage
aws s3 cp "backup-$DATE.sql" s3://your-backup-bucket/
```

#### Storage Backups
```bash
# Backup storage buckets
supabase storage dump story-images story-images-backup-$(date +%Y%m%d)
```

## Rollback Procedures

### 1. Code Rollback
```bash
# Git rollback
git checkout <previous-commit>
git push origin <branch> --force

# Or use tag
git checkout v1.0.1
git push origin v1.0.1
```

### 2. Database Rollback
```bash
# Rollback to previous migration
supabase migration new rollback_<timestamp>
# Apply rollback migration
supabase db push
```

### 3. Production Rollback Plan
1. Identify the issue
2. Create backup if needed
3. Deploy rollback
4. Monitor for resolution
5. Communicate with users

## Cost Optimization

### 1. Database Optimization
- Use read replicas for queries
- Implement query caching
- Archive old data
- Optimize indexes

### 2. Edge Function Optimization
- Implement rate limiting
- Use caching
- Optimize AI service calls
- Monitor function execution time

### 3. Storage Optimization
- Use CDN for static assets
- Compress images
- Implement lazy loading
- Clean up unused files

## Scaling Considerations

### 1. Horizontal Scaling
- Load balancing for API
- Database read replicas
- CDN for static content
- Multiple edge function regions

### 2. Vertical Scaling
- Increase database resources
- Optimize queries
- Implement connection pooling
- Monitor resource usage

### 3. Caching Strategy
- Redis for application cache
- CDN for static assets
- Database query cache
- Client-side caching

## Conclusion

This deployment guide provides a comprehensive approach to deploying Parallel Story Builder to production. Following these procedures ensures:

1. **Smooth Deployment**: Minimal downtime and errors
2. **Production Readiness**: All systems configured for live use
3. **Ongoing Maintenance**: Proper monitoring and updates
4. **User Experience**: Reliable and performant app
5. **Compliance**: Meeting all store requirements

Regular following of these procedures ensures the application remains stable, secure, and performant in production.