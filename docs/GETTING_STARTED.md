# Getting Started Guide

This guide will help you set up and run the Parallel Story Builder app on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

| Software | Version | How to Install |
|----------|---------|----------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **npm** | Comes with Node.js | Included with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### Optional (for mobile development)

| Software | Platform | Purpose |
|----------|----------|---------|
| **Xcode** | macOS | iOS development |
| **Android Studio** | Any | Android development |
| **Expo CLI** | Any | Development server |

## Quick Start (Demo Mode)

The fastest way to try the app is in demo mode, which requires no setup:

```bash
# 1. Navigate to the mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
```

You'll see a QR code in your terminal:

```
› Metro waiting on exp://192.168.1.5:19000
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

### Running on Your Device

1. Download **Expo Go** from the App Store or Google Play
2. Scan the QR code with Expo Go
3. The app will load in demo mode with sample stories

### Running on Simulator

- **iOS**: Press `i` in the terminal (requires Xcode on macOS)
- **Android**: Press `a` in the terminal (requires Android Studio)

## Full Setup with Supabase

To enable real-time collaboration and AI features, follow these steps:

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign up with GitHub or email
4. Create a new project:
   - **Organization**: Your name
   - **Name**: parallel-story-builder
   - **Database Password**: Generate a secure password (save it!)
   - **Region**: Choose closest to your users
5. Wait for the project to be provisioned (~2 minutes)

### Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: A long JWT token

### Step 3: Configure Environment Variables

Create a file named `.env` in the `mobile/` directory:

```bash
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Set Up the Database

1. In Supabase, go to **SQL Editor** (in the left sidebar)
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20240110000001_initial_schema.sql`
4. Paste and click **Run** or press `Cmd+Enter`
5. Repeat for all migration files in order:
   - `20240110000001_initial_schema.sql`
   - `20240110000002_rls_policies.sql`
   - `20240110000003_ai_usage_table.sql`
   - `20240110000004_atomic_rate_limit_function.sql`

### Step 5: Deploy AI Features (Optional)

The AI enhancement features require a Supabase Edge Function:

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. In Supabase, go to **Edge Functions** > **Settings**
3. Add a new secret:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your API key from step 1
4. Deploy the function:

```bash
# From the project root
npx supabase functions deploy ai-enhance
```

### Step 6: Run the App

```bash
cd mobile
npm start
```

The app will now connect to your Supabase project instead of running in demo mode.

## Development Workflow

### File Changes

The app uses **React Fast Refresh**, so most changes appear instantly:

```bash
# Edit a file in mobile/app/ or mobile/components/
# Save the file
# Changes appear in the app automatically (press 'r' to reload if needed)
```

### Changing Environment Variables

If you edit `.env`, restart the dev server:

```bash
# Press Ctrl+C to stop
npm start
```

### Type Checking

```bash
# Run TypeScript compiler
cd mobile
npx tsc --noEmit
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Troubleshooting

### "Cannot find module" error

```bash
# Clean and reinstall
cd mobile
rm -rf node_modules package-lock.json
npm install
```

### "Metro bundler" issues

```bash
# Clear Metro cache
npm start -- --clear
```

### iOS simulator won't start

1. Ensure Xcode is installed: `xcode-select --install`
2. Open Xcode and accept the license
3. Restart the terminal

### Android emulator won't start

1. Ensure Android Studio is installed
2. Open Android Studio > AVD Manager
3. Create a virtual device
4. Start the emulator before running `npm start`

### Supabase connection errors

1. Verify your `.env` file has correct values
2. Check that your Supabase project is active
3. Ensure Row Level Security policies are applied
4. Check browser console for specific errors

## Next Steps

- Read the [Architecture Guide](./ARCHITECTURE.md) to understand the codebase
- Read the [API Documentation](./API.md) to learn about data models
- See [Contributing](./CONTRIBUTING.md) to help improve the app

## Support

If you encounter issues:

1. Check the [Supabase Docs](https://supabase.com/docs)
2. Check the [Expo Docs](https://docs.expo.dev)
3. Open an issue on GitHub
