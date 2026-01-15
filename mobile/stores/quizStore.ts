import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  QuizAnswer,
  QuizQuestion,
  QuizResult,
  QUIZ_QUESTIONS,
  calculateQuizResults,
  getPersonalizedPrompts,
  getPersonalizedQuestions,
} from '@/lib/blueprintQuiz';

export interface QuizState {
  // Quiz state
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  isCompleted: boolean;
  isSkipped: boolean;
  result: QuizResult | null;

  // Actions
  setCurrentQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  setAnswer: (questionId: string, value: string | number | string[]) => void;
  skipQuestion: (questionId: string) => void;
  completeQuiz: () => QuizResult;
  skipQuiz: () => void;
  resetQuiz: () => void;
  getCurrentQuestion: () => QuizQuestion | null;
  getProgress: () => number;
  canProceed: () => boolean;
  getPersonalizedPrompts: () => string[];
  getPersonalizedQuestions: () => string[];
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentQuestionIndex: 0,
      answers: [],
      isCompleted: false,
      isSkipped: false,
      result: null,

      setCurrentQuestion: (index: number) => {
        set({ currentQuestionIndex: Math.max(0, Math.min(index, QUIZ_QUESTIONS.length - 1)) });
      },

      nextQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      setAnswer: (questionId: string, value: string | number | string[]) => {
        set((state) => {
          const existingIndex = state.answers.findIndex((a) => a.questionId === questionId);
          const newAnswer: QuizAnswer = { questionId, value, skipped: false };

          if (existingIndex >= 0) {
            // Update existing answer
            const newAnswers = [...state.answers];
            newAnswers[existingIndex] = newAnswer;
            return { answers: newAnswers };
          } else {
            // Add new answer
            return { answers: [...state.answers, newAnswer] };
          }
        });
      },

      skipQuestion: (questionId: string) => {
        set((state) => {
          const existingIndex = state.answers.findIndex((a) => a.questionId === questionId);
          const skipAnswer: QuizAnswer = { questionId, value: '', skipped: true };

          if (existingIndex >= 0) {
            const newAnswers = [...state.answers];
            newAnswers[existingIndex] = skipAnswer;
            return { answers: newAnswers };
          } else {
            return { answers: [...state.answers, skipAnswer] };
          }
        });
      },

      completeQuiz: () => {
        const { answers } = get();
        const result = calculateQuizResults(answers);
        set({ isCompleted: true, result });
        return result;
      },

      skipQuiz: () => {
        set({ isSkipped: true, isCompleted: true });
        // Return default result
        const defaultResult: QuizResult = {
          relationshipStage: 'new_ldr',
          communicationStyle: 'writer',
          loveLanguage: 'words',
          storyPreferences: [
            { theme: 'romance', score: 3, reason: 'A romantic touch' },
            { theme: 'fantasy', score: 2, reason: 'Add some excitement' },
            { theme: 'our_future', score: 2, reason: 'Dream of the future' },
          ],
          writingComfort: 'neutral',
          personalityTraits: ['Story Builder'],
          recommendations: [
            { type: 'prompt', content: 'Write your first chapter together!', priority: 'high' },
          ],
        };
        set({ result: defaultResult });
        return defaultResult;
      },

      resetQuiz: () => {
        set({
          currentQuestionIndex: 0,
          answers: [],
          isCompleted: false,
          isSkipped: false,
          result: null,
        });
      },

      getCurrentQuestion: () => {
        const { currentQuestionIndex } = get();
        return QUIZ_QUESTIONS[currentQuestionIndex] || null;
      },

      getProgress: () => {
        const { currentQuestionIndex, answers } = get();
        const total = QUIZ_QUESTIONS.length;
        const answered = answers.filter((a) => !a.skipped && a.value !== '').length;
        return Math.round(((answered + currentQuestionIndex) / (total * 2)) * 100);
      },

      canProceed: () => {
        const { currentQuestionIndex, answers } = get();
        const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
        if (!currentQuestion) return false;

        // Check if current question has been answered
        const answer = answers.find((a) => a.questionId === currentQuestion.id);
        if (!answer) return false;

        // For non-skipped answers, check if value exists
        if (answer.skipped) return true;
        if (Array.isArray(answer.value)) return answer.value.length > 0;
        return answer.value !== '' && answer.value !== undefined && answer.value !== null;
      },

      getPersonalizedPrompts: () => {
        const { result } = get();
        if (!result) return [];
        return getPersonalizedPrompts(result);
      },

      getPersonalizedQuestions: () => {
        const { result } = get();
        if (!result) return [];
        return getPersonalizedQuestions(result);
      },
    }),
    {
      name: 'quiz-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Hook to get quiz-specific utilities
 */
export function useQuizUtilities() {
  const { result, getPersonalizedPrompts, getPersonalizedQuestions } = useQuizStore();

  return {
    result,
    personalizedPrompts: result ? getPersonalizedPrompts() : [],
    personalizedQuestions: result ? getPersonalizedQuestions() : [],
  };
}
