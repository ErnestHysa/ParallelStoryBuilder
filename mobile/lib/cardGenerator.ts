import { Story, Chapter, Theme } from './types';

// Card types
export type CardStyle = 'quote' | 'milestone' | 'illustrated';
export type CardAspectRatio = 'story' | 'square' | 'portrait'; // 9:16, 1:1, 4:5

// Card dimensions for high-quality output
export const CARD_DIMENSIONS = {
  story: { width: 1080, height: 1920 }, // Instagram Stories
  square: { width: 1080, height: 1080 }, // Instagram Feed
  portrait: { width: 1080, height: 1350 }, // Twitter/LinkedIn
} as const;

// Theme-based color palettes
const THEME_PALETTES: Record<Theme, CardPalette> = {
  romance: {
    primary: '#E91E63',
    secondary: '#F48FB1',
    accent: '#FFC107',
    gradients: [
      ['#E91E63', '#9C27B0'],
      ['#F48FB1', '#E91E63'],
      ['#FFC107', '#FF9800'],
    ],
    background: '#FCE4EC',
    text: '#212121',
    textSecondary: '#757575',
  },
  fantasy: {
    primary: '#9C27B0',
    secondary: '#7B1FA2',
    accent: '#FFD700',
    gradients: [
      ['#9C27B0', '#673AB7'],
      ['#7B1FA2', '#5E35B1'],
      ['#FFD700', '#FFA000'],
    ],
    background: '#F3E5F5',
    text: '#212121',
    textSecondary: '#757575',
  },
  our_future: {
    primary: '#2196F3',
    secondary: '#03A9F4',
    accent: '#00BCD4',
    gradients: [
      ['#2196F3', '#00BCD4'],
      ['#03A9F4', '#0097A7'],
      ['#00BCD4', '#009688'],
    ],
    background: '#E3F2FD',
    text: '#212121',
    textSecondary: '#757575',
  },
};

export interface CardPalette {
  primary: string;
  secondary: string;
  accent: string;
  gradients: [string, string][];
  background: string;
  text: string;
  textSecondary: string;
}

// Quote extraction
export function extractQuote(chapter: Chapter): string {
  const content = chapter.ai_enhanced_content || chapter.content;
  // Find sentences that are quote-worthy (between 15-120 characters)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 15 && s.trim().length < 120);

  if (sentences.length === 0) {
    // Return first ~100 chars as fallback
    return content.substring(0, 100).trim() + (content.length > 100 ? '...' : '');
  }

  // Prefer sentences with emotional words
  const emotionalWords = ['love', 'heart', 'feel', 'wish', 'hope', 'dream', 'remember', 'always', 'forever'];
  const emotionalSentence = sentences.find(s =>
    emotionalWords.some(word => s.toLowerCase().includes(word))
  );

  return emotionalSentence?.trim() || sentences[0].trim();
}

// Card configuration interfaces
export interface QuoteCardConfig {
  style: 'quote';
  quote: string;
  chapter?: number;
  author?: string;
  gradientIndex?: number;
  showBranding?: boolean;
}

export interface MilestoneCardConfig {
  style: 'milestone';
  title: string;
  chapterCount: number;
  daysTogether?: number;
  startDate?: string;
  theme: Theme;
  gradientIndex?: number;
  showBranding?: boolean;
}

export interface IllustratedCardConfig {
  style: 'illustrated';
  backgroundType: 'gradient' | 'solid' | 'image';
  gradientIndex?: number;
  backgroundImage?: string;
  quote?: string;
  title: string;
  chapter?: number;
  showBranding?: boolean;
}

export type CardConfig = QuoteCardConfig | MilestoneCardConfig | IllustratedCardConfig;

export interface CardData {
  story: Story;
  chapters: Chapter[];
  config: CardConfig;
  aspectRatio: CardAspectRatio;
}

// Generate card data for sharing
export function generateCardData(
  story: Story,
  chapters: Chapter[],
  style: CardStyle,
  aspectRatio: CardAspectRatio = 'story'
): CardData {
  const palette = THEME_PALETTES[story.theme];

  switch (style) {
    case 'quote': {
      const latestChapter = chapters[chapters.length - 1];
      const quote = extractQuote(latestChapter);
      const author = chapters.find(c => c.author_id === story.created_by)?.author_id;

      return {
        story,
        chapters,
        config: {
          style: 'quote',
          quote,
          chapter: latestChapter?.chapter_number,
          author: author?.toString(),
          gradientIndex: Math.floor(Math.random() * palette.gradients.length),
          showBranding: true,
        },
        aspectRatio,
      };
    }

    case 'milestone': {
      const startDate = new Date(story.created_at);
      const daysTogether = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        story,
        chapters,
        config: {
          style: 'milestone',
          title: story.title,
          chapterCount: chapters.length,
          daysTogether,
          startDate: startDate.toLocaleDateString(),
          theme: story.theme,
          gradientIndex: Math.floor(Math.random() * palette.gradients.length),
          showBranding: true,
        },
        aspectRatio,
      };
    }

    case 'illustrated': {
      const latestChapter = chapters[chapters.length - 1];
      const quote = extractQuote(latestChapter);

      return {
        story,
        chapters,
        config: {
          style: 'illustrated',
          backgroundType: 'gradient',
          gradientIndex: Math.floor(Math.random() * palette.gradients.length),
          quote: quote.substring(0, 60) + (quote.length > 60 ? '...' : ''),
          title: story.title,
          chapter: latestChapter?.chapter_number,
          showBranding: true,
        },
        aspectRatio,
      };
    }
  }
}

// Get multiple card suggestions
export function generateCardSuggestions(
  story: Story,
  chapters: Chapter[],
  count: number = 3
): CardData[] {
  const suggestions: CardData[] = [];
  const styles: CardStyle[] = ['quote', 'milestone', 'illustrated'];

  // Add one of each style first
  styles.forEach(style => {
    suggestions.push(generateCardData(story, chapters, style));
  });

  // Add more quote variations if needed
  while (suggestions.length < count) {
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    suggestions.push(generateCardData(story, chapters, randomStyle));
  }

  return suggestions.slice(0, count);
}

// Get palette for a theme
export function getPalette(theme: Theme): CardPalette {
  return THEME_PALETTES[theme];
}

// Get gradient colors
export function getGradientColors(theme: Theme, index: number = 0): [string, string] {
  const palette = THEME_PALETTES[theme];
  return palette.gradients[index % palette.gradients.length];
}

// Card style presets for UI selection
export const CARD_STYLE_PRESETS: Record<
  CardStyle,
  { label: string; description: string; icon: string; previewColors: [string, string] }
> = {
  quote: {
    label: 'Quote Card',
    description: 'Elegant typography with a poignant quote from your story',
    icon: 'format-quote-close',
    previewColors: ['#E91E63', '#9C27B0'],
  },
  milestone: {
    label: 'Milestone Card',
    description: 'Celebrate your journey together with chapter count and days',
    icon: 'flag',
    previewColors: ['#2196F3', '#00BCD4'],
  },
  illustrated: {
    label: 'Illustrated Card',
    description: 'Beautiful gradient backgrounds with your story title',
    icon: 'image',
    previewColors: ['#9C27B0', '#673AB7'],
  },
};

// Truncate text to fit card
export function truncateForCard(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + '...';
}

// Format date for cards
export function formatCardDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format chapter number
export function formatChapterNumber(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const suffix = num % 100 > 10 && num % 100 < 14 ? 'th' : suffixes[num % 10] || 'th';
  return `${num}${suffix}`;
}
