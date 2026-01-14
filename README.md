# Parallel Story Builder

A collaborative storytelling mobile app designed for long-distance couples to create stories together. Built with React Native, Expo, and Supabase, featuring AI-assisted writing, turn-based chapters, and real-time synchronization.

## Features

| Feature | Description |
|---------|-------------|
| **Collaborative Storytelling** | Create and co-write stories with your partner in real-time |
| **Turn-Based Chapters** | Take turns writing chapters with automatic turn tracking |
| **AI-Assisted Writing** | Enhance your chapters with AI-powered suggestions (Gemini 2.0 Flash) |
| **Inspiration Journal** | Share ideas, prompts, and themes for your stories |
| **Multiple Themes** | Romance 💕, Fantasy Adventure 🐉, or Our Future Together 🌟 |
| **Real-Time Sync** | Instant updates when your partner adds content |
| **Demo Mode** | Try the app without any setup - fully functional demo included |
| **Secure Authentication** | Powered by Supabase Auth with secure session management |

## Quick Start

### Option 1: Demo Mode (No Setup Required)

The app works in demo mode without any configuration:

```bash
cd mobile
npm install
npm start
```

Scan the QR code with Expo Go on your device, or press `i` for iOS simulator / `a` for Android emulator.

> **🔧 Troubleshooting**: If you see "Failed to download remote update" error, press `t` in the terminal to use **Tunnel Mode**, or run `npm run start:tunnel`. See [Troubleshooting](docs/TROUBLESHOOTING.md) for more details.

### Option 2: Full Setup with Supabase

Follow the steps below to enable real-time collaboration and AI features.

## Tech Stack

### Mobile App
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.74.5 | Cross-platform mobile framework |
| **Expo** | 51.0 | Development and build tooling |
| **Expo Router** | 3.5 | File-based routing |
| **Zustand** | 4.5 | Lightweight state management |
| **Supabase JS** | 2.45 | Database, auth, and real-time |
| **TypeScript** | 5.3 | Type safety |

### Backend
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database, authentication, real-time |
| **Supabase Edge Functions** | Serverless functions for AI integration |
| **Google Gemini 2.0 Flash** | AI content enhancement |

## Project Structure

```
parallel-story-builder/
├── mobile/                          # React Native mobile app
│   ├── app/                         # Expo Router pages
│   │   ├── (app)/                   # Authenticated screens
│   │   │   ├── index.tsx            # Home / Stories list
│   │   │   ├── create-story.tsx     # Create new story
│   │   │   ├── join-story.tsx       # Join with pairing code
│   │   │   ├── story/[id].tsx       # Story detail & chapters
│   │   │   ├── write/[id].tsx       # Chapter editor with AI
│   │   │   └── inspirations/[id].tsx # Inspiration journal
│   │   ├── (auth)/                  # Authentication screens
│   │   │   ├── login.tsx            # Login form
│   │   │   └── register.tsx         # Registration form
│   │   ├── _layout.tsx              # Root layout
│   │   └── index.tsx                # Entry point
│   ├── components/                  # Reusable UI components
│   │   ├── Button.tsx               # Primary, secondary, ghost, danger
│   │   ├── Card.tsx                 # Elevated, outlined, flat
│   │   ├── Input.tsx                # Text input with labels
│   │   ├── TextArea.tsx             # Multi-line text input
│   │   └── LoadingSpinner.tsx      # Loading indicator
│   ├── stores/                      # Zustand state management
│   │   ├── authStore.ts             # Authentication state
│   │   ├── storiesStore.ts          # Stories & chapters
│   │   ├── editorStore.ts           # Chapter writing & AI
│   │   ├── inspirationsStore.ts     # Inspiration journal
│   │   └── demoStore.ts             # Demo mode data
│   └── lib/                         # Utilities
│       ├── supabase.ts              # Supabase client
│       └── types.ts                 # TypeScript definitions
├── supabase/                        # Supabase configuration
│   ├── migrations/                  # Database migrations
│   └── functions/                   # Edge Functions (AI)
│       ├── ai-enhance/              # Chapter text enhancement
│       ├── ai-twist/                # Plot twist generation
│       └── ai-continuation/         # Story continuation
└── README.md
```

## Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **iOS Simulator** (Mac only) or **Android Emulator**
- **Expo Go** app on your device (for development)

### Step 1: Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-repo/parallel-story-builder.git
cd parallel-story-builder

# Install mobile app dependencies
cd mobile
npm install
```

### Step 2: Run in Demo Mode (Optional)

You can run the app immediately without any configuration:

```bash
npm start
```

The app will detect that Supabase is not configured and run in demo mode with sample stories and chapters.

### Step 3: Set Up Supabase (for Full Features)

#### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Wait for the project to be provisioned

#### 3.2 Configure Environment Variables

Create a `.env` file in the `mobile/` directory:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

To get your credentials:
- Navigate to **Project Settings** > **API**
- Copy your project URL and anon key

#### 3.3 Run Database Migrations

Go to your Supabase project dashboard:

1. Navigate to **SQL Editor**
2. Run each migration file from `supabase/migrations/` in order:
   - `20240110000001_initial_schema.sql`
   - `20240110000002_rls_policies.sql`
   - `20240110000003_ai_usage_table.sql`
   - `20240110000004_atomic_rate_limit_function.sql`

### Step 4: Deploy AI Features (Optional)

#### 4.1 Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key

#### 4.2 Deploy Edge Functions

```bash
# From the project root
npx supabase functions deploy ai-enhance
```

#### 4.3 Set Environment Secrets

1. Go to your Supabase dashboard
2. Navigate to **Edge Functions** > **Settings**
3. Add environment variable: `GEMINI_API_KEY` = your-api-key-here

### Step 5: Start the Development Server

```bash
cd mobile
npm start
```

### Step 6: Run the App

- **iOS**: Scan QR code with Expo Go, or press `i` for simulator
- **Android**: Scan QR code with Expo Go, or press `a` for emulator

## Usage Guide

### Creating a Story

1. Tap **Create New Story** on the home screen
2. Enter a title for your story
3. Select a theme (Romance, Fantasy, or Our Future)
4. Tap **Create Story**
5. Share the **pairing code** with your partner

### Joining a Story

1. Tap **Join with Code** on the home screen
2. Enter the 6-character pairing code your partner shared
3. Tap **Join Story**

### Writing a Chapter

1. Open a story and tap **Write Chapter**
2. Optionally add a context snippet for your partner/AI
3. Write your chapter content
4. (Optional) Tap **AI Enhance** to improve your writing
5. Review the enhanced version and tap **Use This Version** if you like it
6. Tap **Submit Chapter** when ready

### Adding Inspirations

1. Open a story and tap **Inspirations**
2. Enter an idea, prompt, or theme
3. Tap **Add Inspiration**
4. Your partner will see your inspiration in their list

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profile information (display name, avatar) |
| `stories` | Story metadata (title, theme, pairing code, status) |
| `story_members` | Story membership and turn order |
| `chapters` | Chapter content with AI-enhanced version |
| `inspirations` | Shared story ideas and prompts |
| `ai_usage` | Rate limiting for AI features |

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

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

See [Expo Documentation](https://docs.expo.dev/build/introduction/) for EAS Build details.

## Demo Mode vs Production

| Feature | Demo Mode | Production |
|---------|-----------|------------|
| View sample stories | ✅ | ✅ |
| Create stories | ✅ (local) | ✅ (cloud) |
| Write chapters | ✅ (local) | ✅ (real-time) |
| AI Enhancement | ✅ (simulated) | ✅ (Gemini AI) |
| Partner collaboration | ❌ | ✅ |
| Real-time sync | ❌ | ✅ |

## License

MIT License - see LICENSE file for details.

---

Built with 💕 for long-distance couples everywhere.
