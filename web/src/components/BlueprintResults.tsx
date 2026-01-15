'use client';

/**
 * BlueprintResults Component (Web Version)
 *
 * Displays the personalized results after completing the Relationship Blueprint Quiz.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Lightbulb, Edit, HelpCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  getPersonalizedPrompts,
  getPersonalizedQuestions,
  QuizResult,
  ThemeRecommendation,
} from '@/lib/blueprintQuiz';
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
import { checkNotificationSupport } from '@/lib/notificationTemplates';

type TabType = 'insights' | 'prompts' | 'questions';

export function BlueprintResults() {
  const router = useRouter();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('insights');
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    // Load result from sessionStorage
    const savedResult = sessionStorage.getItem('blueprintResult');
    if (savedResult) {
      setResult(JSON.parse(savedResult));
    }

    // Check notification support and show prompt after delay
    if (checkNotificationSupport()) {
      const permission = Notification.permission;
      if (permission !== 'granted') {
        const timer = setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleCreateStory = () => {
    if (result?.storyPreferences[0]?.theme) {
      router.push(`/stories/new?theme=${result.storyPreferences[0].theme}`);
    } else {
      router.push('/stories/new');
    }
  };

  const getRelationshipStageLabel = (stage: QuizResult['relationshipStage']) => {
    switch (stage) {
      case 'new_ldr':
        return {
          label: 'New Love',
          icon: '🌱',
          color: '#4CAF50',
          description: 'Just starting your journey',
        };
      case 'established_ldr':
        return {
          label: 'Going Strong',
          icon: '💪',
          color: '#E91E63',
          description: 'Building something real',
        };
      case 'veteran_ldr':
        return {
          label: 'Veterans',
          icon: '🏆',
          color: '#FF9800',
          description: 'Distance veterans',
        };
    }
  };

  const getCommunicationStyleLabel = (style: QuizResult['communicationStyle']) => {
    switch (style) {
      case 'writer':
        return {
          label: 'Expressive Writer',
          icon: '✍️',
          description: 'You express yourself best through writing',
        };
      case 'talker':
        return {
          label: 'Conversationalist',
          icon: '💬',
          description: 'Words flow easily in conversation',
        };
      case 'visual':
        return {
          label: 'Visual Thinker',
          icon: '🎨',
          description: 'You see the world in images',
        };
      case 'shared_experience':
        return {
          label: 'Experience Seeker',
          icon: '🌟',
          description: 'Shared activities strengthen your bond',
        };
    }
  };

  const getLoveLanguageLabel = (language: QuizResult['loveLanguage']) => {
    switch (language) {
      case 'words':
        return { label: 'Words of Affirmation', icon: '💬', color: '#E91E63' };
      case 'time':
        return { label: 'Quality Time', icon: '⏰', color: '#9C27B0' };
      case 'gifts':
        return { label: 'Gift Giving', icon: '🎁', color: '#FFC107' };
      case 'touch':
        return { label: 'Physical Touch', icon: '🤗', color: '#4CAF50' };
      case 'acts':
        return { label: 'Acts of Service', icon: '🛠️', color: '#2196F3' };
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-ink-600 dark:text-dark-textSecondary">Loading your results...</p>
        </div>
      </div>
    );
  }

  const stageInfo = getRelationshipStageLabel(result.relationshipStage);
  const commStyleInfo = getCommunicationStyleLabel(result.communicationStyle);
  const loveLangInfo = getLoveLanguageLabel(result.loveLanguage);
  const personalizedPrompts = getPersonalizedPrompts(result);
  const personalizedQuestions = getPersonalizedQuestions(result);

  const themeInfo: Record<string, { name: string; icon: string; color: string }> = {
    romance: { name: 'Romance', icon: '💕', color: '#E91E63' },
    fantasy: { name: 'Fantasy', icon: '🐉', color: '#9C27B0' },
    our_future: { name: 'Our Future', icon: '🌟', color: '#2196F3' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 dark:from-dark-bg via-rose-50 dark:via-rose-950/20 to-cream-100 dark:to-dark-bg pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-dark-bgSecondary border-b border-cream-200 dark:border-dark-border">
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-20 h-20 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-4xl">🎉</span>
          </motion.div>
          <h1 className="font-display text-3xl md:text-4xl text-ink-950 dark:text-dark-text mb-2">
            Your Relationship Blueprint
          </h1>
          <p className="text-lg text-ink-600 dark:text-dark-textSecondary">
            Personalized insights just for you two
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Relationship Stage Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-elegant p-6 ornate-border"
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: stageInfo.color + '20' }}
            >
              <span className="text-2xl">{stageInfo.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl text-ink-950 dark:text-dark-text mb-1">
                {stageInfo.label}
              </h3>
              <p className="text-ink-600 dark:text-dark-textSecondary">{stageInfo.description}</p>
              <p className="text-sm text-ink-500 dark:text-dark-textMuted mt-3">
                Based on your relationship stage, we've curated prompts and experiences tailored
                to where you are in your journey.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Communication Style & Love Language */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-elegant p-6 ornate-border"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
                <span className="text-xl">{commStyleInfo.icon}</span>
              </div>
              <div>
                <h3 className="font-display text-lg text-ink-950 dark:text-dark-text mb-1">
                  {commStyleInfo.label}
                </h3>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">
                  {commStyleInfo.description}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-elegant p-6 ornate-border"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: loveLangInfo.color + '20' }}
              >
                <span className="text-xl">{loveLangInfo.icon}</span>
              </div>
              <div>
                <h3 className="font-display text-lg text-ink-950 dark:text-dark-text mb-1">
                  {loveLangInfo.label}
                </h3>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Your primary love language</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Theme Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-elegant p-6 ornate-border"
        >
          <h3 className="font-display text-xl text-ink-950 dark:text-dark-text mb-4">
            Recommended Story Themes
          </h3>
          <div className="space-y-3">
            {result.storyPreferences.slice(0, 3).map((themeRec, index) => {
              const info = themeInfo[themeRec.theme];
              return (
                <div
                  key={themeRec.theme}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 bg-cream-50 dark:bg-dark-bg"
                  style={{ borderColor: info.color + '40' }}
                >
                  <span className="text-2xl">{info.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-ink-900 dark:text-dark-text">{info.name}</p>
                    <p className="text-sm text-ink-500 dark:text-dark-textMuted">{themeRec.reason}</p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: info.color }}
                  >
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Personality Traits */}
        {result.personalityTraits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-elegant p-6 ornate-border"
          >
            <h3 className="font-display text-xl text-ink-950 dark:text-dark-text mb-4">
              Your Personality Traits
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.personalityTraits.map((trait, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-medium"
                >
                  {trait}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-elegant overflow-hidden ornate-border">
            {/* Tab Headers */}
            <div className="flex border-b border-cream-200 dark:border-dark-border">
              <button
                onClick={() => setActiveTab('insights')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 transition-colors ${
                  activeTab === 'insights'
                    ? 'text-rose-500 dark:text-dark-rose bg-rose-50 dark:bg-rose-950/30'
                    : 'text-ink-600 dark:text-dark-textSecondary hover:bg-cream-50 dark:hover:bg-dark-bg'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span className="font-medium">Recommendations</span>
              </button>
              <button
                onClick={() => setActiveTab('prompts')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 transition-colors ${
                  activeTab === 'prompts'
                    ? 'text-rose-500 dark:text-dark-rose bg-rose-50 dark:bg-rose-950/30'
                    : 'text-ink-600 dark:text-dark-textSecondary hover:bg-cream-50 dark:hover:bg-dark-bg'
                }`}
              >
                <Edit className="w-4 h-4" />
                <span className="font-medium">Writing Prompts</span>
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 transition-colors ${
                  activeTab === 'questions'
                    ? 'text-rose-500 dark:text-dark-rose bg-rose-50 dark:bg-rose-950/30'
                    : 'text-ink-600 dark:text-dark-textSecondary hover:bg-cream-50 dark:hover:bg-dark-bg'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span className="font-medium">Questions</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 min-h-[200px]">
              {activeTab === 'insights' && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <h4 className="font-medium text-ink-900 dark:text-dark-text">
                    Personalized Recommendations
                  </h4>
                  {result.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-cream-50 dark:bg-dark-bg">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          rec.priority === 'high'
                            ? 'bg-rose-500'
                            : rec.priority === 'medium'
                            ? 'bg-amber-500'
                            : 'bg-purple-500'
                        }`}
                      >
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <p className="text-ink-700 dark:text-dark-textSecondary">{rec.content}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'prompts' && (
                <motion.div
                  key="prompts"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <h4 className="font-medium text-ink-900 dark:text-dark-text">
                    Story Writing Prompts
                  </h4>
                  {personalizedPrompts.map((prompt, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl bg-cream-50 dark:bg-dark-bg hover:bg-cream-100 dark:hover:bg-dark-bgSecondary transition-colors cursor-pointer"
                      onClick={() => router.push(`/stories/new?prompt=${encodeURIComponent(prompt)}`)}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-amethyst-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-ink-700 dark:text-dark-textSecondary">{prompt}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'questions' && (
                <motion.div
                  key="questions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <h4 className="font-medium text-ink-900 dark:text-dark-text">
                    Relationship Questions
                  </h4>
                  {personalizedQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-xl bg-cream-50 dark:bg-dark-bg"
                    >
                      <HelpCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <p className="text-ink-700 dark:text-dark-textSecondary">{question}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-bgSecondary border-t border-cream-200 dark:border-dark-border p-4">
        <div className="max-w-3xl mx-auto flex gap-4">
          <button
            onClick={() => router.push('/stories')}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-cream-200 dark:border-dark-border text-ink-700 dark:text-dark-text font-medium hover:bg-cream-50 dark:hover:bg-dark-bg transition-colors"
          >
            Do This Later
          </button>
          <button
            onClick={handleCreateStory}
            className="flex-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amethyst-600 text-white font-medium hover:shadow-lg transition-all"
          >
            <span>Create Your Story</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* Notification Permission Prompt */}
      <NotificationPermissionPrompt
        open={showNotificationPrompt}
        onDismiss={() => setShowNotificationPrompt(false)}
        onEnabled={() => setShowNotificationPrompt(false)}
      />
    </div>
  );
}

export default BlueprintResults;
