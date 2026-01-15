'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Trash2, Download, ChevronRight, Sparkles, ShieldCheck, ShieldX, ShieldAlert, X, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getSettingsService, type SecuritySettings } from '@/lib/settings';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SecuritySettingsPage() {
  const [settings, setSettings] = useState<SecuritySettings>({
    session_timeout: 30,
    auto_lock: true,
    two_factor_enabled: false,
    biometric_enabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
      const loadedSettings = await settingsService.loadSecuritySettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load security settings:', error);
      toast.error('Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSetting = async (key: keyof SecuritySettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setIsSaving(true);
    try {
      await settingsService.updateSecurityPreferences(newSettings);
      toast.success('Security settings updated!');
    } catch (error) {
      console.error('Failed to update security settings:', error);
      toast.error('Failed to update settings');
      // Revert on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handlePasswordChange = async () => {
    const errors: Partial<Record<keyof PasswordForm, string>> = {};

    // Validate current password
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    // Validate new password
    const passwordError = validatePassword(passwordForm.newPassword);
    if (passwordError) {
      errors.newPassword = passwordError;
    }

    // Validate confirm password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsChangingPassword(true);
    try {
      await settingsService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
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
      // Redirect to home after a short delay
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

  const calculateSecurityScore = () => {
    let score = 50;
    if (settings.two_factor_enabled) score += 25;
    if (settings.auto_lock) score += 10;
    if (settings.session_timeout <= 15) score += 10;
    if (settings.session_timeout <= 5) score += 5;
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

  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { level: 2, label: 'Fair', color: 'bg-amber-500' };
    if (strength <= 5) return { level: 3, label: 'Good', color: 'bg-emerald-500' };
    return { level: 4, label: 'Strong', color: 'bg-emerald-600' };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            {/* Password Change */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-ink-950 dark:text-dark-text">Change Password</p>
                  <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Update your password</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-rose-500 dark:text-rose-400 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Two-Factor Auth - Coming Soon */}
            <div className="flex items-center justify-between opacity-60">
              <div>
                <p className="font-medium text-ink-950 dark:text-dark-text">Two-Factor Authentication</p>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Add an extra layer of security</p>
              </div>
              <button
                className="relative inline-flex h-7 w-12 items-center rounded-full bg-cream-300 dark:bg-dark-border cursor-not-allowed"
              >
                <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform translate-x-1" />
              </button>
            </div>

            {/* Biometric Auth - Coming Soon */}
            <div className="flex items-center justify-between opacity-60">
              <div>
                <p className="font-medium text-ink-950 dark:text-dark-text">Biometric Authentication</p>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Use fingerprint or face recognition</p>
              </div>
              <button
                className="relative inline-flex h-7 w-12 items-center rounded-full bg-cream-300 dark:bg-dark-border cursor-not-allowed"
              >
                <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform translate-x-1" />
              </button>
            </div>
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
                onClick={() => handleToggleSetting('auto_lock', !settings.auto_lock)}
                disabled={isSaving}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  settings.auto_lock ? 'bg-rose-500' : 'bg-cream-300 dark:bg-dark-border',
                  isSaving && 'opacity-50 cursor-wait'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
                    settings.auto_lock ? 'translate-x-6' : 'translate-x-1'
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
                  {settings.session_timeout} min
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {timeoutOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleToggleSetting('session_timeout', option.value)}
                    disabled={isSaving}
                    className={cn(
                      'py-2 px-3 rounded-xl text-sm font-medium transition-all',
                      settings.session_timeout === option.value
                        ? 'bg-rose-500 text-white'
                        : 'bg-cream-200 dark:bg-dark-bgTertiary text-ink-700 dark:text-dark-text hover:bg-cream-300 dark:hover:bg-dark-border',
                      isSaving && 'opacity-50 cursor-wait'
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
            onClick={handleDataExport}
            disabled={isExporting}
            className="flex items-center justify-between p-4 rounded-xl hover:bg-cream-50 dark:hover:bg-dark-bgTertiary transition-colors group disabled:opacity-50 disabled:cursor-wait"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                {isExporting ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-orange-600 dark:text-orange-400">Clear Local Data</p>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Remove browser data</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-orange-500 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="sm:col-span-2 flex items-center justify-between p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group border-2 border-red-200 dark:border-red-900/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-red-600 dark:text-red-400">Delete Account</p>
                <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Permanently delete account and all data</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end"
      >
        <button
          onClick={() => loadSettings()}
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

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-2xl border border-cream-200 dark:border-dark-border overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-cream-200 dark:border-dark-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-ink-950 dark:text-dark-text">Change Password</h2>
                    <p className="text-sm text-ink-600 dark:text-dark-textSecondary">Enter your current and new password</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-cream-100 dark:hover:bg-dark-bgTertiary flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-ink-600 dark:text-dark-textSecondary" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-ink-950 dark:text-dark-text mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className={cn(
                        'w-full px-4 py-3 pr-12 rounded-xl border-2 transition-colors',
                        'bg-white dark:bg-dark-bgTertiary text-ink-950 dark:text-dark-text',
                        'border-cream-200 dark:border-dark-border focus:border-rose-500 focus:outline-none',
                        passwordErrors.currentPassword && 'border-red-500'
                      )}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:text-dark-textMuted"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-500">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-ink-950 dark:text-dark-text mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => {
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                        setPasswordErrors({ ...passwordErrors, newPassword: undefined });
                      }}
                      className={cn(
                        'w-full px-4 py-3 pr-12 rounded-xl border-2 transition-colors',
                        'bg-white dark:bg-dark-bgTertiary text-ink-950 dark:text-dark-text',
                        'border-cream-200 dark:border-dark-border focus:border-rose-500 focus:outline-none',
                        passwordErrors.newPassword ? 'border-red-500' : passwordForm.newPassword && passwordStrength.level >= 3 ? 'border-emerald-500' : ''
                      )}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:text-dark-textMuted"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordForm.newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-ink-600 dark:text-dark-textSecondary">Password strength</span>
                        <span className={cn(
                          'text-xs font-medium',
                          passwordStrength.level === 1 ? 'text-red-500' :
                          passwordStrength.level === 2 ? 'text-amber-500' :
                          passwordStrength.level === 3 ? 'text-emerald-500' :
                          'text-emerald-600'
                        )}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              'h-1 flex-1 rounded-full transition-colors',
                              i <= passwordStrength.level ? passwordStrength.color : 'bg-cream-200 dark:bg-dark-border'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-500">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-ink-950 dark:text-dark-text mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => {
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                        setPasswordErrors({ ...passwordErrors, confirmPassword: undefined });
                      }}
                      className={cn(
                        'w-full px-4 py-3 pr-12 rounded-xl border-2 transition-colors',
                        'bg-white dark:bg-dark-bgTertiary text-ink-950 dark:text-dark-text',
                        'border-cream-200 dark:border-dark-border focus:border-rose-500 focus:outline-none',
                        passwordErrors.confirmPassword ? 'border-red-500' :
                        passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword ? 'border-emerald-500' : ''
                      )}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:text-dark-textMuted"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                  )}
                  {passwordForm.confirmPassword && !passwordErrors.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword && (
                    <div className="mt-1 flex items-center gap-1 text-emerald-500">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Passwords match</span>
                    </div>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-cream-50 dark:bg-dark-bgTertiary/50 rounded-xl p-4">
                  <p className="text-sm font-medium text-ink-950 dark:text-dark-text mb-2">Password requirements:</p>
                  <ul className="space-y-1">
                    {[
                      { text: 'At least 8 characters', valid: passwordForm.newPassword.length >= 8 },
                      { text: 'One uppercase letter', valid: /[A-Z]/.test(passwordForm.newPassword) },
                      { text: 'One lowercase letter', valid: /[a-z]/.test(passwordForm.newPassword) },
                      { text: 'One number', valid: /[0-9]/.test(passwordForm.newPassword) },
                    ].map((req) => (
                      <li key={req.text} className={cn(
                        'flex items-center gap-2 text-sm transition-colors',
                        req.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-500 dark:text-dark-textSecondary'
                      )}>
                        <div className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center',
                          req.valid ? 'bg-emerald-500' : 'bg-cream-300 dark:bg-dark-border'
                        )}>
                          {req.valid && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        {req.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-cream-50 dark:bg-dark-bgTertiary/50 flex justify-end gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl font-medium text-ink-700 dark:text-dark-text hover:bg-cream-200 dark:hover:bg-dark-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className={cn(
                    'px-6 py-2 rounded-xl font-medium text-white transition-all flex items-center gap-2',
                    'bg-gradient-to-r from-rose-500 to-amethyst-600 hover:shadow-lg',
                    (isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 overflow-hidden"
            >
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
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Daily intentions and inspirations
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
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
