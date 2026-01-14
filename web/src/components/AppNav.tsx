'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Feather,
  BookOpen,
  Plus,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/stories', label: 'Stories', icon: BookOpen },
  { href: '/stories/new', label: 'New Story', icon: Plus },
  { href: '/inspirations', label: 'Inspirations', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Failed to sign out:', error);
      // Still navigate even if sign out had an error
      router.push('/');
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-cream-100/95 dark:bg-dark-bgSecondary/95 backdrop-blur-md shadow-sm border-b border-cream-200 dark:border-dark-border'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/stories" className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.2 }}
                className="w-8 h-8 bg-gradient-to-br from-rose-500 to-amethyst-600 rounded-lg flex items-center justify-center"
              >
                <Feather className="w-4 h-4 text-white" strokeWidth={2.5} />
              </motion.div>
              <span className="font-display text-xl text-ink-950">Parallel</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative px-4 py-2 rounded-lg font-body text-sm transition-all duration-200',
                      isActive
                        ? 'text-rose-500 dark:text-dark-rose bg-rose-50 dark:bg-rose-950/30'
                        : 'text-ink-700 dark:text-dark-textSecondary hover:text-ink-950 dark:hover:text-dark-text hover:bg-cream-200 dark:hover:bg-dark-bgTertiary'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-rose-50 dark:bg-rose-950/30 rounded-lg -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-200 dark:bg-dark-bgTertiary border border-cream-300 dark:border-dark-border">
                <Heart className="w-4 h-4 text-rose-500 dark:text-dark-rose" />
                <span className="text-sm font-accent text-ink-800 dark:text-dark-text">
                  {profile?.display_name || user?.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-ink-700 dark:text-dark-textSecondary hover:text-rose-500 dark:hover:text-dark-rose hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-ink-950 dark:text-dark-text hover:bg-cream-200 dark:hover:bg-dark-bgTertiary rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-ink-950/20 dark:bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 right-0 bottom-0 w-72 bg-white dark:bg-dark-bgSecondary shadow-elegant z-50 md:hidden flex flex-col"
            >
              {/* Mobile Header */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-cream-200 dark:border-dark-border">
                <span className="font-display text-lg text-ink-950 dark:text-dark-text">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-cream-100 dark:hover:bg-dark-bgTertiary rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-ink-700 dark:text-dark-textSecondary" />
                </button>
              </div>

              {/* Mobile Nav Items */}
              <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-dark-border">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-amethyst-600 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-accent font-semibold text-ink-950 dark:text-dark-text truncate">
                        {profile?.display_name || user?.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-ink-600 dark:text-dark-textMuted truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="px-4 mb-4">
                  <ThemeToggle />
                </div>

                <nav className="space-y-1 px-4">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-rose-500 dark:bg-dark-rose text-white'
                            : 'text-ink-700 dark:text-dark-textSecondary hover:bg-cream-100 dark:hover:bg-dark-bgTertiary'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-body font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Footer */}
              <div className="p-4 border-t border-cream-200 dark:border-dark-border">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-ink-700 dark:text-dark-textSecondary hover:bg-cream-100 dark:hover:bg-dark-bgTertiary transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-body font-medium">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  );
}
