import React from 'react';
import { getGradientColors, getGradientByIndex, getPalette, CARD_DIMENSIONS } from '@/lib/cardGenerator';

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
  gradientOverride?: [string, string];
  partnerName?: string | null;
}

export function QuoteCard({
  config,
  theme,
  aspectRatio = 'story',
  width,
  height,
  pairingCode,
  gradientOverride,
  partnerName,
}: QuoteCardProps) {
  const palette = getPalette(theme);
  const dimensions = width && height ? { width, height } : CARD_DIMENSIONS[aspectRatio];

  // Use gradient override if provided, otherwise fall back to theme-based gradient
  const [gradientStart, gradientEnd] = gradientOverride ||
    getGradientColors(theme, config.gradientIndex || 0);

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
      {/* Decorative circles for visual interest */}
      <div
        className="absolute rounded-full"
        style={{
          width: previewWidth * 0.4,
          height: previewWidth * 0.4,
          background: 'rgba(255, 255, 255, 0.05)',
          left: -previewWidth * 0.1,
          top: -previewWidth * 0.05,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: previewWidth * 0.3,
          height: previewWidth * 0.3,
          background: 'rgba(255, 255, 255, 0.03)',
          right: -previewWidth * 0.05,
          bottom: previewHeight * 0.4,
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: previewWidth * 0.2,
          height: previewWidth * 0.2,
          background: 'rgba(255, 255, 255, 0.04)',
          left: previewWidth * 0.7,
          top: previewHeight * 0.1,
        }}
      />

      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 100%)',
        }}
      />

      {/* Quote mark - top */}
      <div
        className="absolute opacity-20 font-serif font-bold text-white"
        style={{
          left: previewWidth * 0.1,
          top: previewHeight * 0.15,
          fontSize: previewWidth * 0.18,
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
              textShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Quote mark - bottom */}
      <div
        className="absolute opacity-20 font-serif font-bold text-white"
        style={{
          right: previewWidth * 0.1,
          bottom: previewHeight * 0.3,
          fontSize: previewWidth * 0.18,
        }}
      >
        "
      </div>

      {/* Decorative line */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bg-white/30"
        style={{
          width: previewWidth * 0.15,
          height: 1,
          bottom: previewHeight * 0.22,
        }}
      />

      {/* Chapter indicator */}
      {config.chapter && (
        <div
          className="absolute left-1/2 -translate-x-1/2 text-white opacity-90 font-medium tracking-widest text-xs"
          style={{
            bottom: previewHeight * 0.185,
            fontSize: previewWidth * 0.032,
          }}
        >
          CHAPTER {config.chapter}
        </div>
      )}

      {/* Story title with partner name */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
        {partnerName ? (
          <>
            <div
              className="text-white opacity-80 font-normal"
              style={{
                bottom: previewHeight * 0.13,
                fontSize: previewWidth * 0.028,
              }}
            >
              {config.author || 'Our Story'}
            </div>
            <div
              className="text-white opacity-90 font-medium flex items-center gap-1"
              style={{
                bottom: previewHeight * 0.095,
                fontSize: previewWidth * 0.032,
              }}
            >
              with <span className="font-semibold">{partnerName}</span>
            </div>
          </>
        ) : (
          <div
            className="text-white opacity-80 font-normal"
            style={{
              bottom: previewHeight * 0.11,
              fontSize: previewWidth * 0.028,
            }}
          >
            {config.author || 'Our Story'}
          </div>
        )}
      </div>

      {/* Pairing code - join instructions - removed for social media sharing */}
      {/* {pairingCode && (
        <div
          className="absolute left-0 right-0 text-center"
          style={{
            bottom: config.showBranding ? previewHeight * 0.09 : previewHeight * 0.06,
          }}
        >
          <div
            className="inline-block bg-white/15 backdrop-blur-md rounded-xl px-5 py-2.5 border border-white/20"
          >
            <div
              className="text-white/70 text-xs font-medium tracking-wider mb-1"
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
      )} */}

      {/* Branding footer */}
      {config.showBranding && (
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/20 py-3 backdrop-blur-sm"
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
