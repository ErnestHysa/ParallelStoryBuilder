'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SettingsCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'danger' | 'success';
}

export function SettingsCard({
  title,
  description,
  children,
  className,
  variant = 'default',
}: SettingsCardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-dark-bgSecondary border-cream-200 dark:border-dark-border',
    danger: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50',
    success: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border p-6 shadow-sm',
        variantStyles[variant],
        className
      )}
    >
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-dark-text">
              {title}
            </h3>
          )}
          {description && (
            <p className="font-body text-sm text-ink-600 dark:text-dark-textSecondary mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ title, children, className }: SettingsSectionProps) {
  return (
    <div className={cn('py-4 border-t border-cream-100 dark:border-dark-border first:border-t-0', className)}>
      <h4 className="font-body text-sm font-semibold text-ink-700 dark:text-dark-textSecondary uppercase tracking-wide mb-4">
        {title}
      </h4>
      {children}
    </div>
  );
}

interface SettingItemProps {
  label: string;
  description?: string;
  action: ReactNode;
  className?: string;
}

export function SettingItem({ label, description, action, className }: SettingItemProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-3', className)}>
      <div className="flex-1 min-w-0">
        <p className="font-body font-medium text-ink-950 dark:text-dark-text">{label}</p>
        {description && (
          <p className="font-body text-sm text-ink-600 dark:text-dark-textSecondary mt-0.5">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
