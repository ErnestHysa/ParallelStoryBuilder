'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Feather, Sparkles } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { isValidEmail, isStrongPassword } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Please enter your name';
    }

    if (!formData.email) {
      newErrors.email = 'Please enter your email';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Please enter a password';
    } else {
      const passwordCheck = isStrongPassword(formData.password);
      if (!passwordCheck.valid) {
        newErrors.password = passwordCheck.errors[0];
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: formData.displayName,
          },
        },
      });

      if (error) throw error;

      // Create profile
      // Profile creation is handled by database trigger
      // No manual insert needed

      toast.success('Welcome to Parallel! Check your email to verify your account.');
      router.push('/stories');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 mb-4">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-accent text-rose-600">Begin your story</span>
            </div>
            <h1 className="font-display text-3xl text-ink-950 mb-2">
              Create your account
            </h1>
            <p className="font-body text-ink-700">
              Start writing your love story today
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-accent text-ink-800 mb-2">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-700" />
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="What should we call you?"
                  required
                  className={`input-field pl-12 ${errors.displayName ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.displayName && (
                <p className="text-red-500 text-sm mt-1 font-body">{errors.displayName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-accent text-ink-800 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-700" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className={`input-field pl-12 ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 font-body">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-accent text-ink-800 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-700" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className={`input-field pl-12 pr-12 ${errors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''}`}
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
              {errors.password ? (
                <p className="text-red-500 text-sm mt-1 font-body">{errors.password}</p>
              ) : (
                <p className="text-ink-500 text-sm mt-1 font-body">8+ characters, uppercase, lowercase, and a number</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-accent text-ink-800 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-700" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className={`input-field pl-12 ${errors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-300' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 font-body">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 text-rose-500 border-cream-400 rounded focus:ring-rose-300"
                disabled={isLoading}
              />
              <label htmlFor="terms" className="text-sm text-ink-700 font-body">
                I agree to the{' '}
                <Link href="/terms" className="text-rose-500 hover:text-rose-600">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-rose-500 hover:text-rose-600">Privacy Policy</Link>
              </label>
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
                  Creating your account...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account
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

          {/* Login Link */}
          <p className="text-center text-ink-700 font-body">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-rose-500 hover:text-rose-600 font-accent font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
