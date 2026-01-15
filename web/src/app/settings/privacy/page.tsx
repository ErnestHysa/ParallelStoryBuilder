'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Lock, Eye, Download, Trash2, Sparkles, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getSettingsService, type PrivacySettings } from '@/lib/settings';

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    show_online_status: true,
    allow_profile_visibility: 'everyone',
    allow_story_sharing: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const settingsService = getSettingsService();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const loadedSettings = await settingsService.loadPrivacySettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof PrivacySettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setIsSaving(true);
    try {
      await settingsService.updatePrivacyPreferences(newSettings as PrivacySettings);
      toast.success('Privacy settings updated!');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      toast.error('Failed to update settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = async () => {
    setIsExporting(true);
    try {
      const blob = await settingsService.exportUserData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parallel-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    setIsDeleting(true);
    try {
      await settingsService.deleteAccount(deletePassword);
      toast.success('Account deleted successfully');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const visibilityOptions = [
    { value: 'everyone', label: 'Everyone', desc: 'Anyone can find you' },
    { value: 'partners', label: 'Partners Only', desc: 'Only story partners' },
    { value: 'none', label: 'Private', desc: 'No one can find you' },
  ] as const;

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
          <ArrowLeft className="w-5 h-5 text-ink-950 dark:text-dark-text" />
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
            {/* Show Online Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-950 dark:text-dark-text">Online Status</p>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Show when active</p>
              </div>
              <button
                onClick={() => handleToggle('show_online_status', !settings.show_online_status)}
                disabled={isSaving}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  settings.show_online_status ? 'bg-teal-500' : 'bg-cream-300 dark:bg-dark-border',
                  isSaving && 'opacity-50 cursor-wait'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
                    settings.show_online_status ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Profile Visibility */}
            <div>
              <p className="font-medium text-ink-950 dark:text-dark-text mb-3">Profile Visibility</p>
              <div className="grid grid-cols-3 gap-2">
                {visibilityOptions.map((option) => {
                  const isSelected = settings.allow_profile_visibility === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleToggle('allow_profile_visibility', option.value)}
                      disabled={isSaving}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-teal-500 text-white'
                          : 'bg-cream-200 dark:bg-dark-bgTertiary text-ink-700 dark:text-dark-text hover:bg-cream-300 dark:hover:bg-dark-border',
                        isSaving && 'opacity-50 cursor-wait'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-ink-500 dark:text-dark-textMuted mt-2">
                {visibilityOptions.find(o => o.value === settings.allow_profile_visibility)?.desc}
              </p>
            </div>

            {/* Story Sharing */}
            <div className="flex items-center justify-between pt-2 border-t border-cream-100 dark:border-dark-border">
              <div>
                <p className="font-medium text-ink-950 dark:text-dark-text">Story Sharing</p>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Social media sharing</p>
              </div>
              <button
                onClick={() => handleToggle('allow_story_sharing', !settings.allow_story_sharing)}
                disabled={isSaving}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  settings.allow_story_sharing ? 'bg-teal-500' : 'bg-cream-300 dark:bg-dark-border',
                  isSaving && 'opacity-50 cursor-wait'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
                    settings.allow_story_sharing ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
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
              onClick={handleDataExport}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-cream-50 dark:hover:bg-dark-bgTertiary transition-colors group disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-ink-950 dark:text-dark-text">
                    {isExporting ? 'Exporting...' : 'Export My Data'}
                  </p>
                  <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Download all data</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                if (confirm('Clear all locally stored data?')) {
                  localStorage.clear();
                  sessionStorage.clear();
                  toast.success('Local data cleared');
                }
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-orange-600 dark:text-orange-400">Clear Local Data</p>
                  <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Remove browser data</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group border-2 border-red-200 dark:border-red-900/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                  <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Permanently delete</p>
                </div>
              </div>
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
              href="/privacy"
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
          onClick={loadSettings}
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
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </motion.div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-red-900 dark:text-red-400">Delete Account</h2>
                  <p className="text-sm text-red-700 dark:text-red-500">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-ink-700 dark:text-dark-textSecondary mb-4">
                Deleting your account will permanently remove:
              </p>
              <ul className="space-y-2 mb-6 text-sm text-ink-600 dark:text-dark-textSecondary">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  All your stories and chapters
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Your profile and settings
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  All relationships with partners
                </li>
              </ul>

              <div>
                <label className="block text-sm font-medium text-ink-950 dark:text-dark-text mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream-200 dark:border-dark-border bg-white dark:bg-dark-bgTertiary text-ink-950 dark:text-dark-text focus:border-red-500 focus:outline-none"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-cream-50 dark:bg-dark-bgTertiary/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2 rounded-xl font-medium text-ink-700 dark:text-dark-text hover:bg-cream-200 dark:hover:bg-dark-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountDeletion}
                disabled={isDeleting || !deletePassword}
                className={cn(
                  'px-6 py-2 rounded-xl font-medium text-white transition-all flex items-center gap-2',
                  'bg-red-600 hover:bg-red-700 hover:shadow-lg',
                  (isDeleting || !deletePassword) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
