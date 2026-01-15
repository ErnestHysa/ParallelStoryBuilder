/**
 * Relationship Blueprint Quiz Data (Web Version)
 *
 * Shared quiz data and types for the web application.
 */

export type QuestionType = 'choice' | 'multiple' | 'slider' | 'text';
export type QuizCategory = 'foundation' | 'preferences' | 'communication' | 'dreams';

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  question: string;
  type: QuestionType;
  icon: string;
  options?: QuizOption[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
}

export interface QuizOption {
  id: string;
  label: string;
  icon?: string;
  value: string | number;
}

export interface QuizAnswer {
  questionId: string;
  value: string | number | string[];
  skipped: boolean;
}

export interface QuizResult {
  relationshipStage: 'new_ldr' | 'established_ldr' | 'veteran_ldr';
  communicationStyle: 'writer' | 'talker' | 'visual' | 'shared_experience';
  loveLanguage: 'words' | 'time' | 'gifts' | 'touch' | 'acts';
  storyPreferences: ThemeRecommendation[];
  writingComfort: 'intimidated' | 'neutral' | 'confident';
  personalityTraits: string[];
  recommendations: QuizRecommendation[];
}

export interface ThemeRecommendation {
  theme: 'romance' | 'fantasy' | 'our_future';
  score: number;
  reason: string;
}

export interface QuizRecommendation {
  type: 'prompt' | 'question' | 'activity';
  content: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * All 15 quiz questions organized by category
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // CATEGORY 1: RELATIONSHIP FOUNDATION (5 questions)
  {
    id: 'q1_together_duration',
    category: 'foundation',
    question: 'How long have you been together?',
    type: 'choice',
    icon: '💕',
    options: [
      { id: 'together_1', label: 'Less than 6 months', value: 'new_ldr' },
      { id: 'together_2', label: '6 months - 2 years', value: 'early_ldr' },
      { id: 'together_3', label: '2-5 years', value: 'established_ldr' },
      { id: 'together_4', label: '5+ years', value: 'veteran_ldr' },
    ],
  },
  {
    id: 'q2_distance_apart',
    category: 'foundation',
    question: 'What\'s your current distance apart?',
    type: 'choice',
    icon: '🌍',
    options: [
      { id: 'dist_1', label: 'Same city', value: 'same_city' },
      { id: 'dist_2', label: 'Different cities (<100 miles)', value: 'near_ldr' },
      { id: 'dist_3', label: 'Different states/countries', value: 'far_ldr' },
      { id: 'dist_4', label: 'Opposite sides of the world', value: 'extreme_ldr' },
    ],
  },
  {
    id: 'q3_communication_frequency',
    category: 'foundation',
    question: 'How often do you typically communicate?',
    type: 'choice',
    icon: '💬',
    options: [
      { id: 'freq_1', label: 'Multiple times daily', value: 'constant' },
      { id: 'freq_2', label: 'Once a day', value: 'daily' },
      { id: 'freq_3', label: 'A few times a week', value: 'weekly' },
      { id: 'freq_4', label: 'Whenever we can', value: 'flexible' },
    ],
  },
  {
    id: 'q4_preferred_connection',
    category: 'foundation',
    question: 'What\'s your preferred way to connect?',
    type: 'choice',
    icon: '📞',
    options: [
      { id: 'conn_1', label: 'Video calls', value: 'visual' },
      { id: 'conn_2', label: 'Voice calls', value: 'talker' },
      { id: 'conn_3', label: 'Texting/messages', value: 'writer' },
      { id: 'conn_4', label: 'Shared activities (games, movies)', value: 'shared_experience' },
    ],
  },
  {
    id: 'q5_relationship_style',
    category: 'foundation',
    question: 'How would you describe your relationship?',
    type: 'choice',
    icon: '✨',
    options: [
      { id: 'style_1', label: 'Romantic & affectionate', value: 'romance', icon: '🥰' },
      { id: 'style_2', label: 'Playful & fun', value: 'fantasy', icon: '🎮' },
      { id: 'style_3', label: 'Deep & meaningful', value: 'our_future', icon: '🌟' },
      { id: 'style_4', label: 'Adventurous & spontaneous', value: 'fantasy', icon: '🚀' },
    ],
  },

  // CATEGORY 2: STORY PREFERENCES (4 questions)
  {
    id: 'q6_genre_preference',
    category: 'preferences',
    question: 'What genres do you both enjoy?',
    type: 'multiple',
    icon: '📚',
    options: [
      { id: 'gen_1', label: 'Romance', value: 'romance', icon: '💕' },
      { id: 'gen_2', label: 'Fantasy/Adventure', value: 'fantasy', icon: '🐉' },
      { id: 'gen_3', label: 'Sci-Fi', value: 'scifi', icon: '🚀' },
      { id: 'gen_4', label: 'Mystery', value: 'mystery', icon: '🔍' },
      { id: 'gen_5', label: 'Slice of Life', value: 'life', icon: '🌱' },
      { id: 'gen_6', label: 'Comedy', value: 'comedy', icon: '😂' },
    ],
  },
  {
    id: 'q7_character_similarity',
    category: 'preferences',
    question: 'Should your story characters be like you or completely different?',
    type: 'choice',
    icon: '👥',
    options: [
      { id: 'char_1', label: 'Exactly like us', value: 'reflection' },
      { id: 'char_2', label: 'Loosely inspired by us', value: 'inspired' },
      { id: 'char_3', label: 'Completely different', value: 'escape' },
      { id: 'char_4', label: 'A mix of both', value: 'hybrid' },
    ],
  },
  {
    id: 'q8_chapter_length',
    category: 'preferences',
    question: 'Do you prefer short chapters or deep dives?',
    type: 'slider',
    icon: '📝',
    min: 1,
    max: 5,
    step: 1,
    defaultValue: 3,
    options: [
      { id: 'len_1', label: 'Quick updates', value: 1 },
      { id: 'len_2', label: 'Short & sweet', value: 2 },
      { id: 'len_3', label: 'Balanced', value: 3 },
      { id: 'len_4', label: 'Detailed', value: 4 },
      { id: 'len_5', label: 'Deep dives', value: 5 },
    ],
  },
  {
    id: 'q9_story_focus',
    category: 'preferences',
    question: 'What\'s more important in your story?',
    type: 'choice',
    icon: '🎯',
    options: [
      { id: 'focus_1', label: 'Emotional depth', value: 'emotional' },
      { id: 'focus_2', label: 'Adventure & excitement', value: 'adventure' },
      { id: 'focus_3', label: 'Building a future together', value: 'future' },
      { id: 'focus_4', label: 'Just having fun', value: 'fun' },
    ],
  },

  // CATEGORY 3: COMMUNICATION STYLE (3 questions)
  {
    id: 'q10_feedback_style',
    category: 'communication',
    question: 'How do you prefer to give/receive feedback on writing?',
    type: 'choice',
    icon: '🔄',
    options: [
      { id: 'feed_1', label: 'Direct & constructive', value: 'direct' },
      { id: 'feed_2', label: 'Gentle & encouraging', value: 'gentle' },
      { id: 'feed_3', label: 'Through suggestions, not criticism', value: 'suggestions' },
      { id: 'feed_4', label: 'I prefer not to receive feedback', value: 'none' },
    ],
  },
  {
    id: 'q11_writing_style',
    category: 'communication',
    question: 'What\'s your writing style preference?',
    type: 'choice',
    icon: '✍️',
    options: [
      { id: 'write_1', label: 'Poetic & expressive', value: 'writer' },
      { id: 'write_2', label: 'Conversational & casual', value: 'talker' },
      { id: 'write_3', label: 'Visual & descriptive', value: 'visual' },
      { id: 'write_4', label: 'Straightforward & simple', value: 'shared_experience' },
    ],
  },
  {
    id: 'q12_conflict_handling',
    category: 'communication',
    question: 'How do you handle disagreements in the story?',
    type: 'choice',
    icon: '🤝',
    options: [
      { id: 'conf_1', label: 'We talk it through together', value: 'collaborative' },
      { id: 'conf_2', label: 'Each writes their perspective', value: 'individual' },
      { id: 'conf_3', label: 'We compromise in the middle', value: 'compromise' },
      { id: 'conf_4', label: 'Whatever the story needs', value: 'story_first' },
    ],
  },

  // CATEGORY 4: FUTURE DREAMS (3 questions)
  {
    id: 'q13_dream_adventure',
    category: 'dreams',
    question: 'What\'s one adventure you want to share together?',
    type: 'text',
    icon: '🌠',
  },
  {
    id: 'q14_future_vision',
    category: 'dreams',
    question: 'How do you envision your future together?',
    type: 'choice',
    icon: '🔮',
    options: [
      { id: 'fut_1', label: 'Closing the distance soon', value: 'closing_distance' },
      { id: 'fut_2', label: 'Building something together', value: 'building' },
      { id: 'fut_3', label: 'Taking it day by day', value: 'day_by_day' },
      { id: 'fut_4', label: 'Growing together, wherever we are', value: 'growing' },
    ],
  },
  {
    id: 'q15_relationship_goal',
    category: 'dreams',
    question: 'What relationship goal means the most to you?',
    type: 'choice',
    icon: '🎯',
    options: [
      { id: 'goal_1', label: 'Deep emotional connection', value: 'words' },
      { id: 'goal_2', label: 'Creating shared memories', value: 'time' },
      { id: 'goal_3', label: 'Supporting each other\'s growth', value: 'acts' },
      { id: 'goal_4', label: 'Always being there for each other', value: 'touch' },
      { id: 'goal_5', label: 'Surprising each other', value: 'gifts' },
    ],
  },
];

/**
 * Category information for display
 */
export const QUIZ_CATEGORIES: Record<
  QuizCategory,
  { name: string; icon: string; description: string; color: string }
> = {
  foundation: {
    name: 'Relationship Foundation',
    icon: '💕',
    description: 'Let\'s understand your relationship',
    color: '#E91E63',
  },
  preferences: {
    name: 'Story Preferences',
    icon: '📚',
    description: 'What kind of stories do you love?',
    color: '#9C27B0',
  },
  communication: {
    name: 'Communication Style',
    icon: '💬',
    description: 'How do you like to express yourself?',
    color: '#2196F3',
  },
  dreams: {
    name: 'Future Dreams',
    icon: '🌠',
    description: 'What does your future hold?',
    color: '#FF9800',
  },
};

/**
 * Calculate quiz results from answers
 */
export function calculateQuizResults(answers: QuizAnswer[]): QuizResult {
  const answerMap = new Map<string, QuizAnswer>();
  answers.forEach((a) => answerMap.set(a.questionId, a));

  // Determine relationship stage
  const q1Answer = answerMap.get('q1_together_duration')?.value as string;
  const relationshipStage: QuizResult['relationshipStage'] =
    q1Answer === 'new_ldr' ? 'new_ldr' :
    q1Answer === 'veteran_ldr' ? 'veteran_ldr' :
    q1Answer === 'early_ldr' ? 'established_ldr' : 'established_ldr';

  // Determine communication style
  const connAnswer = answerMap.get('q4_preferred_connection')?.value as string;
  const writeAnswer = answerMap.get('q11_writing_style')?.value as string;
  const communicationStyle: QuizResult['communicationStyle'] =
    writeAnswer as QuizResult['communicationStyle'] ||
    connAnswer as QuizResult['communicationStyle'] ||
    'writer';

  // Determine love language
  const goalAnswer = answerMap.get('q15_relationship_goal')?.value as string;
  const loveLanguage: QuizResult['loveLanguage'] =
    goalAnswer as QuizResult['loveLanguage'] || 'words';

  // Calculate theme preferences
  const genreAnswers = answerMap.get('q6_genre_preference')?.value as string[];
  const styleAnswer = answerMap.get('q5_relationship_style')?.value as string;
  const focusAnswer = answerMap.get('q9_story_focus')?.value as string;

  const storyPreferences: ThemeRecommendation[] = [];

  // Romance theme score
  let romanceScore = 0;
  if (genreAnswers?.includes('romance')) romanceScore += 3;
  if (styleAnswer === 'romance') romanceScore += 2;
  if (focusAnswer === 'emotional') romanceScore += 2;
  if (loveLanguage === 'words') romanceScore += 1;
  storyPreferences.push({
    theme: 'romance',
    score: romanceScore,
    reason: romanceScore > 4 ? 'You value emotional connection' : 'A romantic touch',
  });

  // Fantasy theme score
  let fantasyScore = 0;
  if (genreAnswers?.includes('fantasy') || genreAnswers?.includes('scifi')) fantasyScore += 3;
  if (styleAnswer === 'fantasy') fantasyScore += 2;
  if (focusAnswer === 'adventure') fantasyScore += 2;
  storyPreferences.push({
    theme: 'fantasy',
    score: fantasyScore,
    reason: fantasyScore > 4 ? 'You love adventure' : 'Add some excitement',
  });

  // Our Future theme score
  let futureScore = 0;
  if (genreAnswers?.includes('life')) futureScore += 3;
  if (styleAnswer === 'our_future') futureScore += 2;
  if (focusAnswer === 'future') futureScore += 2;
  storyPreferences.push({
    theme: 'our_future',
    score: futureScore,
    reason: futureScore > 4 ? 'You\'re building together' : 'Dream of the future',
  });

  // Sort by score
  storyPreferences.sort((a, b) => b.score - a.score);

  // Determine writing comfort
  const writingComfort: QuizResult['writingComfort'] = 'neutral';

  // Extract personality traits
  const personalityTraits: string[] = [];
  if (connAnswer === 'writer') personalityTraits.push('Expressive Writer');
  if (connAnswer === 'talker') personalityTraits.push('Conversationalist');
  if (connAnswer === 'visual') personalityTraits.push('Visual Thinker');
  if (connAnswer === 'shared_experience') personalityTraits.push('Experience Seeker');
  if (focusAnswer === 'adventure') personalityTraits.push('Adventurous');
  if (focusAnswer === 'emotional') personalityTraits.push('Deep Thinker');

  // Generate recommendations
  const recommendations: QuizRecommendation[] = [];

  if (relationshipStage === 'new_ldr') {
    recommendations.push({
      type: 'prompt',
      content: 'Write about the moment you knew this was something special',
      priority: 'high',
    });
  } else if (relationshipStage === 'veteran_ldr') {
    recommendations.push({
      type: 'prompt',
      content: 'Reflect on how you\'ve grown together over the years',
      priority: 'high',
    });
  }

  if (communicationStyle === 'writer') {
    recommendations.push({
      type: 'activity',
      content: 'Try writing alternating perspectives of the same memory',
      priority: 'medium',
    });
  }

  if (loveLanguage === 'words') {
    recommendations.push({
      type: 'question',
      content: 'What words do you want to hear most from each other?',
      priority: 'high',
    });
  }

  return {
    relationshipStage,
    communicationStyle,
    loveLanguage,
    storyPreferences,
    writingComfort,
    personalityTraits,
    recommendations,
  };
}

/**
 * Get personalized prompts based on quiz results
 */
export function getPersonalizedPrompts(result: QuizResult): string[] {
  const prompts: string[] = [];

  switch (result.relationshipStage) {
    case 'new_ldr':
      prompts.push('Your first conversation that lasted all night');
      prompts.push('The moment you realized you were falling for them');
      break;
    case 'established_ldr':
      prompts.push('A favorite memory that still makes you smile');
      prompts.push('How you support each other through difficult times');
      break;
    case 'veteran_ldr':
      prompts.push('How you\'ve changed and grown together');
      prompts.push('The little things that keep your love strong');
      break;
  }

  if (result.storyPreferences[0]?.theme === 'romance') {
    prompts.push('Describe what their voice sounds like when they say "I love you"');
  } else if (result.storyPreferences[0]?.theme === 'fantasy') {
    prompts.push('If you went on an adventure together, where would you go?');
  } else if (result.storyPreferences[0]?.theme === 'our_future') {
    prompts.push('Your dream life together, 5 years from now');
  }

  return prompts.slice(0, 5);
}

/**
 * Get personalized questions based on quiz results
 */
export function getPersonalizedQuestions(result: QuizResult): string[] {
  const questions: string[] = [];

  switch (result.communicationStyle) {
    case 'writer':
      questions.push('What letter would you write to your future selves together?');
      questions.push('If your love story was a book, what would chapter one say?');
      break;
    case 'talker':
      questions.push('What conversation could you have for hours and never get bored?');
      questions.push('What\'s something you\'ve been wanting to tell them?');
      break;
    case 'visual':
      questions.push('What\'s the most beautiful thing you\'ve seen together?');
      questions.push('Describe your favorite shared memory in vivid detail');
      break;
    case 'shared_experience':
      questions.push('What\'s an activity you want to experience together?');
      questions.push('What\'s the best adventure you\'ve shared so far?');
      break;
  }

  switch (result.loveLanguage) {
    case 'words':
      questions.push('What words of affirmation do you crave most?');
      break;
    case 'time':
      questions.push('How do you make the most of your time together?');
      break;
    case 'gifts':
      questions.push('What\'s a meaningful gift you\'ve given each other?');
      break;
    case 'touch':
      questions.push('Describe what it feels like when you\'re together');
      break;
    case 'acts':
      questions.push('What acts of service mean the most to you?');
      break;
  }

  return questions.slice(0, 5);
}
