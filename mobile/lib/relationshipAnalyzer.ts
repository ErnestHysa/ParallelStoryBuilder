import { supabase } from './supabase';
import { useStoriesStore } from '../stores/storiesStore';

export interface RelationshipAnalysis {
  communicationFrequency: number;
  writingBalance: number;
  themePreferences: {
    preferredThemes: string[];
    sharedThemes: string[];
    diversityScore: number;
  };
  streakSync: {
    currentStreak: number;
    syncScore: number;
    lastSyncDate: string | null;
  };
  emotionalTone: {
    positivity: number;
    engagement: number;
    depth: number;
  };
  suggestions: string[];
}

export class RelationshipAnalyzer {
  private static instance: RelationshipAnalyzer;

  static getInstance(): RelationshipAnalyzer {
    if (!RelationshipAnalyzer.instance) {
      RelationshipAnalyzer.instance = new RelationshipAnalyzer();
    }
    return RelationshipAnalyzer.instance;
  }

  async analyzeRelationship(storyId: string): Promise<RelationshipAnalysis> {
    try {
      // Fetch story data with chapters
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select(`
          *,
          chapters(*),
          story_members(*)
        `)
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;
      if (!story) throw new Error('Story not found');

      const analysis = await this.performAnalysis(story);
      return analysis;
    } catch (error) {
      console.error('Error analyzing relationship:', error);
      throw error;
    }
  }

  private async performAnalysis(story: any): Promise<RelationshipAnalysis> {
    const chapters = story.chapters || [];
    const members = story.story_members || [];

    // Get user profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', members.map((m: any) => m.user_id));

    const analysis: RelationshipAnalysis = {
      communicationFrequency: this.calculateCommunicationFrequency(chapters),
      writingBalance: this.calculateWritingBalance(chapters, members),
      themePreferences: this.analyzeThemePreferences(chapters),
      streakSync: this.calculateStreakSync(chapters),
      emotionalTone: this.analyzeEmotionalTone(chapters),
      suggestions: []
    };

    // Generate suggestions based on analysis
    analysis.suggestions = this.generateSuggestions(analysis);

    return analysis;
  }

  private calculateCommunicationFrequency(chapters: any[]): number {
    if (chapters.length === 0) return 0;

    const now = new Date();
    const storyStartDate = new Date(chapters[0].created_at);
    const daysActive = Math.max(1, Math.floor((now.getTime() - storyStartDate.getTime()) / (1000 * 60 * 60 * 24)));

    const chapterFrequency = (chapters.length / daysActive) * 7; // Chapters per week
    return Math.min(100, Math.round(chapterFrequency * 10)); // Scale to 0-100
  }

  private calculateWritingBalance(chapters: any[], members: any[]): number {
    if (chapters.length === 0) return 50; // Perfect balance

    const userChapterCounts: { [key: string]: number } = {};

    chapters.forEach((chapter) => {
      const authorId = chapter.user_id;
      userChapterCounts[authorId] = (userChapterCounts[authorId] || 0) + 1;
    });

    const totalChapters = chapters.length;
    let balance = 0;

    members.forEach((member) => {
      const userChapters = userChapterCounts[member.user_id] || 0;
      const percentage = (userChapters / totalChapters) * 100;
      // Calculate deviation from 50% (perfect balance)
      balance += Math.abs(percentage - 50);
    });

    // Convert balance score (lower is better)
    const balanceScore = Math.max(0, 100 - (balance / members.length) * 2);
    return Math.round(balanceScore);
  }

  private analyzeThemePreferences(chapters: any[]): RelationshipAnalysis['themePreferences'] {
    const themes = chapters.map((chapter) => chapter.theme || 'unknown');
    const themeCounts: { [key: string]: number } = {};

    themes.forEach((theme) => {
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    });

    const sortedThemes = Object.entries(themeCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([theme]) => theme);

    const totalChapters = chapters.length;
    const preferredThemes = sortedThemes.slice(0, 3); // Top 3 themes
    const sharedThemes = preferredThemes.filter(theme =>
      chapters.filter(c => c.theme === theme).length >= Math.ceil(totalChapters / 2)
    );

    // Calculate diversity score (number of unique themes)
    const diversity = Object.keys(themeCounts).length;
    const maxPossibleThemes = 12; // Assuming 12 predefined themes
    const diversityScore = Math.min(100, (diversity / maxPossibleThemes) * 100);

    return {
      preferredThemes,
      sharedThemes,
      diversityScore: Math.round(diversityScore)
    };
  }

  private calculateStreakSync(chapters: any[]): RelationshipAnalysis['streakSync'] {
    if (chapters.length === 0) {
      return {
        currentStreak: 0,
        syncScore: 0,
        lastSyncDate: null
      };
    }

    // Sort chapters by date
    const sortedChapters = [...chapters].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let currentStreak = 0;
    let lastDate = new Date(sortedChapters[0].created_at);
    let lastSyncDate: string | null = null;

    for (let i = 1; i < sortedChapters.length; i++) {
      const currentDate = new Date(sortedChapters[i].created_at);
      const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 3) { // Consider within 3 days as part of streak
        currentStreak++;
        lastSyncDate = sortedChapters[i].created_at;
      } else {
        break;
      }
      lastDate = currentDate;
    }

    // Sync score based on regularity of contributions
    const totalDays = Math.ceil(
      (new Date().getTime() - new Date(sortedChapters[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedChapters = Math.max(1, Math.floor(totalDays / 7)); // Expected weekly chapters
    const syncScore = Math.min(100, (chapters.length / expectedChapters) * 50);

    return {
      currentStreak: currentStreak + 1, // Include first chapter
      syncScore: Math.round(syncScore),
      lastSyncDate
    };
  }

  private analyzeEmotionalTone(chapters: any[]): RelationshipAnalysis['emotionalTone'] {
    if (chapters.length === 0) {
      return {
        positivity: 50,
        engagement: 50,
        depth: 50
      };
    }

    // Simple emotional analysis based on text features
    const positiveWords = ['love', 'happy', 'joy', 'wonderful', 'amazing', 'beautiful', 'perfect', 'great'];
    const engagementWords = ['wonder', 'curious', 'explore', 'discover', 'imagine', 'think', 'feel'];
    const depthWords = ['soul', 'heart', 'deep', 'meaning', 'purpose', 'journey', 'connection', 'intimate'];

    let positivityScore = 0;
    let engagementScore = 0;
    let depthScore = 0;
    let totalWords = 0;

    chapters.forEach((chapter) => {
      const text = chapter.content || '';
      const words = text.toLowerCase().split(/\s+/);

      words.forEach((word) => {
        totalWords++;
        if (positiveWords.some(pw => word.includes(pw))) positivityScore++;
        if (engagementWords.some(ew => word.includes(ew))) engagementScore++;
        if (depthWords.some(dw => word.includes(dw))) depthScore++;
      });
    });

    // Normalize scores
    const normalize = (score: number, total: number) => total > 0 ? (score / total) * 100 : 50;

    return {
      positivity: Math.min(100, Math.round(normalize(positivityScore, totalWords))),
      engagement: Math.min(100, Math.round(normalize(engagementScore, totalWords))),
      depth: Math.min(100, Math.round(normalize(depthScore, totalWords)))
    };
  }

  private generateSuggestions(analysis: RelationshipAnalysis): string[] {
    const suggestions: string[] = [];

    // Communication frequency suggestions
    if (analysis.communicationFrequency < 30) {
      suggestions.push('Try writing chapters more frequently to maintain connection');
    } else if (analysis.communicationFrequency > 70) {
      suggestions.push('Great job on frequent communication! Keep it up!');
    }

    // Writing balance suggestions
    if (analysis.writingBalance < 60) {
      suggestions.push('Try to balance your writing contributions more evenly');
    }

    // Theme preferences suggestions
    if (analysis.themePreferences.diversityScore < 30) {
      suggestions.push('Try exploring different story themes to keep things fresh');
    }

    // Streak sync suggestions
    if (analysis.streakSync.syncScore < 50) {
      suggestions.push('Establish a regular writing schedule to maintain sync');
    }

    // Emotional tone suggestions
    if (analysis.emotionalTone.positivity < 40) {
      suggestions.push('Focus on more positive and uplifting content');
    }
    if (analysis.emotionalTone.depth < 40) {
      suggestions.push('Try exploring deeper emotions and thoughts in your writing');
    }

    // Relationship questions suggestion
    suggestions.push('Answer daily relationship questions to deepen your connection');

    return suggestions;
  }

  // Utility methods
  async getRelationshipStats(storyId: string) {
    const analysis = await this.analyzeRelationship(storyId);

    return {
      totalChapters: analysis.communicationFrequency * 7 / 10, // Rough estimate
      averageChaptersPerWeek: Math.round(analysis.communicationFrequency / 10),
      balanceScore: analysis.writingBalance,
      currentStreak: analysis.streakSync.currentStreak,
      syncScore: analysis.streakSync.syncScore,
      topThemes: analysis.themePreferences.preferredThemes.slice(0, 2),
      positivity: analysis.emotionalTone.positivity,
      suggestions: analysis.suggestions
    };
  }
}

export const relationshipAnalyzer = RelationshipAnalyzer.getInstance();