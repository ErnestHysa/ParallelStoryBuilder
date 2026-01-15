'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Share2, Download, Copy, Smartphone, Square, Tablet, Image as ImageIcon, Quote, Flag, Heart, BookOpen, Shuffle, Search, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';
import toast from 'react-hot-toast';

import { QuoteCard } from './QuoteCard';
import { MilestoneCard } from './MilestoneCard';
import { IllustratedCard } from './IllustratedCard';
import { OriginCard } from './OriginCard';
import { ChapterCard } from './ChapterCard';
import { BrowseQuotesModal } from './BrowseQuotesModal';
import {
  CardData,
  CardStyle,
  CardAspectRatio,
  generateCardData,
  generateCardSuggestions,
  CARD_STYLE_PRESETS,
  CARD_DIMENSIONS,
  shuffleQuote,
  getGradientByIndex,
  shuffleGradient,
  ALL_GRADIENTS,
} from '@/lib/cardGenerator';
import { shareCard, downloadCard, copyToClipboard, isWebShareSupported } from '@/lib/cardRenderer';
import { formatPairingCode } from '@/lib/utils';

const CARD_DIMS = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
} as const;

// Theme gradients for dialog background
const THEME_GRADIENTS: Record<string, string> = {
  romance: 'from-rose-500 via-pink-500 to-purple-500',
  fantasy: 'from-purple-500 via-violet-500 to-indigo-500',
  our_future: 'from-blue-500 via-cyan-500 to-teal-500',
};

interface StoryMember {
  user_id: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

interface ShareableCardDialogProps {
  open: boolean;
  onClose: () => void;
  story: {
    id: string;
    title: string;
    theme: string;
    created_at: string;
    pairing_code: string;
    created_by?: string;
  };
  chapters: Array<{
    id: string;
    content: string;
    ai_enhanced_content?: string | null;
    chapter_number: number;
    author_id: string;
    created_at: string;
  }>;
  members?: StoryMember[];
  currentUserId?: string;
}

export function ShareableCardDialog({
  open,
  onClose,
  story,
  chapters,
  members = [],
  currentUserId,
}: ShareableCardDialogProps) {
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('quote');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<CardAspectRatio>('story');
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [selectedGradientIndex, setSelectedGradientIndex] = useState(0);
  const [generationStage, setGenerationStage] = useState<'idle' | 'generating' | 'sharing'>('idle');
  const [customQuote, setCustomQuote] = useState<string | null>(null);
  const [customQuoteChapter, setCustomQuoteChapter] = useState<number | null>(null);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate card suggestions when modal opens or story changes
  const [cardSuggestions, setCardSuggestions] = useState<CardData[]>([]);

  // Reset custom quote when style changes away from quote
  useEffect(() => {
    if (selectedStyle !== 'quote' && selectedStyle !== 'origin') {
      setCustomQuote(null);
      setCustomQuoteChapter(null);
    }
  }, [selectedStyle]);

  useEffect(() => {
    if (open && story && chapters.length > 0) {
      const suggestions = generateCardSuggestions(story, chapters, 5);
      setCardSuggestions(suggestions);
      setSelectedSuggestion(0);
      setCustomQuote(null);
      setCustomQuoteChapter(null);
      // Reset gradient on open
      setSelectedGradientIndex(0);
    }
  }, [open, story.id, chapters.length]);

  // Get current card data with custom quote and gradient support
  const getCurrentCardData = useCallback((): CardData => {
    // Don't generate cards if there are no chapters - return fallback
    if (chapters.length === 0) {
      return {
        story,
        chapters: [],
        config: {
          style: 'milestone',
          title: story.title,
          chapterCount: 0,
          daysTogether: Math.floor((Date.now() - new Date(story.created_at).getTime()) / (1000 * 60 * 60 * 24)),
          startDate: new Date(story.created_at).toLocaleDateString(),
          theme: story.theme,
          gradientIndex: selectedGradientIndex,
          showBranding: true,
        },
        aspectRatio: selectedAspectRatio,
      };
    }

    const baseCard = cardSuggestions[selectedSuggestion] ||
      generateCardData(story, chapters, selectedStyle, selectedAspectRatio);

    // Override quote for quote/origin cards if custom quote is set
    const quoteOverride = (selectedStyle === 'quote' || selectedStyle === 'origin') && customQuote
      ? {
          quote: customQuote,
          chapter: customQuoteChapter ?? baseCard.config.chapter,
        }
      : {};

    // Always override gradient with user selection
    const gradientOverride = { gradientIndex: selectedGradientIndex };

    return {
      ...baseCard,
      config: {
        ...baseCard.config,
        ...quoteOverride,
        ...gradientOverride,
      },
    };
  }, [cardSuggestions, selectedSuggestion, story, chapters, selectedStyle, selectedAspectRatio, customQuote, customQuoteChapter, selectedGradientIndex]);

  const currentCard = getCurrentCardData();

  // Get partner name for display on cards
  const partnerName = React.useMemo(() => {
    if (!members || members.length === 0) return null;
    const creatorId = story.created_by || currentUserId;
    const partner = members.find(m => m.user_id !== creatorId);
    if (!partner) return null;
    return partner.profile?.display_name || partner.profile?.email || null;
  }, [members, story.created_by, currentUserId]);

  // Handle gradient selection
  const handleGradientSelect = useCallback((index: number) => {
    setSelectedGradientIndex(index);
  }, []);

  // Handle gradient shuffle
  const handleGradientShuffle = useCallback(() => {
    setSelectedGradientIndex(prev => shuffleGradient(prev));
  }, []);

  // Get current quote for shuffle functionality
  const getCurrentQuote = useCallback((): string | null => {
    if (currentCard.config.style === 'quote' || currentCard.config.style === 'origin') {
      return currentCard.config.quote || null;
    }
    return null;
  }, [currentCard]);

  // Handle shuffle quote
  const handleShuffle = useCallback(() => {
    const currentQuote = getCurrentQuote();
    const latestChapter = chapters[chapters.length - 1];
    if (latestChapter) {
      const newQuote = shuffleQuote(latestChapter, currentQuote || undefined);
      setCustomQuote(newQuote);
      setCustomQuoteChapter(latestChapter.chapter_number);
    }
  }, [getCurrentQuote, chapters]);

  // Handle browse quotes
  const handleBrowseQuotes = useCallback(() => {
    setShowBrowseModal(true);
  }, []);

  // Handle quote selection from browse modal
  const handleSelectQuote = useCallback((quote: string, chapterNumber: number) => {
    setCustomQuote(quote);
    setCustomQuoteChapter(chapterNumber);
    setShowBrowseModal(false);
  }, []);

  // Generate and share card
  const handleShare = useCallback(async () => {
    if (!cardRef.current || chapters.length === 0) return;

    setGenerationStage('generating');

    try {
      // Capture the card as an image at full resolution
      const dimensions = CARD_DIMS[selectedAspectRatio];
      const uri = await toPng(cardRef.current, {
        width: dimensions.width,
        height: dimensions.height,
        quality: 1,
        pixelRatio: 1,
        cacheBust: true,
      });

      setGenerationStage('sharing');

      // Convert to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Share the card
      const result = await shareCard(blob, currentCard, 'png');

      if (result.success) {
        toast.success('Card shared successfully!');
      } else if (result.error) {
        toast.error(result.error);
      }

      setGenerationStage('idle');
    } catch (error) {
      setGenerationStage('idle');
      console.error('Error sharing card:', error);
      toast.error('Failed to share card. Please try again.');
    }
  }, [cardRef, selectedAspectRatio, currentCard, chapters]);

  // Download card
  const handleDownload = useCallback(async () => {
    if (!cardRef.current || chapters.length === 0) return;

    setGenerationStage('generating');

    try {
      const dimensions = CARD_DIMS[selectedAspectRatio];
      const uri = await toPng(cardRef.current, {
        width: dimensions.width,
        height: dimensions.height,
        quality: 1,
        pixelRatio: 1,
        cacheBust: true,
      });

      const response = await fetch(uri);
      const blob = await response.blob();

      const result = await downloadCard(blob, currentCard, 'png');

      if (result.success) {
        toast.success('Card downloaded!');
      } else {
        toast.error(result.error || 'Failed to download');
      }

      setGenerationStage('idle');
    } catch (error) {
      setGenerationStage('idle');
      console.error('Error downloading card:', error);
      toast.error('Failed to download card. Please try again.');
    }
  }, [cardRef, selectedAspectRatio, currentCard, chapters]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!cardRef.current || chapters.length === 0) return;

    setGenerationStage('generating');

    try {
      const dimensions = CARD_DIMS[selectedAspectRatio];
      const uri = await toPng(cardRef.current, {
        width: dimensions.width,
        height: dimensions.height,
        quality: 1,
        pixelRatio: 1,
        cacheBust: true,
      });

      const response = await fetch(uri);
      const blob = await response.blob();

      const result = await copyToClipboard(blob);

      if (result.success) {
        toast.success('Copied to clipboard!');
      } else {
        toast.error(result.error || 'Failed to copy');
      }

      setGenerationStage('idle');
    } catch (error) {
      setGenerationStage('idle');
      console.error('Error copying card:', error);
      toast.error('Failed to copy card. Please try again.');
    }
  }, [cardRef, selectedAspectRatio, currentCard, chapters]);

  // Handle style selection
  const handleStyleSelect = useCallback((style: CardStyle) => {
    setSelectedStyle(style);
    setSelectedSuggestion(
      cardSuggestions.findIndex(c => c.config.style === style) || 0
    );
  }, [cardSuggestions]);

  // Handle aspect ratio selection
  const handleAspectRatioChange = useCallback((ratio: CardAspectRatio) => {
    setSelectedAspectRatio(ratio);
  }, []);

  if (!open) return null;

  const themeGradient = THEME_GRADIENTS[story.theme] || THEME_GRADIENTS.romance;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-white/20 dark:border-gray-700">
        {/* Header with gradient accent */}
        <div className="relative shrink-0">
          {/* Gradient accent bar */}
          <div className={`h-2 bg-gradient-to-r ${themeGradient}`} />
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${themeGradient} shadow-lg`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Share Your Story</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{story.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Main Content - Side by side layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Card Preview */}
          <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 overflow-auto">
            <div className="relative">
              {/* Decorative glow behind card */}
              <div className={`absolute -inset-4 bg-gradient-to-r ${themeGradient} rounded-3xl blur-2xl opacity-20 dark:opacity-30`} />
              <div ref={cardRef} className="relative inline-block shadow-2xl rounded-2xl">
                {currentCard.config.style === 'quote' && (
                  <QuoteCard
                    config={currentCard.config}
                    theme={story.theme}
                    aspectRatio={selectedAspectRatio}
                    pairingCode={formatPairingCode(story.pairing_code)}
                    gradientOverride={getGradientByIndex(selectedGradientIndex)}
                    partnerName={partnerName}
                  />
                )}
                {currentCard.config.style === 'milestone' && (
                  <MilestoneCard
                    config={currentCard.config}
                    aspectRatio={selectedAspectRatio}
                    pairingCode={formatPairingCode(story.pairing_code)}
                    gradientOverride={getGradientByIndex(selectedGradientIndex)}
                  />
                )}
                {currentCard.config.style === 'illustrated' && (
                  <IllustratedCard
                    config={currentCard.config}
                    theme={story.theme}
                    aspectRatio={selectedAspectRatio}
                    pairingCode={formatPairingCode(story.pairing_code)}
                    gradientOverride={getGradientByIndex(selectedGradientIndex)}
                  />
                )}
                {currentCard.config.style === 'origin' && (
                  <OriginCard
                    config={currentCard.config}
                    theme={story.theme}
                    aspectRatio={selectedAspectRatio}
                    pairingCode={formatPairingCode(story.pairing_code)}
                    gradientOverride={getGradientByIndex(selectedGradientIndex)}
                  />
                )}
                {currentCard.config.style === 'chapter' && (
                  <ChapterCard
                    config={currentCard.config}
                    theme={story.theme}
                    aspectRatio={selectedAspectRatio}
                    pairingCode={formatPairingCode(story.pairing_code)}
                    gradientOverride={getGradientByIndex(selectedGradientIndex)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="lg:w-96 p-5 space-y-5 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 overflow-y-auto">
            {/* Card Style Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                Card Style
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CARD_STYLE_PRESETS).map(([style, preset]) => {
                  const isSelected = selectedStyle === style;
                  return (
                    <button
                      key={style}
                      onClick={() => handleStyleSelect(style as CardStyle)}
                      className={`
                        relative p-3 rounded-xl border-2 transition-all group
                        ${isSelected
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/20 shadow-md shadow-pink-500/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <div
                        className="w-11 h-11 rounded-xl mx-auto mb-2 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: preset.previewColors[0] }}
                      >
                        {style === 'quote' && <Quote className="w-5 h-5 text-white" />}
                        {style === 'milestone' && <Flag className="w-5 h-5 text-white" />}
                        {style === 'illustrated' && <ImageIcon className="w-5 h-5 text-white" />}
                        {style === 'origin' && <Heart className="w-5 h-5 text-white" />}
                        {style === 'chapter' && <BookOpen className="w-5 h-5 text-white" />}
                      </div>
                      <span className={`text-xs font-medium ${isSelected ? 'text-pink-600 dark:text-pink-400' : 'text-gray-600 dark:text-gray-400'}`}>
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                Size & Format
              </h3>
              <div className="flex gap-2">
                {(['story', 'square', 'portrait'] as const).map((ratio) => {
                  const isSelected = selectedAspectRatio === ratio;
                  const labels = {
                    story: 'Story',
                    square: 'Square',
                    portrait: 'Portrait',
                  };
                  const icons = {
                    story: Smartphone,
                    square: Square,
                    portrait: Tablet,
                  };
                  const Icon = icons[ratio];
                  return (
                    <button
                      key={ratio}
                      onClick={() => handleAspectRatioChange(ratio)}
                      className={`
                        flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border transition-all
                        ${isSelected
                          ? `bg-gradient-to-br ${themeGradient} border-transparent text-white shadow-lg`
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{labels[ratio]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gradient/Color Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-r from-pink-500 to-purple-500" />
                  Colors
                </h3>
                <button
                  onClick={handleGradientShuffle}
                  className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-colors px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-pink-50 dark:hover:bg-pink-500/10"
                  title="Shuffle colors"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Shuffle</span>
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
                {ALL_GRADIENTS.map((gradient, index) => {
                  const isSelected = selectedGradientIndex === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleGradientSelect(index)}
                      className={`
                        relative aspect-square rounded-xl border-2 transition-all overflow-hidden hover:scale-105
                        ${isSelected
                          ? 'border-pink-500 ring-2 ring-pink-200 dark:ring-pink-900 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                      style={{
                        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                      }}
                      title={`Gradient ${index + 1}`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <div className="w-3 h-3 bg-white rounded-full shadow-md" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quote Controls - for quote and origin cards */}
            {(selectedStyle === 'quote' || selectedStyle === 'origin') && (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-pink-500" />
                  Quote Options
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleShuffle}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-all"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span className="text-xs font-medium">Shuffle</span>
                  </button>
                  <button
                    onClick={handleBrowseQuotes}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-all"
                  >
                    <Search className="w-4 h-4" />
                    <span className="text-xs font-medium">Browse</span>
                  </button>
                </div>
              </div>
            )}

            {/* Share Info */}
            <div className={`p-4 rounded-xl bg-gradient-to-r ${themeGradient} text-white`}>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Share Your Story</p>
                  <p className="text-xs text-white/80">
                    Generate a beautiful card with your pairing code to invite your partner to join your story.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm shrink-0">
          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={generationStage !== 'idle'}
            className="py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={handleDownload}
            disabled={generationStage !== 'idle'}
            className="py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleShare}
            disabled={generationStage !== 'idle'}
            className={`flex-1 py-3 px-5 rounded-xl bg-gradient-to-r ${themeGradient} text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg shadow-pink-500/25`}
          >
            {generationStage === 'generating' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : generationStage === 'sharing' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Opening Share Sheet...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share Card
              </>
            )}
          </button>
        </div>
      </div>

      {/* Browse Quotes Modal */}
      <BrowseQuotesModal
        open={showBrowseModal}
        onClose={() => setShowBrowseModal(false)}
        chapters={chapters}
        onSelectQuote={handleSelectQuote}
        currentQuote={getCurrentQuote() || undefined}
      />
    </div>
  );
}
