'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    console.log('Page not found - current path:', window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 dark:bg-dark-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* 404 Number */}
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-display text-[120px] md:text-[150px] leading-none text-rose-200 dark:text-rose-900 select-none"
        >
          404
        </motion.h1>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="font-display text-2xl md:text-3xl text-ink-950 dark:text-dark-text">
            Page Not Found
          </h2>
          <p className="font-body text-ink-700 dark:text-dark-textSecondary">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-4 mt-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-dark-bgSecondary text-ink-950 dark:text-dark-text rounded-full font-accent hover:shadow-elegant transition-all border border-cream-300 dark:border-dark-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            href="/stories"
            className="flex items-center gap-2 px-6 py-3 bg-rose-500 dark:bg-dark-rose text-white rounded-full font-accent hover:bg-rose-600 dark:hover:bg-rose-400 hover:shadow-elegant transition-all"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </motion.div>

        {/* Decorative element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-6xl"
        >
          📖
        </motion.div>
      </motion.div>
    </div>
  );
}
