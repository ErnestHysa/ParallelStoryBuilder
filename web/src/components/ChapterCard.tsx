import React from 'react';
import { BookOpen } from 'lucide-react';
import { getGradientColors, getPalette, CARD_DIMENSIONS } from '@/lib/cardGenerator';

interface ChapterCardProps {
  config: {
    style: 'chapter';
    chapter: number;
    excerpt: string;
    title: string;
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

export function ChapterCard({
  config,
  theme,
  aspectRatio = 'story',
  width,
  height,
  pairingCode,
  gradientOverride,
}: ChapterCardProps) {
  const palette = getPalette(theme);
  const dimensions = width && height ? { width, height } : CARD_DIMENSIONS[aspectRatio];

  // Use gradient override if provided, otherwise fall back to theme-based gradient
  const [gradientStart, gradientEnd] = gradientOverride ||
    getGradientColors(theme, config.gradientIndex || 0);

  // Calculate responsive dimensions for preview
  const previewWidth = width || Math.min(400, window.innerWidth - 32);
  const previewHeight = height || previewWidth * (dimensions.height / dimensions.width);
  const scale = previewWidth / dimensions.width;

  // Format excerpt with line breaks for readability
  const maxCharsPerLine = Math.floor(dimensions.width / 28);
  const words = config.excerpt.split(' ');
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

  // Limit the number of lines for visual balance
  const maxLines = aspectRatio === 'story' ? 12 : aspectRatio === 'portrait' ? 10 : 8;
  const displayLines = lines.slice(0, maxLines);
  const hasMore = lines.length > maxLines;

  const fontSize = dimensions.width * 0.038 * scale;
  const lineHeight = fontSize * 1.5;
  const topMargin = previewHeight * 0.28;

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

      {/* Book icon - top */}
      <div
        className="absolute opacity-15 text-white"
        style={{
          left: previewWidth * 0.5,
          top: previewHeight * 0.10,
          transform: 'translateX(-50%)',
        }}
      >
        <BookOpen style={{ width: previewWidth * 0.14, height: previewWidth * 0.14 }} />
      </div>

      {/* Chapter indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-white opacity-90 font-medium tracking-widest text-xs uppercase"
        style={{
          top: previewHeight * 0.20,
          fontSize: previewWidth * 0.028,
        }}
      >
        Chapter {config.chapter}
      </div>

      {/* Story title */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-white opacity-80 font-semibold"
        style={{
          top: previewHeight * 0.245,
          fontSize: previewWidth * 0.032,
        }}
      >
        {config.title}
      </div>

      {/* Excerpt text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        {displayLines.map((line, index) => (
          <div
            key={index}
            className="text-white text-center font-normal leading-relaxed"
            style={{
              fontSize,
              lineHeight: `${lineHeight}px`,
              marginTop: index === 0 ? topMargin : 0,
            }}
          >
            {line}
          </div>
        ))}
        {hasMore && (
          <div
            className="text-white/70 text-center italic mt-2"
            style={{ fontSize: fontSize * 0.9 }}
          >
            ...
          </div>
        )}
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
