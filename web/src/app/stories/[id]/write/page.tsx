'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Wand2,
  Eye,
  EyeOff,
  X,
  Lightbulb,
  Image,
  Mic,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import type { Story, Chapter } from '@/types';
import { cn } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';

const aiEnhancements = [
  { id: 'sensory', name: 'Add sensory details', description: 'Enhance with vivid descriptions', tokens: 3, icon: '🎨' },
  { id: 'dialogue', name: 'Improve dialogue', description: 'Make conversations more natural', tokens: 3, icon: '💬' },
  { id: 'emotional', name: 'Deepen emotions', description: 'Add emotional depth and feeling', tokens: 3, icon: '💝' },
  { id: 'creative', name: 'Creative expansion', description: 'Add imaginative elements', tokens: 5, icon: '✨' },
];

const writingPrompts = [
  'Describe their first meeting from your partner\'s perspective',
  'Add a moment of vulnerability between the characters',
  'Introduce an unexpected obstacle',
  'Write about a shared memory that brings them closer',
  'Describe the setting using all five senses',
];

export default function WriteChapterPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [content, setContent] = useState('');
  const [contextSnippet, setContextSnippet] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadStory();
    loadChapterCount();
  }, [storyId]);

  const loadStory = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (error) throw error;
      setStory(data as unknown as Story);
    } catch (error) {
      console.error('Error loading story:', error);
      toast.error('Failed to load story');
    }
  };

  const loadChapterCount = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('story_id', storyId)
        .order('chapter_number', { ascending: false })
        .limit(1);

      if (error) throw error;
      setChapterNumber(((data?.[0] as any)?.chapter_number ?? 0) + 1);
    } catch (error) {
      console.error('Error loading chapter count:', error);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Please write something first');
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('chapters')
        .insert([{
          story_id: storyId,
          author_id: user?.id,
          chapter_number: chapterNumber,
          content: content.trim(),
          context_snippet: contextSnippet.trim() || null,
        }] as any)
        .select()
        .single();

      if (error) throw error;

      toast.success('Chapter saved!');
      router.push(`/stories/${storyId}/chapter/${(data as any).id}`);
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast.error('Failed to save chapter');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnhance = async (type: string) => {
    setIsEnhancing(true);

    try {
      // Simulate AI enhancement (in production, this would call your AI endpoint)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock enhancement - in production, this would return actual AI-enhanced content
      const enhancements: Record<string, string> = {
        sensory: 'The golden sunlight filtered through the leaves, casting dancing shadows on her face. The scent of jasmine filled the air, sweet and intoxicating.',
        dialogue: '"I never thought I\'d feel this way," she whispered, her voice barely audible over the rustling leaves.',
        emotional: 'Her heart raced as she realized the truth - this wasn\'t just a fleeting moment, but the beginning of something real.',
        creative: 'And in that instant, the world seemed to pause, as if time itself held its breath to witness this moment.',
      };

      const enhancement = enhancements[type] || '';
      setContent(content + '\n\n' + enhancement);
      toast.success('Content enhanced!');
    } catch (error) {
      toast.error('Failed to enhance content');
    } finally {
      setIsEnhancing(false);
    }
  };

  const insertPrompt = (prompt: string) => {
    setContextSnippet(prompt);
    setShowPrompt(false);
    toast.success('Writing prompt added!');
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

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

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-ink-700" />
            </button>
            <div>
              <p className="text-sm text-ink-600 font-body">
                {story?.title} • Chapter {chapterNumber}
              </p>
              <h1 className="font-display text-2xl text-ink-950">
                {previewMode ? 'Preview' : 'Write Your Chapter'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Word count */}
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-cream-200 text-ink-700 text-sm font-body">
              {wordCount} words
            </span>

            {/* Preview toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
              title={previewMode ? 'Edit' : 'Preview'}
            >
              {previewMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>

            {/* AI button */}
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                showAIPanel
                  ? 'bg-amethyst-500 text-white'
                  : 'bg-cream-200 text-ink-700 hover:bg-amethyst-100'
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline font-accent">AI Tools</span>
            </button>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg font-accent hover:bg-rose-600 disabled:opacity-50 transition-all"
            >
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </motion.div>

        <div className="flex gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn('flex-1', showAIPanel && 'max-w-2xl')}
          >
            {previewMode ? (
              <div className="bg-white rounded-2xl shadow-soft p-8 md:p-12 min-h-[60vh]">
                <div className="prose prose-lg max-w-none">
                  <h2 className="font-display text-3xl text-ink-950 mb-6">
                    Chapter {chapterNumber}
                  </h2>
                  <div className="font-body text-ink-800 leading-relaxed whitespace-pre-wrap">
                    {content || 'Your story will appear here...'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Context snippet */}
                <div className="bg-white rounded-xl shadow-soft p-4">
                  <label className="flex items-center gap-2 text-sm font-accent text-ink-800 mb-2">
                    <Lightbulb className="w-4 h-4 text-gold-500" />
                    Context (optional)
                  </label>
                  <input
                    type="text"
                    value={contextSnippet}
                    onChange={(e) => setContextSnippet(e.target.value)}
                    placeholder="What should your partner know before writing? (e.g., 'Continuing the beach scene...')"
                    className="w-full px-4 py-2 bg-cream-100 rounded-lg text-ink-950 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>

                {/* Editor */}
                <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Begin writing your chapter here... Let your imagination flow freely."
                    className="w-full h-[50vh] p-8 text-lg font-body text-ink-950 placeholder:text-ink-400 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Writing prompt */}
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-cream-300 rounded-xl text-ink-600 hover:border-rose-300 hover:text-rose-500 transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  Need inspiration? Get a writing prompt
                </button>

                {showPrompt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-50 rounded-xl p-4 border border-rose-100"
                  >
                    <p className="text-sm text-ink-700 mb-3 font-body">Choose a prompt to inspire your writing:</p>
                    <div className="space-y-2">
                      {writingPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => insertPrompt(prompt)}
                          className="w-full text-left p-3 bg-white rounded-lg hover:bg-rose-100 transition-colors text-sm text-ink-800"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          {/* AI Panel */}
          <AnimatePresence>
            {showAIPanel && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="w-72 flex-shrink-0"
              >
                <div className="sticky top-24 bg-gradient-to-b from-amethyst-50 to-white rounded-2xl shadow-medium p-6 border border-amethyst-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg text-ink-950">AI Magic</h3>
                    <button
                      onClick={() => setShowAIPanel(false)}
                      className="p-1 hover:bg-amethyst-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-ink-600" />
                    </button>
                  </div>

                  <p className="text-sm text-ink-700 mb-6 font-body">
                    Enhance your writing with AI assistance
                  </p>

                  <div className="space-y-3">
                    {aiEnhancements.map((enhancement) => (
                      <button
                        key={enhancement.id}
                        onClick={() => handleEnhance(enhancement.id)}
                        disabled={isEnhancing || !content.trim()}
                        className="w-full p-4 bg-white rounded-xl border border-amethyst-100 hover:border-amethyst-300 hover:shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{enhancement.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-accent font-medium text-ink-950 text-sm">
                              {enhancement.name}
                            </p>
                            <p className="text-xs text-ink-600 mt-0.5">
                              {enhancement.description}
                            </p>
                          </div>
                          <span className="text-xs text-gold-600 font-medium whitespace-nowrap">
                            {enhancement.tokens} 🔥
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Coming soon features */}
                  <div className="mt-6 pt-6 border-t border-amethyst-200">
                    <p className="text-xs text-ink-500 font-accent mb-3">Coming Soon</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm text-ink-600 opacity-60">
                        <Image className="w-4 h-4" />
                        <span>Illustrate scene</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-ink-600 opacity-60">
                        <Mic className="w-4 h-4" />
                        <span>Voice-to-text</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
