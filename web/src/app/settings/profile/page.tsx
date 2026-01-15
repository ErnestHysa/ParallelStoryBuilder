'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check, Camera } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/lib/supabase';
import { SettingsCard, SettingItem } from '@/components/settings/SettingsCard';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const AVATAR_OPTIONS = [
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

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  useEffect(() => {
    const changed = displayName !== (profile?.display_name || '') ||
                   avatarUrl !== profile?.avatar_url;
    setHasChanges(changed);
  }, [displayName, avatarUrl, profile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    if (displayName.trim().length < 2) {
      toast.error('Display name must be at least 2 characters');
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getSupabaseClient();
      const updates: { display_name: string; avatar_url?: string | null } = {
        display_name: displayName.trim(),
      };

      if (avatarUrl !== profile?.avatar_url) {
        updates.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile?.id);

      if (error) throw error;

      await refreshProfile();
      setHasChanges(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomAvatar = () => {
    if (!customAvatarUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    try {
      new URL(customAvatarUrl);
      setAvatarUrl(customAvatarUrl.trim());
      setCustomAvatarUrl('');
      toast.success('Custom avatar set!');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const getAvatarEmoji = (avatarUrl: string | null) => {
    if (!avatarUrl) return '👤';
    const emojiMap: Record<string, string> = {
      cat: '🐱', dog: '🐶', dragon: '🐉', heart: '❤️', star: '⭐',
      moon: '🌙', sun: '☀️', sparkle: '✨', rocket: '🚀', rainbow: '🌈', clover: '🍀',
    };
    return emojiMap[avatarUrl] || '👤';
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
            Edit Profile
          </h1>
          <p className="font-body text-ink-700 dark:text-dark-textSecondary">
            Manage your public profile
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border overflow-hidden shadow-sm">
            {/* Avatar Preview Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-amethyst-500 to-purple-600 p-8 text-center">
              {/* Decorative elements */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/50 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
              </div>

              <div className="relative">
                <motion.div
                  key={avatarUrl || 'default'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 h-32 mx-auto rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-xl mb-4"
                >
                  <span className="text-6xl">{getAvatarEmoji(avatarUrl)}</span>
                </motion.div>
                <div className="w-12 h-12 mx-auto -mt-6 rounded-full bg-white dark:bg-dark-bgSecondary border-4 border-rose-500 flex items-center justify-center shadow-lg">
                  <Camera className="w-5 h-5 text-rose-500" />
                </div>
              </div>
            </div>

            {/* Avatar Grid */}
            <div className="p-6">
              <h3 className="font-body font-semibold text-ink-950 dark:text-dark-text mb-4">
                Choose Avatar
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_OPTIONS.map((option) => {
                  const isSelected = option.url === avatarUrl;
                  return (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => !isSaving && setAvatarUrl(option.url)}
                      disabled={isSaving}
                      className={cn(
                        'aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all',
                        'border-2',
                        isSelected
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                          : 'border-cream-300 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700 bg-white dark:bg-dark-bgTertiary',
                        isSaving && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className="text-xl">{option.emoji}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-rose-500"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Custom Avatar URL */}
              <div className="mt-4 pt-4 border-t border-cream-200 dark:border-dark-border">
                <label className="text-sm font-medium text-ink-700 dark:text-dark-textSecondary mb-2 block">
                  Custom Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomAvatar()}
                    className="flex-1 px-3 py-2 rounded-xl border-2 bg-white dark:bg-dark-bgTertiary text-sm border-cream-300 dark:border-dark-border focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                    disabled={isSaving}
                  />
                  <button
                    onClick={handleCustomAvatar}
                    disabled={!customAvatarUrl.trim() || isSaving}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Display Name Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <SettingsCard title="Display Name" description="Your name visible to your partner">
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    maxLength={50}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-dark-bgTertiary',
                      'font-body text-ink-950 dark:text-dark-text placeholder:text-ink-400 dark:placeholder:text-dark-textMuted',
                      'transition-colors',
                      'border-cream-300 dark:border-dark-border',
                      'focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 outline-none',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    disabled={isSaving}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-ink-500 dark:text-dark-textMuted">
                      {displayName.length}/50 characters
                    </p>
                    {displayName.length >= 2 && (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Good length
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SettingsCard>
          </motion.div>

          {/* Account Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SettingsCard
              title="Account Information"
              description="Your account details"
              className="bg-cream-50 dark:bg-dark-bgTertiary/50"
            >
              <div className="space-y-4">
                <SettingItem
                  label="Email Address"
                  description={profile.email}
                  action={
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink-100 dark:bg-ink-900 text-xs font-medium text-ink-600 dark:text-ink-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Read-only
                    </span>
                  }
                />
                <SettingItem
                  label="Member Since"
                  description={memberSince || 'Recently'}
                  action={
                    <span className="text-ink-700 dark:text-dark-text font-medium">
                      {memberSince || 'N/A'}
                    </span>
                  }
                />
                <SettingItem
                  label="Account ID"
                  description={profile.id.slice(0, 8) + '...'}
                  action={
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.id);
                        toast.success('Account ID copied!');
                      }}
                      className="text-sm text-rose-600 dark:text-rose-400 hover:underline font-medium"
                    >
                      Copy ID
                    </button>
                  }
                />
              </div>
            </SettingsCard>
          </motion.div>

          {/* Save Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center justify-between p-5 bg-white dark:bg-dark-bgSecondary rounded-2xl border border-cream-200 dark:border-dark-border shadow-sm"
          >
            <div>
              {hasChanges ? (
                <p className="font-body text-sm text-ink-700 dark:text-dark-textSecondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  You have unsaved changes
                </p>
              ) : (
                <p className="font-body text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  All changes saved
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={cn(
                'px-6 py-3 rounded-xl font-accent font-medium transition-all',
                'flex items-center gap-2',
                hasChanges && !isSaving
                  ? 'bg-gradient-to-r from-rose-500 to-amethyst-600 text-white hover:shadow-lg hover:scale-105 hover:shadow-rose-500/30'
                  : 'bg-cream-200 dark:bg-dark-bgTertiary text-ink-500 dark:text-dark-textMuted cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
