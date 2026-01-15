'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Clock, Eye, Trash2, Download, ChevronRight, Sparkles, Lock, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SecuritySettings {
  sessionTimeout: number;
  autoLock: boolean;
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
}

const defaultSettings: SecuritySettings = {
  sessionTimeout: 30,
  autoLock: true,
  twoFactorEnabled: false,
  biometricEnabled: false,
};

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('security-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse security settings:', e);
      }
    }
  }, []);

  const handleToggleSetting = (key: keyof SecuritySettings, value: boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    localStorage.setItem('security-settings', JSON.stringify(settings));
    setIsSaving(false);
    toast.success('Security settings saved!');
  };

  const handleComingSoon = (feature: string) => {
    toast.success(`${feature} coming soon! We're working on it.`);
  };

  const calculateSecurityScore = () => {
    let score = 50;
    if (settings.twoFactorEnabled) score += 25;
    if (settings.autoLock) score += 10;
    if (settings.sessionTimeout <= 15) score += 10;
    if (settings.sessionTimeout <= 5) score += 5;
    return Math.min(100, score);
  };

  const getSecurityLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'emerald', icon: ShieldCheck };
    if (score >= 60) return { label: 'Good', color: 'blue', icon: ShieldCheck };
    if (score >= 40) return { label: 'Fair', color: 'amber', icon: ShieldAlert };
    return { label: 'Poor', color: 'red', icon: ShieldX };
  };

  const securityScore = calculateSecurityScore();
  const securityLevel = getSecurityLevel(securityScore);
  const SecurityIcon = securityLevel.icon;

  const timeoutOptions = [
    { value: 5, label: '5 min' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
  ];

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
            Security
          </h1>
          <p className="font-body text-ink-700 dark:text-dark-textSecondary">
            Protect your account and data
          </p>
        </div>
      </motion.div>

      {/* Security Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-amethyst-600 p-6 text-white shadow-xl mb-6"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/80 mb-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Security Score</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold tracking-tight">{securityScore}%</span>
              <span className="text-xl font-medium text-white/90">{securityLevel.label}</span>
            </div>
          </div>

          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
          >
            <SecurityIcon className="w-10 h-10" strokeWidth={2} />
          </motion.div>
        </div>
      </motion.div>

      {/* Settings Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Authentication */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-cream-100 dark:border-dark-border">
            <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text">Authentication</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-950 dark:text-dark-text">Two-Factor Authentication</p>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Add an extra layer of security</p>
              </div>
              <button
                onClick={() => handleComingSoon('2FA')}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  settings.twoFactorEnabled ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
                    settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-950 dark:text-dark-text">Biometric Authentication</p>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Use fingerprint or face recognition</p>
              </div>
              <button
                onClick={() => handleComingSoon('Biometric auth')}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  settings.biometricEnabled ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
                    settings.biometricEnabled ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <button
              onClick={() => handleComingSoon('Password change')}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="font-medium text-ink-950 dark:text-dark-text">Change Password</span>
              </div>
              <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
                <span className="text-sm">Soon</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Session Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-cream-100 dark:border-dark-border">
            <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text">Session Management</h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-950 dark:text-dark-text">Auto-Lock</p>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Lock when inactive</p>
              </div>
              <button
                onClick={() => handleToggleSetting('autoLock', !settings.autoLock)}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  settings.autoLock ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
                    settings.autoLock ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-ink-950 dark:text-dark-text">Session Timeout</p>
                  <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Auto-sign out delay</p>
                </div>
                <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                  {settings.sessionTimeout} min
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {timeoutOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleToggleSetting('sessionTimeout', option.value)}
                    className={cn(
                      'py-2 px-3 rounded-xl text-sm font-medium transition-all',
                      settings.sessionTimeout === option.value
                        ? 'bg-rose-500 text-white'
                        : 'bg-cream-200 dark:bg-dark-bgTertiary text-ink-700 dark:text-dark-text hover:bg-cream-300 dark:hover:bg-dark-border'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Data & Privacy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden mb-6"
      >
        <div className="px-6 py-4 border-b border-cream-100 dark:border-dark-border">
          <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text">Data & Privacy</h3>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleComingSoon('Data export')}
            className="flex items-center justify-between p-4 rounded-xl hover:bg-cream-50 dark:hover:bg-dark-bgTertiary transition-colors group"
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
            <ChevronRight className="w-5 h-5 text-ink-400 dark:text-dark-textMuted group-hover:text-ink-600 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => {
              if (confirm('Clear all locally stored data?')) {
                localStorage.clear();
                sessionStorage.clear();
                toast.success('Local data cleared');
              }
            }}
            className="flex items-center justify-between p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-red-600 dark:text-red-400">Clear Local Data</p>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Remove browser data</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </motion.div>

      {/* Coming Soon Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-amethyst-50 to-rose-50 dark:from-amethyst-950/20 dark:to-rose-950/20 rounded-2xl border border-amethyst-200 dark:border-amethyst-900/50 p-5 mb-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amethyst-500 to-rose-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-ink-950 dark:text-dark-text mb-1">
              More Security Features Coming Soon
            </h3>
            <p className="font-body text-sm text-ink-700 dark:text-dark-textSecondary">
              Enhanced security features including two-factor authentication, password management, and data export capabilities.
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
