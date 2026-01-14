'use client';

import { motion } from 'framer-motion';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  const themes: { value: 'light' | 'dark' | 'system'; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-cream-200 dark:bg-dark-bgTertiary border border-cream-300 dark:border-dark-border">
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        const isCurrentlyActive = value === 'system'
          ? theme === 'system'
          : actualTheme === value;

        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'relative p-2 rounded-md transition-all duration-200',
              'hover:bg-cream-300 dark:hover:bg-dark-bgSecondary',
              isActive && 'bg-white dark:bg-dark-bg shadow-sm'
            )}
            title={label}
            aria-label={`Switch to ${label} theme`}
          >
            <Icon
              className={cn(
                'w-4 h-4 transition-colors',
                isCurrentlyActive
                  ? 'text-rose-500 dark:text-dark-rose'
                  : 'text-ink-700 dark:text-dark-textSecondary'
              )}
            />
            {isActive && (
              <motion.div
                layoutId="activeTheme"
                className="absolute inset-0 bg-white dark:bg-dark-bg rounded-md shadow-sm -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
