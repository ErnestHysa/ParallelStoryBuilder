import React from 'react';
import { getGradientColors, getPalette, CARD_DIMENSIONS } from '@/lib/cardGenerator';

interface MilestoneCardProps {
  config: {
    style: 'milestone';
    title: string;
    chapterCount: number;
    daysTogether?: number;
    startDate?: string;
    theme: string;
    gradientIndex?: number;
    showBranding?: boolean;
  };
  aspectRatio?: 'story' | 'square' | 'portrait';
  width?: number;
  height?: number;
  pairingCode?: string;
  gradientOverride?: [string, string];
}

export function MilestoneCard({
  config,
  aspectRatio = 'story',
  width,
  height,
  pairingCode,
  gradientOverride,
}: MilestoneCardProps) {
  const palette = getPalette(config.theme);
  const dimensions = width && height ? { width, height } : CARD_DIMENSIONS[aspectRatio];

  // Use gradient override if provided, otherwise fall back to theme-based gradient
  const [gradientStart, gradientEnd] = gradientOverride ||
    getGradientColors(config.theme, config.gradientIndex || 0);

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
        background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute opacity-5 rounded-full"
        style={{
          width: previewWidth * 0.3,
          height: previewWidth * 0.3,
          left: previewWidth * 0.05,
          top: previewHeight * 0.1,
          backgroundColor: 'white',
        }}
      />
      <div
        className="absolute opacity-5 rounded-full"
        style={{
          width: previewWidth * 0.4,
          height: previewWidth * 0.4,
          right: -previewWidth * 0.1,
          bottom: -previewWidth * 0.1,
          backgroundColor: 'white',
        }}
      />

      {/* Title */}
      <div
        className="absolute left-0 right-0 text-center text-white font-bold tracking-wide"
        style={{
          top: previewHeight * 0.18,
          fontSize: previewWidth * 0.06,
        }}
      >
        {config.title.length > 25 ? config.title.substring(0, 25) + '...' : config.title}
      </div>

      {/* "Our Journey" subtitle */}
      <div
        className="absolute left-0 right-0 text-center text-white/70 font-medium tracking-widest"
        style={{
          top: previewHeight * 0.24,
          fontSize: previewWidth * 0.03,
          letterSpacing: '3px',
        }}
      >
        OUR JOURNEY
      </div>

      {/* Main circle */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center"
        style={{
          top: previewHeight * 0.32,
          width: previewWidth * 0.44,
          height: previewWidth * 0.44,
          background: 'rgba(255,255,255,0.15)',
          border: '2px solid rgba(255,255,255,0.3)',
        }}
      >
        {/* Chapter count */}
        <div className="text-center">
          <div
            className="text-white font-bold"
            style={{ fontSize: previewWidth * 0.18 }}
          >
            {config.chapterCount}
          </div>
          <div
            className="text-white/90 font-semibold tracking-wider"
            style={{
              fontSize: previewWidth * 0.035,
              letterSpacing: '2px',
            }}
          >
            CHAPTERS
          </div>
        </div>
      </div>

      {/* Heart icon */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-4xl opacity-40"
        style={{ top: previewHeight * 0.58 }}
      >
        ❤️
      </div>

      {/* Days together indicator */}
      {config.daysTogether !== undefined && config.daysTogether > 0 && (
        <>
          <div
            className="absolute left-0 right-0 bg-white/10"
            style={{
              top: previewHeight * 0.68,
              height: 1,
              margin: '0 ' + previewWidth * 0.1 + 'px',
            }}
          />
          <div
            className="absolute left-0 right-0 text-center text-white font-semibold"
            style={{
              top: previewHeight * 0.74,
              fontSize: previewWidth * 0.055,
            }}
          >
            {config.daysTogether} Days Together
          </div>
          {config.startDate && (
            <div
              className="absolute left-0 right-0 text-center text-white/70"
              style={{
                top: previewHeight * 0.79,
                fontSize: previewWidth * 0.028,
              }}
            >
              Since {config.startDate}
            </div>
          )}
        </>
      )}

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
