'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function JoinStoryPage() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [pairingCode, setPairingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinedStory, setJoinedStory] = useState<{ id: string; title: string } | null>(null);

  const validateCode = (): boolean => {
    if (!pairingCode.trim()) {
      setError('Pairing code is required');
      return false;
    }
    if (pairingCode.length !== 6 || !/^\d{6}$/.test(pairingCode)) {
      setError('Pairing code must be exactly 6 digits');
      return false;
    }
    return true;
  };

  const handleJoin = async () => {
    if (!validateCode()) {
      return;
    }

    if (!user || !profile?.id) {
      toast.error('You must be logged in to join a story');
      router.push('/auth/login');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const supabase = getSupabaseClient();

      // Use the SECURITY DEFINER function that handles the entire join flow
      // This bypasses all RLS issues and prevents infinite recursion
      const { data: result, error: joinError } = await supabase
        .rpc('join_story_by_pairing_code', {
          p_pairing_code: pairingCode.trim(),
          p_user_id: user.id,
          p_role: 'partner',
          p_turn_order: 2
        });

      if (joinError) {
        setError(joinError.message || 'Failed to join story');
        setIsLoading(false);
        return;
      }

      // Parse the JSON result from the function
      const joinResult = result as unknown as { success: boolean; story_id?: string; story_title?: string; error?: string };

      if (!joinResult.success) {
        setError(joinResult.error || 'Failed to join story');
        setIsLoading(false);
        return;
      }

      const storyId = joinResult.story_id!;
      const storyTitle = joinResult.story_title!;

      // Create relationship link if user has a partner relationship
      const { data: relationshipData } = await supabase
        .from('relationships')
        .select('partner_id')
        .eq('user_id', user.id)
        .single();

      if (relationshipData && (relationshipData as any).partner_id) {
        await supabase
          .from('story_relationships')
          .insert([{
            story_id: storyId,
            user_id: user.id,
            partner_id: (relationshipData as any).partner_id,
            linked_at: new Date().toISOString(),
          }] as any);
      }

      // Success!
      setJoinedStory({ id: storyId, title: storyTitle });
      toast.success(`Successfully joined "${storyTitle}"!`);

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/stories/${storyId}`);
      }, 1500);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join story';
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPairingCode(value);
    setError('');
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#2D2A2E',
            color: '#FAF7F5',
            fontFamily: 'var(--font-body)',
          },
        }}
      />

      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-ink-700 dark:text-dark-textSecondary hover:text-rose-500 dark:hover:text-dark-rose font-body mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Stories
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 mb-4">
            <LinkIcon className="w-4 h-4 text-rose-500 dark:text-dark-rose" />
            <span className="text-sm font-accent text-rose-600 dark:text-rose-400">Partner Link</span>
          </div>
          <h1 className="font-display text-display-md text-ink-950 dark:text-dark-text mb-2">
            Join a Story
          </h1>
          <p className="font-body text-xl text-ink-700 dark:text-dark-textSecondary">
            Enter the pairing code from your partner to connect
          </p>
        </motion.div>

        {/* Join Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-bgSecondary rounded-3xl border-2 border-cream-300 dark:border-dark-border p-8 shadow-soft"
        >
          {!joinedStory ? (
            <>
              {/* Info text */}
              <p className="font-body text-ink-600 dark:text-dark-textMuted mb-8 text-center">
                Ask your partner for their story's 6-digit pairing code. You can find it on their story detail page.
              </p>

              {/* Code Input */}
              <div className="mb-8">
                <label className="block text-sm font-accent text-ink-800 dark:text-dark-text mb-3 text-center">
                  Pairing Code
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pairingCode}
                    onChange={handleInputChange}
                    placeholder="000000"
                    className="w-48 text-center text-3xl font-mono tracking-widest px-6 py-4 rounded-xl border-2 border-cream-300 dark:border-dark-border bg-cream-50 dark:bg-dark-bg focus:border-rose-500 dark:focus:border-dark-rose focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:focus:ring-dark-rose/20 transition-all font-display text-ink-950 dark:text-dark-text"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-sm text-ink-500 dark:text-dark-textMuted mt-3 text-center font-mono">
                  Enter 6 digits
                </p>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl"
                >
                  <p className="text-red-700 dark:text-red-400 text-sm text-center font-body">
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Join Button */}
              <button
                onClick={handleJoin}
                disabled={isLoading || pairingCode.length !== 6}
                className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-2xl font-accent font-semibold text-lg hover:shadow-elegant hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    Join Story
                  </>
                )}
              </button>

              {/* Cancel */}
              <button
                onClick={() => router.back()}
                disabled={isLoading}
                className="w-full mt-4 text-ink-600 dark:text-dark-textSecondary hover:text-rose-500 dark:hover:text-dark-rose font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="font-display text-2xl text-ink-950 dark:text-dark-text mb-2">
                You're in!
              </h2>
              <p className="font-body text-ink-600 dark:text-dark-textSecondary mb-6">
                Successfully joined &quot;{joinedStory.title}&quot;
              </p>
              <p className="font-body text-sm text-ink-500 dark:text-dark-textMuted">
                Redirecting to your story...
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Help text */}
        {!joinedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="font-body text-sm text-ink-500 dark:text-dark-textMuted mb-4">
              Don't have a code?{' '}
              <Link href="/stories/new" className="text-rose-600 dark:text-rose-400 hover:underline font-medium">
                Create your own story
              </Link>
              {' '}and share the code with your partner.
            </p>
          </motion.div>
        )}
      </div>
    </>
  );
}
