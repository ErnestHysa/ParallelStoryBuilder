# Parallel Story Builder

A collaborative storytelling mobile app designed for long-distance couples to create stories together. Built with React Native, Expo, and Supabase, featuring AI-assisted writing, turn-based chapters, and real-time synchronization.

## Features

- **Collaborative Storytelling**: Create and co-write stories with your partner in real-time
- **Turn-Based Chapters**: Take turns writing chapters, with automatic turn tracking
- **AI-Assisted Writing**: Enhance your chapters with Google Gemini 2.0 Flash AI integration
- **Inspiration Journal**: Share ideas, prompts, and themes for your stories
- **Multiple Themes**: Choose from Romance, Fantasy Adventure, or Our Future Together
- **Real-Time Sync**: Instant updates when your partner adds content
- **Secure Authentication**: Powered by Supabase Auth with secure session management

## Tech Stack

### Mobile App
- **React Native** (v0.74.5) - Cross-platform mobile framework
- **Expo** (v51.0) - Development and build tooling
- **Expo Router** (v3.5) - File-based routing
- **Zustand** (v4.5) - Lightweight state management
- **Supabase JS** (v2.45) - Database, auth, and real-time subscriptions

### Backend
- **Supabase** - PostgreSQL database, authentication, and real-time
- **Supabase Edge Functions** - Serverless functions for AI integration
- **Google Gemini 2.0 Flash** - AI content enhancement

## Project Structure

```
parallel-story-builder/
├── mobile/                    # React Native mobile app
│   ├── app/                  # Expo Router pages
│   │   ├── (app)/           # Authenticated screens
│   │   │   ├── index.tsx    # Home/stories list
│   │   │   ├── create-story.tsx
│   │   │   ├── join-story.tsx
│   │   │   ├── story/[id].tsx       # Story detail
│   │   │   ├── write/[id].tsx       # Chapter editor
│   │   │   └── inspirations/[id].tsx # Inspiration journal
│   │   ├── (auth)/          # Authentication screens
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── _layout.tsx      # Root layout
│   │   └── index.tsx        # Entry point
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── TextArea.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── stores/              # Zustand state management
│   │   ├── authStore.ts
│   │   ├── storiesStore.ts
│   │   ├── editorStore.ts
│   │   └── inspirationsStore.ts
│   └── lib/                 # Utilities and configurations
│       ├── supabase.ts      # Supabase client
│       └── types.ts         # TypeScript definitions
├── supabase/               # Supabase configuration
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge Functions (AI)
│       ├── ai-enhance/     # Chapter text enhancement
│       ├── ai-twist/       # Plot twist generation
│       └── ai-continuation/ # Story continuation suggestions
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on your device (for development)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd parallel-story-builder

# Install mobile app dependencies
cd mobile
npm install
```

### 2. Environment Setup

Create a `.env` file in the `mobile/` directory based on `.env.example`:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=your-supabase-functions-url
```

To get your Supabase credentials:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to Project Settings > API
4. Copy your project URL and anon key

### 3. Set Up Supabase Database

Run the database migrations in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file from `supabase/migrations/` in order:
   - `20240110000001_initial_schema.sql`
   - `20240110000002_rls_policies.sql`
   - `20240110000003_ai_usage_table.sql`
   - `20240110000004_atomic_rate_limit_function.sql`

### 4. Deploy Edge Functions (for AI Features)

**Get Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key

**Deploy the functions:**

```bash
# From the project root
npx supabase functions deploy ai-enhance
npx supabase functions deploy ai-twist
npx supabase functions deploy ai-continuation
```

**Set the GEMINI_API_KEY secret:**

1. Go to your Supabase dashboard
2. Navigate to **Edge Functions** > **Settings**
3. Add environment variable: `GEMINI_API_KEY` = your-api-key-here
4. Optionally add `ALLOWED_ORIGINS` for CORS (comma-separated)

### 5. Start Development Server

```bash
cd mobile
npx expo start -- --clear
```

### 6. Run the App

- **iOS**: Scan QR code with Expo Go on iOS device
- **Android**: Scan QR code with Expo Go on Android device
- Or press `i` / `a` in terminal for simulator/emulator

## Database Schema

The app uses the following main tables:

- **profiles**: User profile information (display name, avatar)
- **stories**: Story metadata (title, theme, pairing code, status)
- **story_members**: Story membership and turn order
- **chapters**: Chapter content with AI-enhanced version
- **inspirations**: Shared story ideas and prompts
- **ai_usage**: Rate limiting for AI features

See `supabase/migrations/` for complete schema definitions.

## Authentication Flow

1. Users sign up/login via email/password through Supabase Auth
2. Session is stored securely using Expo SecureStore
3. Auth state is managed in `authStore` with Zustand
4. Protected routes check authentication status
5. App works in "demo mode" when Supabase is not configured

## Real-Time Features

The app uses Supabase real-time subscriptions for:

- **Story Updates**: When a partner joins or updates story details
- **New Chapters**: Instant notification when partner submits a chapter
- **Turn Changes**: Automatic update when it's your turn to write

## AI Features

### AI-Enhanced Writing
When writing a chapter, tap "AI Enhance" to improve your text with:
- Better sensory details and imagery
- Enhanced emotional depth
- Improved flow while preserving your voice

### Rate Limits
- 10 AI requests per day per user
- Prevents abuse and manages API costs

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Lint code
npm run lint

# Clean dependencies and cache
npm run clean

# Deploy Edge Functions (from root)
npx supabase functions deploy ai-enhance
```

## Building for Production

### iOS

```bash
cd mobile
eas build --platform ios
```

### Android

```bash
cd mobile
eas build --platform android
```

See [Expo Documentation](https://docs.expo.dev/build/introduction/) for more details on EAS Build.

## License

This project is licensed under the MIT License.

---

Built with love for long-distance couples everywhere.
