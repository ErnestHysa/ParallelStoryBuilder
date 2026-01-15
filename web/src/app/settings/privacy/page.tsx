'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Lock, Eye, Download, Trash2, Sparkles, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PrivacySettings {
  showOnlineStatus: boolean;
  allowStorySharing: boolean;
  profileVisible: boolean;
}

const defaultSettings: PrivacySettings = {
  showOnlineStatus: true,
  allowStorySharing: false,
  profileVisible: true,
};

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('privacy-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse privacy settings:', e);
      }
    }
  }, []);

  const handleToggle = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.setItem('privacy-settings', JSON.stringify(settings));
    setIsSaving(false);
    toast.success('Privacy settings saved!');
  };

  const handleDataRequest = (type: 'export' | 'delete') => {
    if (type === 'delete') {
      const confirmed = confirm(
        'This will permanently delete your account and all associated data. This action cannot be undone. Are you sure?'
      );
      if (!confirmed) return;
    }
    toast.success(`${type === 'export' ? 'Data export' : 'Account deletion'} request received.`);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <Link
          href="/settings"
          className="w-10 h-10 rounded-xl bg-white dark:bg-dark-bgSecondary hover:bg-cream-100 dark:hover:bg-dark-bgTertiary flex items-center justify-center transition-colors border border-cream-200 dark:border-dark-border"
        >
          <ArrowLeft className="w-5 h-5 text-ink-700 dark:text-dark-text" />
        </Link>
        <div>
          <h1 className="font-display text-display-md text-ink-950 dark:text-dark-text">
            Privacy
          </h1>
          <p className="font-body text-ink-700 dark:text-dark-textSecondary">
            Control your data and visibility
          </p>
        </div>
      </motion.div>

      {/* Privacy Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-6 text-white shadow-xl mb-6"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <p className="font-semibold text-lg">Privacy Protection</p>
              <p className="text-white/80 text-sm">Your data is secure and private</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Settings Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Visibility Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-cream-100 dark:border-dark-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/30 flex items-center justify-center">
              <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text">Visibility</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { key: 'showOnlineStatus' as const, label: 'Online Status', desc: 'Show when active' },
              { key: 'profileVisible' as const, label: 'Profile Visible', desc: 'Allow discovery' },
              { key: 'allowStorySharing' as const, label: 'Story Sharing', desc: 'Social media sharing' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-950 dark:text-dark-text">{item.label}</p>
                  <p className="text-sm text-ink-600 dark:text-dark-textSecondary">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(item.key, !settings[item.key])}
                  className={cn(
                    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                    settings[item.key] ? 'bg-teal-500' : 'bg-cream-300 dark:bg-dark-border'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
                      settings[item.key] ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Data Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-cream-100 dark:border-dark-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text">Data Control</h3>
          </div>
          <div className="p-6 space-y-3">
            <button
              onClick={() => handleDataRequest('export')}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-cream-50 dark:hover:bg-dark-bgTertiary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-ink-950 dark:text-dark-text">Export My Data</p>
                  <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Download all data</p>
                </div>
              </div>
              <span className="text-xs text-ink-400 dark:text-dark-textMuted">Soon</span>
            </button>

            <button
              onClick={() => handleDataRequest('delete')}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                  <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Permanently delete</p>
                </div>
              </div>
              <span className="text-xs text-ink-400 dark:text-dark-textMuted">Soon</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Privacy Policy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-cream-50 dark:bg-dark-bgTertiary/50 rounded-2xl border border-cream-200 dark:border-dark-border p-5 mb-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-ink-100 dark:bg-ink-900/30 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-ink-600 dark:text-ink-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-ink-950 dark:text-dark-text mb-1">
              Your Privacy Matters
            </h3>
            <p className="font-body text-sm text-ink-700 dark:text-dark-textSecondary mb-3">
              We're committed to protecting your personal information. Read our Privacy Policy to learn how we handle your data.
            </p>
            <a
              href="#"
              className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline"
            >
              View Privacy Policy →
            </a>
          </div>
        </div>
      </motion.div>

      {/* Coming Soon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-2xl border border-teal-200 dark:border-teal-900/50 p-5 mb-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-ink-950 dark:text-dark-text mb-1">
              Enhanced Privacy Controls Coming Soon
            </h3>
            <p className="font-body text-sm text-ink-700 dark:text-dark-textSecondary">
              More privacy features including data download, granular sharing controls, and GDPR compliance tools.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'px-6 py-3 rounded-xl font-accent font-medium transition-all flex items-center gap-2',
            isSaving
              ? 'bg-cream-200 dark:bg-dark-bgTertiary text-ink-500 cursor-wait'
              : 'bg-gradient-to-r from-rose-500 to-amethyst-600 text-white hover:shadow-lg hover:scale-105'
          )}
        >
          {isSaving ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </motion.div>
    </div>
  );
}
