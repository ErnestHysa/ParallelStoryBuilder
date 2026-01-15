'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, RefreshCw, Feather, ArrowRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const { user, checkEmailConfirmation } = useAuthStore();
  const [isChecking, setIsChecking] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    // Auto-check every 5 seconds, max 12 times (1 minute)
    if (checkCount < 12) {
      const interval = setInterval(async () => {
        const isConfirmed = await checkEmailConfirmation();
        if (isConfirmed) {
          toast.success('Email confirmed! Redirecting...');
          setTimeout(() => router.push('/blueprint'), 1000);
        }
        setCheckCount(prev => prev + 1);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [checkCount, checkEmailConfirmation, router]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const isConfirmed = await checkEmailConfirmation();
      if (isConfirmed) {
        toast.success('Email confirmed! Redirecting...');
        setTimeout(() => router.push('/blueprint'), 1000);
      } else {
        toast.error('Email not confirmed yet. Please check your inbox.');
        setCheckCount(prev => prev + 1);
      }
    } catch (error) {
      toast.error('Failed to check confirmation status');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 dark:from-dark-bg via-rose-50 dark:via-rose-950/20 to-cream-100 dark:to-dark-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -40, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-[10%] w-4 h-4 bg-rose-300/40 dark:bg-rose-700/30 rounded-full blur-md"
        />
        <motion.div
          animate={{ y: [0, 50, 0], rotate: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 right-[15%] w-6 h-6 bg-gold-300/40 dark:bg-gold-700/30 rounded-full blur-md"
        />
        <motion.div
          animate={{ y: [0, -30, 0], rotate: [0, 25, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-[20%] w-3 h-3 bg-amethyst-300/40 dark:bg-amethyst-700/30 rounded-full blur-md"
        />
      </div>

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-amethyst-600 rounded-xl flex items-center justify-center shadow-elegant">
            <Feather className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl text-ink-950 dark:text-dark-text">Parallel</span>
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-dark-bgSecondary rounded-3xl shadow-elegant p-8 md:p-10 ornate-border text-center">
          {/* Mail Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
            className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Mail className="w-10 h-10 text-rose-500 dark:text-dark-rose" />
          </motion.div>

          <h1 className="font-display text-2xl text-ink-950 dark:text-dark-text mb-3">
            Check your email
          </h1>
          <p className="font-body text-ink-700 dark:text-dark-textSecondary mb-6">
            We sent a confirmation link to{' '}
            <span className="font-accent text-rose-500 dark:text-dark-rose">{email || 'your email'}</span>
          </p>

          <div className="bg-cream-50 dark:bg-dark-bg rounded-2xl p-4 mb-6">
            <p className="text-sm text-ink-600 dark:text-dark-textMuted font-body">
              Click the link in the email to verify your account. Once confirmed, you can start writing your love story.
            </p>
          </div>

          {/* Auto-check indicator */}
          {checkCount < 12 && (
            <div className="flex items-center justify-center gap-2 mb-6 text-sm text-ink-600 dark:text-dark-textMuted">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-rose-300 dark:border-rose-700 border-t-rose-500 dark:border-t-rose-400 rounded-full"
              />
              <span>Checking for confirmation...</span>
            </div>
          )}

          {/* Manual Check Button */}
          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
          >
            {isChecking ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                I've confirmed my email
              </>
            )}
          </button>

          {/* Resend Link */}
          <button
            onClick={() => {
              toast.success('Confirmation email resent!');
              setCheckCount(0);
            }}
            className="text-rose-500 dark:text-dark-rose hover:text-rose-600 dark:hover:text-rose-400 font-accent text-sm mb-6"
          >
            Didn't receive the email? Click to resend
          </button>

          {/* Sign In Link */}
          <p className="text-ink-700 dark:text-dark-textSecondary font-body text-sm">
            Already confirmed?{' '}
            <Link href="/auth/login" className="text-rose-500 dark:text-dark-rose hover:text-rose-600 dark:hover:text-rose-400 font-accent font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
