'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarOption {
  id: string;
  url: string | null;
  emoji: string;
  label: string;
}

const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'default', url: null, emoji: '👤', label: 'Default' },
  { id: 'cat', url: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'dog', url: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'dragon', url: 'dragon', emoji: '🐉', label: 'Dragon' },
  { id: 'heart', url: 'heart', emoji: '❤️', label: 'Heart' },
  { id: 'star', url: 'star', emoji: '⭐', label: 'Star' },
  { id: 'moon', url: 'moon', emoji: '🌙', label: 'Moon' },
  { id: 'sun', url: 'sun', emoji: '☀️', label: 'Sun' },
  { id: 'sparkle', url: 'sparkle', emoji: '✨', label: 'Sparkle' },
  { id: 'rocket', url: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'rainbow', url: 'rainbow', emoji: '🌈', label: 'Rainbow' },
  { id: 'clover', url: 'clover', emoji: '🍀', label: 'Lucky' },
];

interface AvatarPickerProps {
  currentAvatarUrl: string | null;
  onSelect: (avatar: AvatarOption) => void;
  disabled?: boolean;
}

export function AvatarPicker({ currentAvatarUrl, onSelect, disabled = false }: AvatarPickerProps) {
  const [showCustomUrl, setShowCustomUrl] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customUrlError, setCustomUrlError] = useState('');

  const handleCustomUrlSubmit = () => {
    // Validate URL
    if (!customUrl.trim()) {
      setCustomUrlError('Please enter a URL');
      return;
    }

    try {
      new URL(customUrl);
      const customOption: AvatarOption = {
        id: 'custom',
        url: customUrl,
        emoji: '🖼️',
        label: 'Custom',
      };
      onSelect(customOption);
      setShowCustomUrl(false);
      setCustomUrl('');
      setCustomUrlError('');
    } catch {
      setCustomUrlError('Please enter a valid URL');
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Avatar Preview */}
      <div className="flex items-center justify-center">
        <motion.div
          key={currentAvatarUrl || 'default'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-amethyst-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <span className="text-5xl">
              {AVATAR_OPTIONS.find(a => a.url === currentAvatarUrl)?.emoji || '👤'}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-dark-bgSecondary rounded-full border-2 border-rose-500 flex items-center justify-center shadow-md">
            <Camera className="w-4 h-4 text-rose-500" />
          </div>
        </motion.div>
      </div>

      <p className="text-center text-sm text-ink-600 dark:text-dark-textSecondary">
        Choose an avatar or use a custom image URL
      </p>

      {/* Avatar Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {AVATAR_OPTIONS.map((option) => {
          const isSelected = option.url === currentAvatarUrl;
          return (
            <motion.button
              key={option.id}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !disabled && onSelect(option)}
              disabled={disabled}
              className={cn(
                'relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all',
                'border-2',
                isSelected
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                  : 'border-cream-300 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700 bg-white dark:bg-dark-bgTertiary',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="text-[10px] font-medium text-ink-700 dark:text-dark-textSecondary">
                {option.label}
              </span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Custom URL Section */}
      <div className="pt-4 border-t border-cream-200 dark:border-dark-border">
        {!showCustomUrl ? (
          <button
            type="button"
            onClick={() => setShowCustomUrl(true)}
            disabled={disabled}
            className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-cream-300 dark:border-dark-border hover:border-rose-400 dark:hover:border-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-ink-600 dark:text-dark-textSecondary font-medium disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" />
              Use Custom Image URL
            </span>
          </button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setCustomUrlError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomUrlSubmit()}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-dark-bgTertiary font-body text-sm transition-colors',
                    customUrlError
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                      : 'border-cream-300 dark:border-dark-border focus:border-rose-500 focus:ring-rose-500'
                  )}
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={handleCustomUrlSubmit}
                  disabled={disabled || !customUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium transition-colors disabled:opacity-50"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomUrl(false);
                    setCustomUrl('');
                    setCustomUrlError('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-cream-200 dark:bg-dark-bgTertiary hover:bg-cream-300 dark:hover:bg-dark-border text-ink-700 dark:text-dark-text transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {customUrlError && (
                <p className="text-sm text-red-500 dark:text-red-400">{customUrlError}</p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
