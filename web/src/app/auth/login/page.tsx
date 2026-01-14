'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Feather } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Import dynamically to avoid SSR issues
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Welcome back!');
      router.push('/stories');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-100 via-rose-50 to-cream-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -40, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-[10%] w-4 h-4 bg-rose-300/40 rounded-full blur-md"
        />
        <motion.div
          animate={{ y: [0, 50, 0], rotate: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 right-[15%] w-6 h-6 bg-gold-300/40 rounded-full blur-md"
        />
        <motion.div
          animate={{ y: [0, -30, 0], rotate: [0, 25, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-[20%] w-3 h-3 bg-amethyst-300/40 rounded-full blur-md"
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
          <span className="font-display text-2xl text-ink-950">Parallel</span>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-elegant p-8 md:p-10 ornate-border">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl text-ink-950 mb-2">
              Welcome back
            </h1>
            <p className="font-body text-ink-700">
              Continue your love story
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-accent text-ink-800 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-700" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-field pl-12"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-accent text-ink-800">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-rose-500 hover:text-rose-600 font-body"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-700" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field pl-12 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-700 hover:text-ink-950 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full text-lg py-4 group"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-cream-300" />
            <span className="text-sm text-ink-500 font-body">or</span>
            <div className="flex-1 h-px bg-cream-300" />
          </div>

          {/* Register Link */}
          <p className="text-center text-ink-700 font-body">
            New to Parallel?{' '}
            <Link href="/auth/register" className="text-rose-500 hover:text-rose-600 font-accent font-semibold">
              Start your story
            </Link>
          </p>
        </div>

        {/* Demo notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-ink-600 font-body">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-rose-500 hover:text-rose-600 font-accent">
              Sign up free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
