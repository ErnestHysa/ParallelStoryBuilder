# Parallel Story Builder - Web Version

A beautiful, production-ready web application for long-distance couples to write collaborative stories together.

## Features

- **Collaborative Storytelling**: Write chapters together with your partner
- **AI Enhancement**: Improve your writing with AI-powered suggestions
- **Real-time Sync**: Changes sync automatically with Supabase
- **Beautiful Design**: Distinctive, elegant aesthetic with custom typography
- **PWA Support**: Install as an app on any device
- **Responsive**: Works beautifully on desktop, tablet, and mobile

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Installation

1. **Install dependencies:**
   ```bash
   cd web
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **State**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Fonts**: Cormorant Garamond, Source Serif 4, Crimson Pro

## Project Structure

```
web/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── auth/         # Authentication pages
│   │   ├── stories/      # Story pages (protected)
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Landing page
│   ├── components/       # Reusable components
│   │   └── AppNav.tsx    # Main navigation
│   ├── lib/              # Utilities
│   │   ├── supabase.ts   # Supabase client
│   │   └── utils.ts      # Helper functions
│   ├── stores/           # State management
│   │   └── authStore.ts  # Auth state
│   ├── styles/           # Global styles
│   │   └── globals.css   # Tailwind + custom styles
│   └── types/            # TypeScript types
│       └── index.ts      # Type definitions
├── public/               # Static assets
│   └── manifest.json     # PWA manifest
└── package.json
```

## Design System

### Colors

- **Rose** (`#D4567C`): Primary romantic color
- **Cream** (`#F0E8DF`): Warm background
- **Amethyst** (`#7B3F8E`): Rich accent
- **Gold** (`#D4A574`): Elegant highlights
- **Ink** (`#1A1A1E`): Text color

### Typography

- **Display**: Cormorant Garamond - elegant headers
- **Body**: Source Serif 4 - readable content
- **Accent**: Crimson Pro - emphasis elements

### Components

All components follow our distinctive aesthetic with:
- Ornate borders
- Soft shadows
- Smooth animations
- Delicate gradients

## Development Notes

- The app shares types with the mobile app (`../../mobile/lib/types.ts`)
- Auth state persists via Zustand with localStorage
- All protected routes redirect to login if not authenticated
- Real-time updates use Supabase subscriptions

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Build the app and deploy the `.next` folder to any Node.js host.

## License

MIT
