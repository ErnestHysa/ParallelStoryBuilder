'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Share2, Download, Copy, Smartphone, Square, Tablet, Image as ImageIcon, Quote, Flag, Heart, BookOpen, Shuffle, Search } from 'lucide-react';
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

interface ShareableCardDialogProps {
  open: boolean;
  onClose: () => void;
  story: {
    id: string;
    title: string;
    theme: string;
    created_at: string;
    pairing_code: string;
  };
  chapters: Array<{
    id: string;
    content: string;
    ai_enhanced_content?: string | null;
    chapter_number: number;
    author_id: string;
    created_at: string;
  }>;
}

export function ShareableCardDialog({
  open,
  onClose,
  story,
  chapters,
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Share Your Story</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Main Content - Side by side layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Card Preview */}
          <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 overflow-auto">
            <div ref={cardRef} className="inline-block">
              {currentCard.config.style === 'quote' && (
                <QuoteCard
                  config={currentCard.config}
                  theme={story.theme}
                  aspectRatio={selectedAspectRatio}
                  pairingCode={formatPairingCode(story.pairing_code)}
                  gradientOverride={getGradientByIndex(selectedGradientIndex)}
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

          {/* Right: Controls */}
          <div className="lg:w-80 p-4 space-y-4 border-t lg:border-t-0 lg:border-l shrink-0 overflow-y-auto">
            {/* Card Style Selection */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Card Style</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CARD_STYLE_PRESETS).map(([style, preset]) => {
                  const isSelected = selectedStyle === style;
                  return (
                    <button
                      key={style}
                      onClick={() => handleStyleSelect(style as CardStyle)}
                      className={`
                        relative p-2 rounded-lg border-2 transition-all
                        ${isSelected
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }
                      `}
                    >
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center"
                        style={{ backgroundColor: preset.previewColors[0] }}
                      >
                        {style === 'quote' && <Quote className="w-4 h-4 text-white" />}
                        {style === 'milestone' && <Flag className="w-4 h-4 text-white" />}
                        {style === 'illustrated' && <ImageIcon className="w-4 h-4 text-white" />}
                        {style === 'origin' && <Heart className="w-4 h-4 text-white" />}
                        {style === 'chapter' && <BookOpen className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-xs font-medium ${isSelected ? 'text-pink-600' : 'text-gray-600'}`}>
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio Selection */}
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Size & Format</h3>
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
                        flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg border transition-all
                        ${isSelected
                          ? 'bg-pink-500 border-pink-500 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{labels[ratio]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gradient/Color Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Colors</h3>
                <button
                  onClick={handleGradientShuffle}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-500 transition-colors"
                  title="Shuffle colors"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Shuffle</span>
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1.5 max-h-32 overflow-y-auto pr-1">
                {ALL_GRADIENTS.map((gradient, index) => {
                  const isSelected = selectedGradientIndex === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleGradientSelect(index)}
                      className={`
                        relative h-10 rounded-lg border-2 transition-all overflow-hidden
                        ${isSelected
                          ? 'border-pink-500 ring-2 ring-pink-200'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      style={{
                        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                      }}
                      title={`Gradient ${index + 1}`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/30">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quote Controls - for quote and origin cards */}
            {(selectedStyle === 'quote' || selectedStyle === 'origin') && (
              <div>
                <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">Quote Options</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleShuffle}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100 transition-all"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span className="text-xs font-medium">Shuffle</span>
                  </button>
                  <button
                    onClick={handleBrowseQuotes}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-gray-100 transition-all"
                  >
                    <Search className="w-4 h-4" />
                    <span className="text-xs font-medium">Browse</span>
                  </button>
                </div>
              </div>
            )}

            {/* Share Info - Compact */}
            <div className="flex gap-2 p-3 bg-pink-50 rounded-lg">
              <Share2 className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">
                High-quality image with your pairing code for others to join your story.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 p-4 border-t bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={generationStage !== 'idle'}
            className="py-2.5 px-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={handleDownload}
            disabled={generationStage !== 'idle'}
            className="py-2.5 px-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm"
          >
            <Download className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleShare}
            disabled={generationStage !== 'idle'}
            className="flex-1 py-2.5 px-4 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
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
