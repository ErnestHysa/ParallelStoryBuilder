import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Source_Serif_4, Crimson_Pro } from 'next/font/google';
import '@/styles/globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

// Distinctive, elegant fonts
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const crimson = Crimson_Pro({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-accent',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Parallel Story Builder | Write Your Love Story Together',
  description: 'Transform distance into creative fuel. Write beautiful, collaborative stories with your partner, enhanced by AI. The relationship app for long-distance couples.',
  keywords: 'long distance relationship, collaborative writing, storytelling app, couple app, AI writing',
  authors: [{ name: 'Parallel Story Builder' }],
  openGraph: {
    title: 'Parallel Story Builder | Write Your Love Story Together',
    description: 'Transform distance into creative fuel. Write beautiful, collaborative stories with your partner.',
    type: 'website',
    siteName: 'Parallel Story Builder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parallel Story Builder | Write Your Love Story Together',
    description: 'Transform distance into creative fuel. Write beautiful, collaborative stories with your partner.',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#D4567C',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${sourceSerif.variable} ${crimson.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('parallel-theme');
                  var theme = stored || 'system';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  console.error('Failed to apply theme:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-cream-100 dark:bg-dark-bg text-ink-950 dark:text-dark-text antialiased transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider
          defaultTheme="system"
          storageKey="parallel-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
