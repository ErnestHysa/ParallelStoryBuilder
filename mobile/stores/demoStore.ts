import { create } from 'zustand';
import { Story, Chapter, Inspiration, Theme } from '@/lib/types';

// Demo data for the app when Supabase is not configured

const DEMO_STORIES: Story[] = [
  {
    id: 'demo-story-1',
    title: 'A Love Across Distance',
    theme: 'romance',
    created_by: 'demo-user',
    pairing_code: 'LOVE123',
    status: 'active',
    current_turn: 'demo-user',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-story-2',
    title: 'The Dragon\'s Quest',
    theme: 'fantasy',
    created_by: 'demo-partner',
    pairing_code: 'DRAGON456',
    status: 'active',
    current_turn: 'demo-user',
    created_at: new Date().toISOString(),
  },
];

const DEMO_CHAPTERS: Record<string, Chapter[]> = {
  'demo-story-1': [
    {
      id: 'chapter-1',
      story_id: 'demo-story-1',
      author_id: 'demo-partner',
      chapter_number: 1,
      content: 'The rain tapped gently against my window, each drop reminding me of the miles between us. I picked up my phone, your contact glowing on the screen, and wondered what story we would write together today.',
      ai_enhanced_content: null,
      context_snippet: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'chapter-2',
      story_id: 'demo-story-1',
      author_id: 'demo-user',
      chapter_number: 2,
      content: 'I smiled as my fingers typed the first words of our new chapter. Distance was just a number when our hearts were writing the same story.',
      ai_enhanced_content: null,
      context_snippet: null,
      created_at: new Date().toISOString(),
    },
  ],
  'demo-story-2': [
    {
      id: 'chapter-3',
      story_id: 'demo-story-2',
      author_id: 'demo-partner',
      chapter_number: 1,
      content: 'The ancient dragon stirred from its millennia-long slumber, its golden eyes opening to pierce through the darkness of the cavern. Young apprentice Elara drew her breath, not in fear, but in wonder.',
      ai_enhanced_content: null,
      context_snippet: null,
      created_at: new Date().toISOString(),
    },
  ],
};

const DEMO_INSPIRATIONS: Inspiration[] = [
  {
    id: 'insp-1',
    story_id: 'demo-story-1',
    user_id: 'demo-partner',
    content: 'What if we add a scene where they finally meet at the airport?',
    created_at: new Date().toISOString(),
  },
  {
    id: 'insp-2',
    story_id: 'demo-story-1',
    user_id: 'demo-user',
    content: 'I love that idea! Maybe it could rain when they first see each other - a callback to the opening.',
    created_at: new Date().toISOString(),
  },
];

interface DemoState {
  stories: Story[];
  chapters: Record<string, Chapter[]>;
  inspirations: Inspiration[];
  isDemoMode: boolean;

  // Initialization
  initializeDemo: () => void;

  // Story methods
  getStories: () => Story[];
  getStory: (id: string) => Story | undefined;
  createStory: (title: string, theme: Theme) => Story;
  deleteStory: (id: string) => void;

  // Chapter methods
  getChapters: (storyId: string) => Chapter[];
  getChapter: (storyId: string, chapterNumber: number) => Chapter | undefined;
  addChapter: (storyId: string, content: string) => Chapter;
  updateChapter: (storyId: string, chapterId: string, content: string) => void;

  // Inspiration methods
  getInspirations: (storyId: string) => Inspiration[];
  addInspiration: (storyId: string, content: string) => void;
  deleteInspiration: (id: string) => void;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  stories: DEMO_STORIES,
  chapters: DEMO_CHAPTERS,
  inspirations: DEMO_INSPIRATIONS,
  isDemoMode: true,

  initializeDemo: () => {
    // Demo mode is already initialized with default data
    console.log('Demo mode initialized');
  },

  getStories: () => {
    return get().stories;
  },

  getStory: (id: string) => {
    return get().stories.find(s => s.id === id);
  },

  createStory: (title: string, theme: Theme) => {
    const newStory: Story = {
      id: `demo-story-${Date.now()}`,
      title,
      theme,
      created_by: 'demo-user',
      pairing_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'active',
      current_turn: 'demo-user',
      created_at: new Date().toISOString(),
    };

    set(state => ({
      stories: [...state.stories, newStory],
      chapters: { ...state.chapters, [newStory.id]: [] },
    }));

    return newStory;
  },

  deleteStory: (id: string) => {
    set(state => {
      const newStories = state.stories.filter(s => s.id !== id);
      const newChapters = { ...state.chapters };
      delete newChapters[id];
      const newInspirations = state.inspirations.filter(i => i.story_id !== id);
      return {
        stories: newStories,
        chapters: newChapters,
        inspirations: newInspirations,
      };
    });
  },

  getChapters: (storyId: string) => {
    return get().chapters[storyId] || [];
  },

  getChapter: (storyId: string, chapterNumber: number) => {
    const chapters = get().chapters[storyId] || [];
    return chapters.find(c => c.chapter_number === chapterNumber);
  },

  addChapter: (storyId: string, content: string) => {
    const chapters = get().chapters[storyId] || [];
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      story_id: storyId,
      author_id: 'demo-user',
      chapter_number: chapters.length + 1,
      content,
      ai_enhanced_content: null,
      context_snippet: null,
      created_at: new Date().toISOString(),
    };

    set(state => ({
      chapters: {
        ...state.chapters,
        [storyId]: [...chapters, newChapter],
      },
    }));

    return newChapter;
  },

  updateChapter: (storyId: string, chapterId: string, content: string) => {
    set(state => ({
      chapters: {
        ...state.chapters,
        [storyId]: state.chapters[storyId]?.map(c =>
          c.id === chapterId ? { ...c, content } : c
        ) || [],
      },
    }));
  },

  getInspirations: (storyId: string) => {
    return get().inspirations.filter(i => i.story_id === storyId);
  },

  addInspiration: (storyId: string, content: string) => {
    const newInspiration: Inspiration = {
      id: `insp-${Date.now()}`,
      story_id: storyId,
      user_id: 'demo-user',
      content,
      created_at: new Date().toISOString(),
    };

    set(state => ({
      inspirations: [...state.inspirations, newInspiration],
    }));
  },

  deleteInspiration: (id: string) => {
    set(state => ({
      inspirations: state.inspirations.filter(i => i.id !== id),
    }));
  },
}));
