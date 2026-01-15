'use client';

import { useEffect } from 'react';
import { AppNav } from '@/components/AppNav';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100 dark:bg-dark-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-rose-200 dark:border-rose-900 border-t-rose-500 dark:border-t-rose-400 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-rose-50/50 to-amethyst-50/30 dark:from-dark-bg dark:to-amethyst-950/20">
      <AppNav />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
