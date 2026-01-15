'use client';

/**
 * BlueprintQuiz Component (Web Version)
 *
 * A comprehensive onboarding quiz that personalizes the app experience
 * based on relationship stage, communication style, and story preferences.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, SkipForward, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  QUIZ_QUESTIONS,
  QUIZ_CATEGORIES,
  QuizQuestion,
  QuizOption,
  calculateQuizResults,
  QuizAnswer,
} from '@/lib/blueprintQuiz';

export function BlueprintQuiz() {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedValue, setSelectedValue] = useState<string | number | string[]>('');
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100;

  // Update selected value when question changes
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = answers.find((a) => a.questionId === currentQuestion.id);
      if (existingAnswer && !existingAnswer.skipped) {
        setSelectedValue(existingAnswer.value);
      } else {
        setSelectedValue(currentQuestion.type === 'multiple' ? [] : '');
      }
    }
  }, [currentQuestion, answers]);

  const categoryInfo = currentQuestion ? QUIZ_CATEGORIES[currentQuestion.category] : null;

  const handleNext = () => {
    if (!currentQuestion) return;

    // Save the answer
    const newAnswers = [...answers.filter((a) => a.questionId !== currentQuestion.id)];
    if (selectedValue !== '' && selectedValue !== undefined) {
      newAnswers.push({
        questionId: currentQuestion.id,
        value: selectedValue,
        skipped: false,
      });
    }
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setDirection('next');
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed - save results and redirect
      handleComplete(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setDirection('prev');
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSkip = () => {
    if (!currentQuestion) return;

    const newAnswers = [
      ...answers.filter((a) => a.questionId !== currentQuestion.id),
      {
        questionId: currentQuestion.id,
        value: '',
        skipped: true,
      },
    ];
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setDirection('next');
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleComplete(newAnswers);
    }
  };

  const handleSkipQuiz = () => {
    router.push('/stories');
  };

  const handleComplete = (finalAnswers: QuizAnswer[]) => {
    const result = calculateQuizResults(finalAnswers);
    // Store result in sessionStorage for results page
    sessionStorage.setItem('blueprintResult', JSON.stringify(result));
    router.push('/blueprint-results');
  };

  const canProceed =
    currentQuestion?.type === 'choice' ||
    (typeof selectedValue === 'string' && selectedValue.length > 0) ||
    (typeof selectedValue === 'number' && selectedValue > 0) ||
    (Array.isArray(selectedValue) && selectedValue.length > 0);

  if (!currentQuestion || !categoryInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const variants = {
    enter: (direction: 'next' | 'prev') => ({
      x: direction === 'next' ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'next' | 'prev') => ({
      x: direction === 'next' ? -50 : 50,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 dark:from-dark-bg via-rose-50 dark:via-rose-950/20 to-cream-100 dark:to-dark-bg flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-dark-bgSecondary border-b border-cream-200 dark:border-dark-border">
        <div className="max-w-2xl mx-auto px-6 py-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleSkipQuiz}
              className="text-ink-600 dark:text-dark-textSecondary hover:text-ink-900 dark:hover:text-dark-text text-sm font-medium transition-colors"
            >
              Skip Quiz
            </button>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-950/30">
              <span className="text-lg">{categoryInfo.icon}</span>
              <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                {categoryInfo.name}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-cream-200 dark:bg-dark-border rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full transition-colors"
                style={{
                  width: `${progress}%`,
                  backgroundColor: categoryInfo.color,
                }}
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-sm font-medium text-ink-700 dark:text-dark-textSecondary min-w-[60px] text-right">
              {currentQuestionIndex + 1} / {QUIZ_QUESTIONS.length}
            </span>
          </div>
        </div>
      </header>

      {/* Question Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-dark-bgSecondary rounded-3xl shadow-elegant p-8 md:p-12 ornate-border"
            >
              {/* Question */}
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">{currentQuestion.icon}</div>
                <h2 className="font-display text-2xl md:text-3xl text-ink-950 dark:text-dark-text mb-2">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              {currentQuestion.type === 'choice' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => {
                    const isSelected = selectedValue === option.value;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedValue(option.value)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                            : 'border-cream-200 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {option.icon && (
                            <span className="text-2xl">{option.icon}</span>
                          )}
                          <span
                            className={`font-medium ${
                              isSelected
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-ink-800 dark:text-dark-text'
                            }`}
                          >
                            {option.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'multiple' && (
                <div className="space-y-3">
                  <p className="text-sm text-ink-500 dark:text-dark-textMuted mb-4 text-center">
                    Select all that apply
                  </p>
                  {currentQuestion.options?.map((option) => {
                    const isSelected = (selectedValue as string[])?.includes(option.value as string);
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          const values = selectedValue as string[];
                          if (isSelected) {
                            setSelectedValue(values.filter((v) => v !== option.value));
                          } else {
                            setSelectedValue([...values, option.value as string]);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                            : 'border-cream-200 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {option.icon && (
                            <span className="text-2xl">{option.icon}</span>
                          )}
                          <span
                            className={`font-medium ${
                              isSelected
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-ink-800 dark:text-dark-text'
                            }`}
                          >
                            {option.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'slider' && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option) => {
                    const optionValue = option.value as number;
                    const isSelected = selectedValue === optionValue;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedValue(optionValue)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'border-rose-500 bg-rose-500 text-white'
                            : 'border-cream-200 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700'
                        }`}
                      >
                        <span className={`font-medium ${isSelected ? 'text-white' : 'text-ink-800 dark:text-dark-text'}`}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'text' && (
                <div className="relative">
                  <textarea
                    value={selectedValue as string}
                    onChange={(e) => setSelectedValue(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={5}
                    maxLength={500}
                    className="w-full p-4 border-2 border-cream-200 dark:border-dark-border rounded-xl focus:border-rose-500 focus:ring-rose-200 dark:focus:ring-rose-700 transition-colors resize-none bg-cream-50 dark:bg-dark-bg text-ink-900 dark:text-dark-text placeholder:text-ink-400"
                  />
                  <span className="absolute bottom-4 right-4 text-sm text-ink-400">
                    {(selectedValue as string)?.length || 0} / 500
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-bgSecondary border-t border-cream-200 dark:border-dark-border">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {currentQuestionIndex > 0 ? (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-ink-600 dark:text-dark-textSecondary hover:bg-cream-100 dark:hover:bg-dark-bg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Back</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleSkip}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-ink-600 dark:text-dark-textSecondary hover:bg-cream-100 dark:hover:bg-dark-bg transition-colors"
            >
              <SkipForward className="w-5 h-5" />
              <span className="font-medium">Skip</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amethyst-600 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {currentQuestionIndex === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next'}
              </span>
              {currentQuestionIndex === QUIZ_QUESTIONS.length - 1 ? (
                <Check className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default BlueprintQuiz;
