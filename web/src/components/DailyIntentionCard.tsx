'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Heart, CheckCircle, Sun, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyIntention {
  id: string;
  intention: string;
  partner_intention?: string | null;
  streak_count?: number;
  completed?: boolean;
  completed_at?: string | null;
  created_at: string;
}

interface DailyIntentionCardProps {
  intention: DailyIntention | null;
  onSetIntention: (intention: string) => Promise<void>;
  onCompleteIntention: () => Promise<void>;
  isLoading?: boolean;
}

const writingPrompts = [
  "Write about a favorite memory together",
  "Describe what you're looking forward to",
  "Share something you appreciate about your partner",
  "Write about a dream you have for your future",
  "Describe your partner from your perspective",
];

export default function DailyIntentionCard({
  intention,
  onSetIntention,
  onCompleteIntention,
  isLoading = false,
}: DailyIntentionCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const handleSetIntention = async () => {
    const text = selectedPrompt || inputValue;
    if (!text.trim()) return;

    try {
      await onSetIntention(text);
      setShowModal(false);
      setInputValue('');
      setSelectedPrompt(null);
    } catch (error) {
      console.error('Failed to set intention:', error);
    }
  };

  const handleComplete = async () => {
    try {
      await onCompleteIntention();
    } catch (error) {
      console.error('Failed to complete intention:', error);
    }
  };

  const getStreakCount = () => {
    return intention?.streak_count || 0;
  };

  const getStreakColor = (count: number) => {
    if (count >= 30) return 'text-red-500';
    if (count >= 14) return 'text-orange-500';
    if (count >= 7) return 'text-green-500';
    return 'text-blue-500';
  };

  const getStreakBgColor = (count: number) => {
    if (count >= 30) return 'bg-red-100 dark:bg-red-900/30';
    if (count >= 14) return 'bg-orange-100 dark:bg-orange-900/30';
    if (count >= 7) return 'bg-green-100 dark:bg-green-900/30';
    return 'bg-blue-100 dark:bg-blue-900/30';
  };

  const getStreakLabel = (count: number) => {
    if (count >= 30) return '🔥 On Fire!';
    if (count >= 14) return '⭐ Amazing!';
    if (count >= 7) return '💪 Keep it up!';
    if (count > 0) return '🌱 Growing';
    return 'Start your streak';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Daily Intention Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-2xl shadow-soft overflow-hidden",
          "bg-gradient-to-br from-rose-50 to-amethyst-50 dark:from-rose-950/20 dark:to-amethyst-950/20",
          "border border-rose-200 dark:border-rose-900/30"
        )}
      >
        {!intention ? (
          // No intention set - show prompt to set one
          <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-amethyst-500 flex items-center justify-center">
                <Sun className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="font-display text-2xl text-ink-950 dark:text-dark-text mb-2">
              Daily Intention
            </h3>
            <p className="font-body text-ink-700 dark:text-dark-textSecondary mb-6">
              What do you want to create or share with your partner today?
            </p>
            <button
              onClick={() => setShowModal(true)}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-full font-accent font-medium hover:shadow-elegant hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              Set Your Intention
            </button>
          </div>
        ) : (
          // Intention set - show details
          <div className="p-6">
            {/* Header with streak */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  getStreakBgColor(getStreakCount())
                )}>
                  <Flame className={cn("w-6 h-6", getStreakColor(getStreakCount()))} />
                </div>
                <div>
                  <p className="font-display text-2xl text-ink-950 dark:text-dark-text">
                    {getStreakCount()}
                  </p>
                  <p className="text-sm text-ink-600 dark:text-dark-textMuted">
                    {getStreakLabel(getStreakCount())}
                  </p>
                </div>
              </div>
              <p className="text-sm text-ink-600 dark:text-dark-textMuted">
                {intention.created_at ? formatDate(intention.created_at) : 'Today'}
              </p>
            </div>

            {/* Your Intention */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <p className="text-sm font-accent font-semibold text-rose-600 dark:text-rose-400">
                  Your Intention
                </p>
              </div>
              <div className="bg-white dark:bg-dark-bgSecondary rounded-xl p-4 border border-cream-200 dark:border-dark-border">
                <p className="font-body text-ink-800 dark:text-dark-text">
                  {intention.intention}
                </p>
              </div>
            </div>

            {/* Complete button or completed state */}
            {!intention.completed ? (
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cream-100 dark:bg-dark-bgTertiary hover:bg-rose-100 dark:hover:bg-rose-900/30 text-ink-800 dark:text-dark-text rounded-xl font-accent font-medium transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Complete
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl">
                <CheckCircle className="w-5 h-5" />
                <span className="font-accent font-medium">Completed!</span>
              </div>
            )}

            {/* Partner's Intention */}
            {intention.partner_intention && (
              <div className="mt-4 pt-4 border-t border-cream-200 dark:border-dark-border">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-accent font-semibold text-blue-600 dark:text-blue-400">
                    Partner's Intention
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                  <p className="font-body text-ink-800 dark:text-dark-text">
                    {intention.partner_intention}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Set Intention Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-elegant max-w-md w-full p-6"
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-cream-100 dark:hover:bg-dark-bgTertiary rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-ink-600 dark:text-dark-textSecondary" />
            </button>

            {/* Header */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-amethyst-500 flex items-center justify-center">
                <Sun className="w-7 h-7 text-white" />
              </div>
            </div>

            <h3 className="font-display text-2xl text-ink-950 dark:text-dark-text text-center mb-2">
              Set Your Daily Intention
            </h3>
            <p className="font-body text-ink-700 dark:text-dark-textSecondary text-center mb-6">
              What do you want to create or share with your partner today?
            </p>

            {/* Writing prompts */}
            <div className="mb-6">
              <p className="text-sm font-accent text-ink-600 dark:text-dark-textSecondary mb-3">
                Quick prompts:
              </p>
              <div className="flex flex-wrap gap-2">
                {writingPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setSelectedPrompt(prompt)}
                    className={cn(
                      "px-3 py-2 rounded-full text-xs font-body transition-colors",
                      selectedPrompt === prompt
                        ? "bg-rose-500 text-white"
                        : "bg-cream-100 dark:bg-dark-bgTertiary text-ink-700 dark:text-dark-text hover:bg-rose-100 dark:hover:bg-rose-900/30"
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom input */}
            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setSelectedPrompt(null);
              }}
              placeholder="Or write your own intention..."
              className="w-full px-4 py-3 bg-cream-100 dark:bg-dark-bgTertiary border border-cream-200 dark:border-dark-border rounded-xl text-ink-950 dark:text-dark-text placeholder:text-ink-400 dark:placeholder:text-dark-textMuted focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-700 resize-none"
              rows={3}
              maxLength={200}
            />

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setInputValue('');
                  setSelectedPrompt(null);
                }}
                className="flex-1 px-4 py-3 bg-cream-100 dark:bg-dark-bgTertiary text-ink-700 dark:text-dark-text rounded-xl font-accent font-medium hover:bg-cream-200 dark:hover:bg-dark-bgTertiary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetIntention}
                disabled={isLoading || !(inputValue.trim() || selectedPrompt)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-xl font-accent font-medium hover:shadow-elegant transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set Intention
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
