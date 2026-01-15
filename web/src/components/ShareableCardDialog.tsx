'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Share2, Download, Copy, Smartphone, Square, Tablet, Image as ImageIcon, Quote, Flag } from 'lucide-react';
import { toPng } from 'html-to-image';
import toast from 'react-hot-toast';

import { QuoteCard } from './QuoteCard';
import { MilestoneCard } from './MilestoneCard';
import { IllustratedCard } from './IllustratedCard';
import {
  CardData,
  CardStyle,
  CardAspectRatio,
  generateCardData,
  generateCardSuggestions,
  CARD_STYLE_PRESETS,
  CARD_DIMENSIONS,
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
  const [generationStage, setGenerationStage] = useState<'idle' | 'generating' | 'sharing'>('idle');
  const cardRef = useRef<HTMLDivElement>(null);

  // Generate card suggestions when modal opens or story changes
  const [cardSuggestions, setCardSuggestions] = useState<CardData[]>([]);

  useEffect(() => {
    if (open && story && chapters.length > 0) {
      const suggestions = generateCardSuggestions(story, chapters, 3);
      setCardSuggestions(suggestions);
      setSelectedSuggestion(0);
    }
  }, [open, story.id, chapters.length]);

  // Get current card data
  const currentCard: CardData = cardSuggestions[selectedSuggestion] ||
    generateCardData(story, chapters, selectedStyle, selectedAspectRatio);

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
  }, [cardRef, selectedAspectRatio, chapters]);

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

  // Render card preview
  const renderCardPreview = () => {
    const cardStyle = currentCard.config.style;

    return (
      <div className="flex justify-center py-6">
        <div ref={cardRef} className="inline-block">
          {cardStyle === 'quote' && (
            <QuoteCard
              config={currentCard.config}
              theme={story.theme}
              aspectRatio={selectedAspectRatio}
              pairingCode={formatPairingCode(story.pairing_code)}
            />
          )}
          {cardStyle === 'milestone' && (
            <MilestoneCard
              config={currentCard.config}
              aspectRatio={selectedAspectRatio}
              pairingCode={formatPairingCode(story.pairing_code)}
            />
          )}
          {cardStyle === 'illustrated' && (
            <IllustratedCard
              config={currentCard.config}
              theme={story.theme}
              aspectRatio={selectedAspectRatio}
              pairingCode={formatPairingCode(story.pairing_code)}
            />
          )}
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Share Your Story</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Card Preview */}
          {renderCardPreview()}

          {/* Card Style Selection */}
          <div className="px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Card Style</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(CARD_STYLE_PRESETS).map(([style, preset]) => {
                const isSelected = selectedStyle === style;
                return (
                  <button
                    key={style}
                    onClick={() => handleStyleSelect(style as CardStyle)}
                    className={`
                      relative p-3 rounded-xl border-2 transition-all
                      ${isSelected
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }
                    `}
                  >
                    <div
                      className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                      style={{ backgroundColor: preset.previewColors[0] }}
                    >
                      {style === 'quote' && <Quote className="w-5 h-5 text-white" />}
                      {style === 'milestone' && <Flag className="w-5 h-5 text-white" />}
                      {style === 'illustrated' && <ImageIcon className="w-5 h-5 text-white" />}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-pink-600' : 'text-gray-600'}`}>
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="px-6 py-4 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Size & Format</h3>
            <div className="flex gap-2">
              {(['story', 'square', 'portrait'] as const).map((ratio) => {
                const isSelected = selectedAspectRatio === ratio;
                const labels = {
                  story: 'Story 9:16',
                  square: 'Square 1:1',
                  portrait: 'Portrait 4:5',
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
                      flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border transition-all
                      ${isSelected
                        ? 'bg-pink-500 border-pink-500 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{labels[ratio]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Share Info */}
          <div className="px-6 py-4 border-t">
            <div className="flex gap-3 p-4 bg-pink-50 rounded-xl">
              <Share2 className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {currentCard.config.style === 'quote'
                    ? 'Share a meaningful quote'
                    : currentCard.config.style === 'milestone'
                    ? 'Celebrate your progress'
                    : 'Share your beautiful story'}
                </p>
                <p className="text-sm text-gray-600">
                  Your card will be shared as a high-quality image.
                  Tag us for a chance to be featured!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={generationStage !== 'idle'}
            className="py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={handleDownload}
            disabled={generationStage !== 'idle'}
            className="py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleShare}
            disabled={generationStage !== 'idle'}
            className="flex-1 py-3 px-4 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  );
}
