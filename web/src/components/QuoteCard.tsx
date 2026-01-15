import React from 'react';
import { getGradientColors, getPalette, CARD_DIMENSIONS } from '@/lib/cardGenerator';

interface QuoteCardProps {
  config: {
    style: 'quote';
    quote: string;
    chapter?: number;
    author?: string;
    gradientIndex?: number;
    showBranding?: boolean;
  };
  theme: string;
  aspectRatio?: 'story' | 'square' | 'portrait';
  width?: number;
  height?: number;
  pairingCode?: string;
}

export function QuoteCard({
  config,
  theme,
  aspectRatio = 'story',
  width,
  height,
  pairingCode,
}: QuoteCardProps) {
  const palette = getPalette(theme);
  const dimensions = width && height ? { width, height } : CARD_DIMENSIONS[aspectRatio];
  const [gradientStart, gradientEnd] = getGradientColors(theme, config.gradientIndex || 0);

  // Calculate responsive dimensions for preview
  const previewWidth = width || Math.min(400, window.innerWidth - 32);
  const previewHeight = height || previewWidth * (dimensions.height / dimensions.width);
  const scale = previewWidth / dimensions.width;

  // Format quote with line breaks
  const maxCharsPerLine = Math.floor(dimensions.width / 35);
  const words = config.quote.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);

  const fontSize = dimensions.width * 0.055 * scale;
  const lineHeight = fontSize * 1.4;
  const topMargin = previewHeight * 0.25;

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        width: previewWidth,
        height: previewHeight,
        background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
      }}
    >
      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 100%)',
        }}
      />

      {/* Quote mark - top */}
      <div
        className="absolute opacity-15 font-serif font-bold text-white"
        style={{
          left: previewWidth * 0.1,
          top: previewHeight * 0.15,
          fontSize: previewWidth * 0.15,
        }}
      >
        "
      </div>

      {/* Quote text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
        {lines.map((line, index) => (
          <div
            key={index}
            className="text-white text-center font-semibold tracking-wide"
            style={{
              fontSize,
              lineHeight: `${lineHeight}px`,
              marginTop: index === 0 ? topMargin : 0,
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Quote mark - bottom */}
      <div
        className="absolute opacity-15 font-serif font-bold text-white"
        style={{
          right: previewWidth * 0.1,
          bottom: previewHeight * 0.25,
          fontSize: previewWidth * 0.15,
        }}
      >
        "
      </div>

      {/* Chapter indicator */}
      {config.chapter && (
        <div
          className="absolute left-1/2 -translate-x-1/2 text-white opacity-80 font-medium tracking-widest text-xs"
          style={{
            bottom: previewHeight * 0.18,
            fontSize: previewWidth * 0.032,
          }}
        >
          CHAPTER {config.chapter}
        </div>
      )}

      {/* Story title */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-white opacity-70 font-normal"
        style={{
          bottom: previewHeight * 0.12,
          fontSize: previewWidth * 0.028,
        }}
      >
        {config.author || 'Our Story'}
      </div>

      {/* Pairing code - join instructions */}
      {pairingCode && (
        <div
          className="absolute left-0 right-0 text-center"
          style={{
            bottom: config.showBranding ? previewHeight * 0.09 : previewHeight * 0.06,
          }}
        >
          <div
            className="inline-block bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
          >
            <div
              className="text-white/80 text-xs font-medium tracking-wider mb-1"
              style={{ fontSize: previewWidth * 0.02 }}
            >
              JOIN OUR STORY
            </div>
            <div
              className="text-white font-bold tracking-widest"
              style={{ fontSize: previewWidth * 0.04 }}
            >
              {pairingCode}
            </div>
          </div>
        </div>
      )}

      {/* Branding footer */}
      {config.showBranding && (
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/20 py-3"
          style={{ height: previewHeight * 0.08 }}
        >
          <span
            className="text-white opacity-60 font-medium tracking-wider"
            style={{ fontSize: previewWidth * 0.024 }}
          >
            Parallel Story Builder
          </span>
        </div>
      )}
    </div>
  );
}
