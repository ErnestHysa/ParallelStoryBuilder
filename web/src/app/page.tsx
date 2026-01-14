'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  Heart,
  Users,
  PenTool,
  Feather,
  ArrowRight,
  Check,
  Quote,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-[10%] w-3 h-3 bg-rose-300 rounded-full opacity-60 blur-sm"
        />
        <motion.div
          animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-40 right-[15%] w-2 h-2 bg-gold-400 rounded-full opacity-50 blur-sm"
        />
        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-40 left-[20%] w-4 h-4 bg-amethyst-400 rounded-full opacity-40 blur-sm"
        />
        <motion.div
          animate={{ y: [0, 35, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 right-[25%] w-3 h-3 bg-rose-200 rounded-full opacity-50 blur-sm"
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream-100/80 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-amethyst-600 rounded-lg flex items-center justify-center">
              <Feather className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl text-ink-950">Parallel</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-ink-800 hover:text-rose-500 transition-colors font-body text-sm">
              Features
            </a>
            <a href="#how-it-works" className="text-ink-800 hover:text-rose-500 transition-colors font-body text-sm">
              How it Works
            </a>
            <a href="#stories" className="text-ink-800 hover:text-rose-500 transition-colors font-body text-sm">
              Stories
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="btn-ghost text-sm">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm">
              Start Writing
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50 via-transparent to-transparent" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            {/* Decorative badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-rose-200 mb-8"
            >
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-accent text-ink-800">For long-distance couples who write</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-display text-display-lg md:text-display-xl text-ink-950 mb-6"
            >
              Turn your distance into{' '}
              <span className="gradient-text italic">beautiful stories</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="font-body text-xl md:text-2xl text-ink-700 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Write collaborative stories with your partner, enhanced by AI. Every chapter is a love letter written together.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/auth/register" className="btn-primary group text-lg px-8 py-4">
                Start Your Story
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/auth/login" className="btn-secondary text-lg px-8 py-4">
                I Already Have an Account
              </Link>
            </motion.div>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-16 flex flex-col items-center gap-4"
          >
            <div className="flex items-center -space-x-3">
              {['bg-rose-400', 'bg-gold-400', 'bg-amethyst-400', 'bg-rose-300', 'bg-gold-300'].map((color, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-full ${color} border-4 border-cream-100 flex items-center justify-center text-white text-sm font-accent font-medium`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-ink-700 font-body">
              Join <span className="font-semibold text-rose-500">10,000+ couples</span> writing their love stories
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-display-md text-ink-950 mb-4">
              Stories are the new love letters
            </h2>
            <p className="font-body text-xl text-ink-700 max-w-2xl mx-auto">
              Every chapter you write together is an act of vulnerability. Every turn you take is a step closer.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: PenTool,
                title: 'Collaborative Writing',
                description: 'Take turns writing chapters. See your partner\'s words appear in real-time as they craft their part of your shared narrative.',
                color: 'rose',
              },
              {
                icon: Sparkles,
                title: 'AI Enhancement',
                description: 'Let AI add sensory details, improve dialogue, or explore alternative endings. Your story, elevated.',
                color: 'amethyst',
              },
              {
                icon: Heart,
                title: 'Relationship Deepening',
                description: 'Daily intention check-ins, relationship questions, and milestone tracking. Grow together through stories.',
                color: 'gold',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="ornate-border card-interactive p-8 rounded-2xl bg-cream-50/50"
              >
                <div className={`w-14 h-14 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-500`} strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl text-ink-950 mb-3">
                  {feature.title}
                </h3>
                <p className="font-body text-ink-700 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-cream-100 to-rose-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-display-md text-ink-950 mb-4">
              Write your story, together
            </h2>
            <p className="font-body text-xl text-ink-700">
              Three simple steps to begin your shared narrative
            </p>
          </motion.div>

          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Create Your Story',
                description: 'Choose a theme, give it a title, and invite your partner with a simple pairing code.',
              },
              {
                step: '02',
                title: 'Write Your Chapter',
                description: 'Take turns writing chapters. Add context snippets, use AI to enhance your words, and see your story grow.',
              },
              {
                step: '03',
                title: 'Watch Your Love Unfold',
                description: 'Read your completed story together, export it as a beautiful book, and cherish your shared creation forever.',
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="flex items-start gap-6 p-8 rounded-2xl bg-white shadow-soft"
              >
                <span className="font-display text-5xl text-rose-200 font-light">
                  {step.step}
                </span>
                <div>
                  <h3 className="font-display text-2xl text-ink-950 mb-2">
                    {step.title}
                  </h3>
                  <p className="font-body text-ink-700">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24 px-6 bg-ink-950 text-white relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/20 via-transparent to-amethyst-900/20" />

        <div className="max-w-4xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Quote className="w-12 h-12 text-rose-400 mx-auto mb-8 opacity-50" />
            <blockquote className="font-display text-2xl md:text-3xl italic leading-relaxed mb-8">
              "Writing our story together gave us something to look forward to every day. It made the distance feel smaller, and our connection grow stronger."
            </blockquote>
            <div>
              <p className="font-accent font-semibold">Sarah & James</p>
              <p className="text-ink-400 text-sm mt-1">Together 3 years, apart 8 months</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Story Gallery Preview */}
      <section id="stories" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-display-md text-ink-950 mb-4">
              Stories waiting to be written
            </h2>
            <p className="font-body text-xl text-ink-700">
              Start with a theme, or let your imagination guide you
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { theme: 'Romance', emoji: '💕', color: 'from-rose-400 to-rose-600', description: 'Classic love stories' },
              { theme: 'Fantasy', emoji: '🐉', color: 'from-amethyst-400 to-amethyst-600', description: 'Magical adventures' },
              { theme: 'Our Future', emoji: '🌟', color: 'from-gold-400 to-gold-600', description: 'Dreams together' },
              { theme: 'Mystery', emoji: '🔍', color: 'from-ink-600 to-ink-800', description: 'Unravel secrets' },
            ].map((story, i) => (
              <motion.div
                key={story.theme}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group cursor-pointer"
              >
                <div className={`aspect-[3/4] rounded-2xl bg-gradient-to-br ${story.color} p-6 flex flex-col justify-end relative overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-elegant`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <span className="text-6xl mb-4 relative z-10">{story.emoji}</span>
                  <h3 className="font-display text-2xl text-white relative z-10">{story.theme}</h3>
                  <p className="text-white/80 text-sm relative z-10">{story.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-rose-500 via-rose-600 to-amethyst-600 relative overflow-hidden">
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="max-w-3xl mx-auto text-center relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-display-md text-white mb-6"
          >
            Your story is waiting to be written
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-body text-xl text-white/90 mb-10"
          >
            Start writing your love story today. Free forever for couples who just want to connect.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/auth/register" className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-rose-600 rounded-full font-accent font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
              Begin Your Story
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-24 px-6 bg-cream-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display text-2xl text-ink-950 mb-6">Always Free</h3>
              <ul className="space-y-4">
                {['Unlimited stories', 'Unlimited chapters', 'Real-time collaboration', 'Basic AI enhancement (10/day)'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-ink-700">
                    <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-rose-500" strokeWidth={3} />
                    </div>
                    <span className="font-body">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-2xl text-ink-950 mb-6">Premium Sparks</h3>
              <ul className="space-y-4">
                {['Advanced AI enhancement', 'Story illustrations', 'Voice chapters', 'Export as beautiful book'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-ink-700">
                    <Sparkles className="w-5 h-5 text-gold-500" />
                    <span className="font-body">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-ink-950 text-cream-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-amethyst-600 rounded-lg flex items-center justify-center">
                  <Feather className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-display text-xl text-white">Parallel Story Builder</span>
              </div>
              <p className="text-ink-400 font-body max-w-sm">
                Transform distance into creative fuel. Write beautiful, collaborative stories with your partner.
              </p>
            </div>
            <div>
              <h4 className="font-display text-lg text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-ink-400 hover:text-rose-400 transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-ink-400 hover:text-rose-400 transition-colors">How It Works</a></li>
                <li><Link href="/auth/register" className="text-ink-400 hover:text-rose-400 transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-lg text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-ink-400 hover:text-rose-400 transition-colors">About</a></li>
                <li><a href="#" className="text-ink-400 hover:text-rose-400 transition-colors">Blog</a></li>
                <li><a href="#" className="text-ink-400 hover:text-rose-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="text-ink-400 hover:text-rose-400 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-ink-800 text-center text-ink-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Parallel Story Builder. Made with love for long-distance couples everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
