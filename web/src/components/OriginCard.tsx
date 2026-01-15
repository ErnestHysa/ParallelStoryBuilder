import React from 'react';
import { Heart } from 'lucide-react';
import { getGradientColors, getPalette, CARD_DIMENSIONS } from '@/lib/cardGenerator';

interface OriginCardProps {
  config: {
    style: 'origin';
    quote: string;
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
}

export function OriginCard({
  config,
  theme,
  aspectRatio = 'story',
  width,
  height,
  pairingCode,
  gradientOverride,
}: OriginCardProps) {
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

  const fontSize = dimensions.width * 0.050 * scale;
  const lineHeight = fontSize * 1.4;
  const topMargin = previewHeight * 0.22;

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

      {/* Heart icon - top */}
      <div
        className="absolute opacity-20 text-white"
        style={{
          left: previewWidth * 0.5,
          top: previewHeight * 0.12,
          transform: 'translateX(-50%)',
        }}
      >
        <Heart style={{ width: previewWidth * 0.12, height: previewWidth * 0.12 }} fill="white" />
      </div>

      {/* "Where it all began" label */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-white/60 font-medium tracking-widest text-xs uppercase"
        style={{
          top: previewHeight * 0.22,
          fontSize: previewWidth * 0.025,
        }}
      >
        Where it all began
      </div>

      {/* Quote text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
        {lines.map((line, index) => (
          <div
            key={index}
            className="text-white text-center font-serif italic tracking-wide"
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

      {/* Chapter indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-white opacity-80 font-medium tracking-widest text-xs"
        style={{
          bottom: previewHeight * 0.18,
          fontSize: previewWidth * 0.032,
        }}
      >
        CHAPTER 1
      </div>

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

      {/* Pairing code - join instructions - removed for social media sharing */}

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
