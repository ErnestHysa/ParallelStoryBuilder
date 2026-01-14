# Token Economy & Gamification System

## Overview

This system implements a comprehensive token economy and gamification system for the Parallel Story Builder app. It includes token balance management, achievements, streaks, and purchase integration.

## Architecture

### 1. Token Manager (`lib/tokenManager.ts`)

Core class for token operations:
- Balance management from `user_tokens` table
- Transaction recording in `token_transactions` table
- Daily activity tracking
- Streak calculation via PostgreSQL function

### 2. Token Store (`stores/tokenStore.ts`)

Zustand store for token state management:
- Local token balance
- Transaction history
- Purchase flow with IAP integration placeholder
- Real-time updates via Supabase subscriptions

### 3. Gamification Store (`stores/gamificationStore.ts`)

Zustand store for achievements and streaks:
- Achievement definitions and progress tracking
- Streak management and calculation
- Automatic achievement checking on user actions
- Points distribution for achievements

### 4. Components

#### StreakDisplay.tsx
- Animated fire emoji component showing current streak
- Color changes based on streak length
- Bounce animation on updates

#### AchievementBadge.tsx
- Visual achievement badges with rarity indicators
- Progress bars for achievements requiring multiple steps
- Responsive sizing and tap interactions

#### ProgressRing.tsx
- Circular progress indicator component
- Supports both static and animated progress
- Customizable colors and stroke width

### 5. Screens

#### achievements.tsx
- Categories achievements by type (Writing, Social, Exploration, Special)
- Shows progress overview and unlocked count
- Grid display of achievement badges

#### wallet.tsx
- Displays current token balance
- Shows purchase options with pricing
- Transaction history with visual indicators
- IAP integration placeholder

## Database Schema

### Tables

1. **user_tokens**
   - Tracks user token balance
   - Updated on every transaction

2. **token_transactions**
   - Record of all token transactions
   - Type: earned/spent
   - Metadata for context

3. **user_achievements**
   - Links users to achievements
   - Tracks progress for multi-step achievements
   - Timestamps for unlocked achievements

4. **user_daily_activity**
   - Tracks daily user activity for streaks
   - Counts activities per day
   - Unique constraint per user per day

5. **user_streaks**
   - Cached streak information
   - Longest streak tracking
   - JSONB for daily activity log

6. **achievements**
   - Master list of all achievements
   - Categories and rarities
   - Point values

### Functions

- `get_user_streak(UUID)` - Calculates current streak
- Triggers for automatic timestamp updates

## Token Pricing

| Package | Tokens | Price |
|---------|--------|-------|
| Starter | 100 | $0.99 |
| Monthly | 500 | $3.99 |
| Devoted | 1200 | $7.99 |
| Eternal | 3000 | $14.99 |
| Annual | 15000 | $49.99 |

## How to Earn Tokens

1. **Achievements** - Earn tokens by completing achievements
2. **Daily Streaks** - Maintain daily writing streaks
3. **Collaboration** - Earn through social activities
4. **Purchases** - Buy tokens directly

## Integration Points

### Writing Flow
- Record daily activity on write actions
- Check achievements after story completion
- Award tokens for achievements

### Social Features
- Award achievements for collaboration
- Track unique collaborators
- Social-specific achievements

### Navigation
- Add Achievements and Wallet tabs to bottom nav
- Include streak display in profile/header

## Security

- Row Level Security (RLS) on all tables
- Users can only access their own data
- Server-side validation for all transactions

## Performance Considerations

- Cached streak calculation in database
- Efficient queries with proper indexing
- Local state management with Zustand
- Optimistic UI updates for transactions

## Future Enhancements

1. **Real IAP Integration**
   - Apple App Store Connect
   - Google Play Billing

2. **More Achievements**
   - Seasonal achievements
   - Community challenges
   - Milestone celebrations

3. **Token Shop**
   - Premium features for tokens
   - Customizations
   - Special items

4. **Analytics**
   - Token economy metrics
   - Achievement completion rates
   - Engagement tracking

## Migration Notes

Run the `supabase/schema.sql` file to set up all required tables and functions.

```sql
-- Connect to Supabase
-- Run the SQL commands from schema.sql
-- Ensure RLS policies are enabled
```