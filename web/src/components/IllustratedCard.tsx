import React from 'react';
import { getGradientColors, getPalette, CARD_DIMENSIONS } from '@/lib/cardGenerator';

interface IllustratedCardProps {
  config: {
    style: 'illustrated';
    backgroundType: 'gradient' | 'solid' | 'image';
    gradientIndex?: number;
    backgroundImage?: string;
    quote?: string;
    title: string;
    chapter?: number;
    showBranding?: boolean;
  };
  theme: string;
  aspectRatio?: 'story' | 'square' | 'portrait';
  width?: number;
  height?: number;
  pairingCode?: string;
  gradientOverride?: [string, string];
}

export function IllustratedCard({
  config,
  theme,
  aspectRatio = 'story',
  width,
  height,
  pairingCode,
  gradientOverride,
}: IllustratedCardProps) {
  const palette = getPalette(theme);
  const dimensions = width && height ? { width, height } : CARD_DIMENSIONS[aspectRatio];

  // Use gradient override if provided, otherwise fall back to theme-based gradient
  const [gradientStart, gradientEnd] = gradientOverride ||
    getGradientColors(theme, config.gradientIndex || 0);

  // Calculate responsive dimensions for preview
  const previewWidth = width || Math.min(400, window.innerWidth - 32);
  const previewHeight = height || previewWidth * (dimensions.height / dimensions.width);
  const scale = previewWidth / dimensions.width;

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        width: previewWidth,
        height: previewHeight,
        background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 50%, ${gradientStart} 100%)`,
      }}
    >
      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Decorative glow */}
      <div
        className="absolute opacity-15 rounded-full"
        style={{
          width: previewWidth * 0.8,
          height: previewWidth * 0.8,
          right: -previewWidth * 0.2,
          top: -previewWidth * 0.1,
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Decorative dots */}
      <div className="absolute opacity-10 flex flex-col gap-8" style={{ left: previewWidth * 0.1, top: previewHeight * 0.15 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={`dot1-${i}`}
            className="w-1.5 h-1.5 bg-white rounded-full"
          />
        ))}
      </div>
      <div className="absolute opacity-10 flex flex-col gap-8" style={{ right: previewWidth * 0.1, top: previewHeight * 0.7 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={`dot2-${i}`}
            className="w-1.5 h-1.5 bg-white rounded-full"
          />
        ))}
      </div>

      {/* Title */}
      <div
        className="absolute left-0 right-0 text-center text-white font-bold tracking-wide"
        style={{
          top: previewHeight * 0.32,
          fontSize: previewWidth * 0.065,
          letterSpacing: '1.5px',
        }}
      >
        {config.title.length > 28 ? config.title.substring(0, 28) + '...' : config.title}
      </div>

      {/* Decorative line */}
      <div
        className="absolute left-0 right-0 mx-auto bg-white/60 rounded"
        style={{
          top: previewHeight * 0.38,
          width: previewWidth * 0.3,
          height: 2,
        }}
      />

      {/* Quote/text */}
      {config.quote && (
        <div
          className="absolute left-0 right-0 px-8 text-center text-white font-medium leading-relaxed"
          style={{
            top: previewHeight * 0.48,
            fontSize: previewWidth * 0.04,
          }}
        >
          {config.quote}
        </div>
      )}

      {/* Chapter badge */}
      {config.chapter && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center"
          style={{
            top: previewHeight * 0.62,
            width: previewWidth * 0.16,
            height: previewWidth * 0.16,
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.4)',
          }}
        >
          <span
            className="text-white font-bold"
            style={{ fontSize: previewWidth * 0.035 }}
          >
            Ch. {config.chapter}
          </span>
        </div>
      )}

      {/* "A Love Story" subtitle */}
      <div
        className="absolute left-0 right-0 text-center text-white/70 font-medium tracking-widest"
        style={{
          top: previewHeight * 0.75,
          fontSize: previewWidth * 0.032,
          letterSpacing: '4px',
        }}
      >
        A LOVE STORY
      </div>

      {/* Heart */}
      <div
        className="absolute left-1/2 -translate-x-1/2 opacity-80"
        style={{
          top: previewHeight * 0.82,
          fontSize: previewWidth * 0.06,
        }}
      >
        ❤
      </div>

      {/* Pairing code - join instructions */}
      {pairingCode && (
        <div
          className="absolute left-0 right-0 text-center"
          style={{
            bottom: config.showBranding ? previewHeight * 0.09 : previewHeight * 0.04,
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
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-black/30 py-3"
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
