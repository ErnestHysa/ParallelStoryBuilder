'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BlueprintQuiz } from '@/components/BlueprintQuiz';

export default function BlueprintPage() {
  const router = useRouter();
  const { user, isEmailConfirmed, isLoading } = useAuthStore();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      router.push('/auth/login');
      return;
    }

    // Redirect to confirm email if email is not confirmed
    if (!isLoading && user && !isEmailConfirmed) {
      router.push('/auth/confirm-email');
      return;
    }
  }, [user, isEmailConfirmed, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-rose-200 dark:border-rose-900 border-t-rose-500 dark:border-t-rose-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render if not authenticated or email not confirmed
  if (!user || !isEmailConfirmed) {
    return null;
  }

  return <BlueprintQuiz />;
}
