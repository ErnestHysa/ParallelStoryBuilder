// Card types and generator for web

export type CardStyle = 'quote' | 'milestone' | 'illustrated' | 'origin' | 'chapter';
export type CardAspectRatio = 'story' | 'square' | 'portrait'; // 9:16, 1:1, 4:5

// Card dimensions for high-quality output
export const CARD_DIMENSIONS = {
  story: { width: 1080, height: 1920 }, // Instagram Stories
  square: { width: 1080, height: 1080 }, // Instagram Feed
  portrait: { width: 1080, height: 1350 }, // Twitter/LinkedIn
} as const;

// All available gradients for card backgrounds
export const ALL_GRADIENTS: [string, string][] = [
  // Warm & Romantic
  ['#E91E63', '#9C27B0'], // Pink to Purple
  ['#FF6B6B', '#FF8E53'], // Coral to Peach
  ['#F48FB1', '#E91E63'], // Light Pink to Pink
  ['#FFC107', '#FF9800'], // Amber to Orange
  ['#FF5722', '#E91E63'], // Orange Red to Pink
  ['#FF4081', '#F50057'], // Pink to Deep Pink

  // Cool & Calming
  ['#2196F3', '#00BCD4'], // Blue to Cyan
  ['#03A9F4', '#0097A7'], // Light Blue to Teal
  ['#00BCD4', '#009688'], // Cyan to Teal
  ['#4FC3F7', '#29B6F6'], // Sky Blue to Light Blue
  ['#5C6BC0', '#3F51B5'], // Indigo to Deep Indigo
  ['#7E57C2', '#5E35B1'], // Purple to Deep Purple

  // Purple & Fantasy
  ['#9C27B0', '#673AB7'], // Purple to Deep Purple
  ['#7B1FA2', '#5E35B1'], // Deep Purple to Violet
  ['#BA68C8', '#9C27B0'], // Light Purple to Purple
  ['#FFD700', '#FFA000'], // Gold to Amber
  ['#FF6B9D', '#C44569'], // Pink to Rose

  // Nature & Earth
  ['#66BB6A', '#43A047'], // Green to Dark Green
  ['#81C784', '#66BB6A'], // Light Green to Green
  ['#26A69A', '#00897B'], // Teal to Dark Teal
  ['#4DB6AC', '#009688'], // Light Teal to Teal

  // Dramatic & Bold
  ['#1A1A2E', '#16213E'], // Dark Navy to Darker
  ['#0F0C29', '#302B63'], // Deep Purple to Navy
  ['#232526', '#414345'], // Dark Gray to Medium Gray
  ['#1F1C18', '#8E0E00'], // Almost Black to Red
];

// Get gradient by index
export function getGradientByIndex(index: number): [string, string] {
  return ALL_GRADIENTS[index % ALL_GRADIENTS.length];
}

// Shuffle to a different gradient
export function shuffleGradient(currentIndex: number): number {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * ALL_GRADIENTS.length);
  } while (newIndex === currentIndex && ALL_GRADIENTS.length > 1);
  return newIndex;
}

// Theme-based color palettes
export interface CardPalette {
  primary: string;
  secondary: string;
  accent: string;
  gradients: [string, string][];
  background: string;
  text: string;
  textSecondary: string;
}

export const THEME_PALETTES: Record<string, CardPalette> = {
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

// Story and Chapter types (simplified for web)
export interface Story {
  id: string;
  title: string;
  theme: string;
  created_at: string;
  pairing_code: string;
}

export interface Chapter {
  id: string;
  content: string;
  ai_enhanced_content?: string | null;
  chapter_number: number;
  author_id: string;
  created_at: string;
}

// Strip HTML tags from content
export function stripHtmlTags(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Quote extraction
export function extractQuote(chapter: Chapter | undefined): string {
  if (!chapter) {
    return 'Start writing your story together...';
  }
  const content = chapter.ai_enhanced_content || chapter.content;
  // Strip HTML tags before processing
  const plainText = stripHtmlTags(content);
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 15 && s.trim().length < 120);

  if (sentences.length === 0) {
    return plainText.substring(0, 100).trim() + (plainText.length > 100 ? '...' : '');
  }

  const emotionalWords = ['love', 'heart', 'feel', 'wish', 'hope', 'dream', 'remember', 'always', 'forever'];
  const emotionalSentence = sentences.find(s =>
    emotionalWords.some(word => s.toLowerCase().includes(word))
  );

  return emotionalSentence?.trim() || sentences[0].trim();
}

// Get multiple quotes from a chapter for browsing/shuffling
export function extractMultipleQuotes(chapter: Chapter | undefined, count: number = 3): string[] {
  if (!chapter) {
    return ['Start writing your story together...'];
  }
  const content = chapter.ai_enhanced_content || chapter.content;
  const plainText = stripHtmlTags(content);
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 15 && s.trim().length < 150);

  // Get emotional sentences first
  const emotionalWords = ['love', 'heart', 'feel', 'wish', 'hope', 'dream', 'remember', 'always', 'forever', 'miss', 'need', 'want', 'beautiful', 'happy', 'sad'];
  const emotionalSentences = sentences.filter(s =>
    emotionalWords.some(word => s.toLowerCase().includes(word))
  );

  // Combine emotional sentences first, then others
  const allSentences = [...emotionalSentences, ...sentences.filter(s => !emotionalSentences.includes(s))];

  // Remove duplicates and get unique quotes
  const uniqueQuotes = Array.from(new Set(allSentences.map(s => s.trim())));

  return uniqueQuotes.slice(0, count);
}

// Smart trim that respects sentence boundaries
export function smartTrim(text: string, maxLength: number = 300): string {
  const plainText = stripHtmlTags(text).trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find the last sentence break within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion);

  // If we found a sentence break within reasonable distance (at least 50 chars), use it
  if (lastBreak > maxLength * 0.5) {
    return plainText.substring(0, lastBreak + 1);
  }

  // Otherwise, find the next sentence break
  const remainder = plainText.substring(maxLength);
  const nextPeriod = remainder.indexOf('.');
  const nextExclamation = remainder.indexOf('!');
  const nextQuestion = remainder.indexOf('?');

  const breaks = [nextPeriod, nextExclamation, nextQuestion].filter(i => i >= 0);
  const nextBreak = breaks.length > 0 ? Math.min(...breaks) : -1;

  if (nextBreak >= 0) {
    return plainText.substring(0, maxLength + nextBreak + 1);
  }

  // Fallback: truncate at a word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

// Shuffle to get a different quote from the same chapter
export function shuffleQuote(chapter: Chapter | undefined, previousQuote?: string): string {
  const quotes = extractMultipleQuotes(chapter, 5);
  const availableQuotes = previousQuote
    ? quotes.filter(q => q !== previousQuote)
    : quotes;

  return availableQuotes.length > 0
    ? availableQuotes[Math.floor(Math.random() * availableQuotes.length)]
    : quotes[0] || extractQuote(chapter);
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
  theme: string;
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

export interface OriginCardConfig {
  style: 'origin';
  quote: string;
  author?: string;
  gradientIndex?: number;
  showBranding?: boolean;
}

export interface ChapterCardConfig {
  style: 'chapter';
  chapter: number;
  excerpt: string;
  title: string;
  gradientIndex?: number;
  showBranding?: boolean;
}

export type CardConfig = QuoteCardConfig | MilestoneCardConfig | IllustratedCardConfig | OriginCardConfig | ChapterCardConfig;

export interface CardData {
  story: Story;
  chapters: Chapter[];
  config: CardConfig;
  aspectRatio: CardAspectRatio;
}

// Get palette for a theme
export function getPalette(theme: string): CardPalette {
  return THEME_PALETTES[theme] || THEME_PALETTES.romance;
}

// Get gradient colors
export function getGradientColors(theme: string, index: number = 0): [string, string] {
  const palette = getPalette(theme);
  return palette.gradients[index % palette.gradients.length];
}

// Generate card data for sharing
export function generateCardData(
  story: Story,
  chapters: Chapter[],
  style: CardStyle,
  aspectRatio: CardAspectRatio = 'story'
): CardData {
  const palette = getPalette(story.theme);

  switch (style) {
    case 'quote': {
      const latestChapter = chapters[chapters.length - 1];
      const quote = extractQuote(latestChapter);

      return {
        story,
        chapters,
        config: {
          style: 'quote',
          quote,
          chapter: latestChapter?.chapter_number,
          author: story.title,
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

    case 'origin': {
      // Find chapter 1 (the origin)
      const firstChapter = chapters.find(c => c.chapter_number === 1) || chapters[0];
      const quote = extractQuote(firstChapter);

      return {
        story,
        chapters,
        config: {
          style: 'origin',
          quote,
          author: story.title,
          gradientIndex: Math.floor(Math.random() * palette.gradients.length),
          showBranding: true,
        },
        aspectRatio,
      };
    }

    case 'chapter': {
      const latestChapter = chapters[chapters.length - 1];
      const content = latestChapter.content || latestChapter.ai_enhanced_content || '';
      const excerpt = smartTrim(content, 300);

      return {
        story,
        chapters,
        config: {
          style: 'chapter',
          chapter: latestChapter?.chapter_number || chapters.length,
          excerpt,
          title: story.title,
          gradientIndex: Math.floor(Math.random() * palette.gradients.length),
          showBranding: true,
        },
        aspectRatio,
      };
    }

    default: {
      // Fallback to quote card
      const latestChapter = chapters[chapters.length - 1];
      const quote = extractQuote(latestChapter);

      return {
        story,
        chapters,
        config: {
          style: 'quote',
          quote,
          chapter: latestChapter?.chapter_number,
          author: story.title,
          gradientIndex: Math.floor(Math.random() * palette.gradients.length),
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
  count: number = 5
): CardData[] {
  const suggestions: CardData[] = [];
  const styles: CardStyle[] = ['quote', 'milestone', 'illustrated', 'origin', 'chapter'];

  styles.forEach(style => {
    suggestions.push(generateCardData(story, chapters, style));
  });

  while (suggestions.length < count) {
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    suggestions.push(generateCardData(story, chapters, randomStyle));
  }

  return suggestions.slice(0, count);
}

// Card style presets for UI selection
export const CARD_STYLE_PRESETS: Record<
  CardStyle,
  { label: string; description: string; icon: string; previewColors: [string, string] }
> = {
  quote: {
    label: 'Quote Card',
    description: 'Elegant typography with a poignant quote from your story',
    icon: 'quote',
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
  origin: {
    label: 'Story Origin',
    description: 'Where it all began - a quote from your first chapter',
    icon: 'heart',
    previewColors: ['#FF6B6B', '#FF8E53'],
  },
  chapter: {
    label: 'Chapter Excerpt',
    description: 'A beautiful excerpt from your latest chapter',
    icon: 'book-open',
    previewColors: ['#4ECDC4', '#44A08D'],
  },
};

// Format chapter number
export function formatChapterNumber(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const suffix = num % 100 > 10 && num % 100 < 14 ? 'th' : suffixes[num % 10] || 'th';
  return `${num}${suffix}`;
}
