'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Heart, Compass, Stars, Copy, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/lib/supabase';
import { generatePairingCode } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';

const themes = [
  { id: 'romance', name: 'Romance', emoji: '💕', description: 'Classic love stories', color: 'from-rose-400 to-rose-600' },
  { id: 'fantasy', name: 'Fantasy', emoji: '🐉', description: 'Magical adventures', color: 'from-amethyst-400 to-amethyst-600' },
  { id: 'our_future', name: 'Our Future', emoji: '🌟', description: 'Dreams together', color: 'from-gold-400 to-gold-600' },
];

const storyStarters = [
  'Two strangers meet on a rainy day in Paris...',
  'In a world where dreams can be shared, they found each other...',
  'She was a writer, he was her muse...',
  'Across the ocean, two hearts beat as one...',
  'The last letter they ever expected to receive...',
  'Under the stars of a foreign sky...',
];

export default function NewStoryPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [title, setTitle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('romance');
  const [starterIndex, setStarterIndex] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please give your story a title');
      return;
    }

    setIsCreating(true);

    try {
      const supabase = getSupabaseClient();
      const pairingCode = generatePairingCode();

      const { data, error } = await supabase
        .from('stories')
        .insert([{
          title: title.trim(),
          theme: selectedTheme,
          created_by: profile?.id,
          pairing_code: pairingCode,
          status: 'active',
        }] as any)
        .select()
        .single();

      if (error) throw error;

      // Add creator as first member
      await supabase
        .from('story_members')
        .insert([{
          story_id: (data as any).id,
          user_id: profile?.id,
          role: 'creator',
          turn_order: 1,
        }] as any);

      // Create first chapter with story starter
      if (starterIndex !== null) {
        await supabase
          .from('chapters')
          .insert([{
            story_id: (data as any).id,
            author_id: profile?.id,
            chapter_number: 1,
            content: storyStarters[starterIndex],
          }] as any);
      }

      toast.success('Story created! Invite your partner to start writing together.');
      router.push(`/stories/${(data as any).id}`);
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Failed to create story');
    } finally {
      setIsCreating(false);
    }
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

      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-ink-700 hover:text-rose-500 font-body mb-8 transition-colors"
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 mb-4">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-accent text-rose-600">Begin your journey</span>
          </div>
          <h1 className="font-display text-display-md text-ink-950 mb-2">
            Create a new story
          </h1>
          <p className="font-body text-xl text-ink-700">
            Choose a theme, give it a title, and invite your partner to write with you
          </p>
        </motion.div>

        {/* Form */}
        <div className="space-y-8">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-accent text-ink-800 mb-3">
              Story Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The title of your love story..."
              className="input-field text-lg px-6 py-4"
              maxLength={100}
            />
            <p className="text-sm text-ink-600 mt-2 font-body">
              {title.length}/100 characters
            </p>
          </motion.div>

          {/* Theme Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-accent text-ink-800 mb-3">
              Choose a Theme
            </label>
            <div className="grid sm:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                    selectedTheme === theme.id
                      ? 'border-rose-500 bg-rose-50 shadow-elegant scale-105'
                      : 'border-cream-300 bg-white hover:border-rose-300 hover:shadow-soft'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.color} opacity-0 rounded-2xl transition-opacity ${
                    selectedTheme === theme.id ? 'opacity-10' : ''
                  }`} />
                  <div className="relative">
                    <span className="text-4xl mb-3 block">{theme.emoji}</span>
                    <h3 className="font-display text-xl text-ink-950 mb-1">{theme.name}</h3>
                    <p className="text-sm text-ink-600 font-body">{theme.description}</p>
                  </div>
                  {selectedTheme === theme.id && (
                    <motion.div
                      layoutId="selectedTheme"
                      className="absolute top-4 right-4 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Story Starters (Optional) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-accent text-ink-800 mb-3">
              Story Starter <span className="text-ink-500 font-normal">(Optional)</span>
            </label>
            <p className="text-sm text-ink-600 mb-4 font-body">
              Choose an opening line to get started, or begin with a blank page
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {storyStarters.map((starter, index) => (
                <button
                  key={index}
                  onClick={() => setStarterIndex(starterIndex === index ? null : index)}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                    starterIndex === index
                      ? 'border-amethyst-500 bg-amethyst-50'
                      : 'border-cream-300 bg-white hover:border-amethyst-300'
                  }`}
                >
                  <p className="font-body text-ink-800 italic">{starter}</p>
                </button>
              ))}
              <button
                onClick={() => setStarterIndex(null)}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                  starterIndex === null
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-cream-300 bg-white hover:border-rose-300'
                }`}
              >
                <Compass className="w-5 h-5 text-rose-500" />
                <span className="font-accent font-medium text-ink-950">Start from scratch</span>
              </button>
            </div>
          </motion.div>

          {/* Create Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-4"
          >
            <button
              onClick={handleCreate}
              disabled={isCreating || !title.trim()}
              className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-rose-500 to-amethyst-600 text-white rounded-2xl font-accent font-semibold text-lg hover:shadow-elegant hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isCreating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Creating your story...
                </>
              ) : (
                <>
                  <Heart className="w-6 h-6" />
                  Create Story
                </>
              )}
            </button>
            <p className="text-center text-sm text-ink-600 mt-4 font-body">
              After creating, you'll get a pairing code to share with your partner
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
