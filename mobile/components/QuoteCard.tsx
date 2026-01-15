import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Svg, Rect, Defs, LinearGradient, G, Text as SvgText, TSpan, Circle } from 'react-native-svg';
import { QuoteCardConfig, getGradientColors, getPalette, CARD_DIMENSIONS } from '../lib/cardGenerator';
import { Theme } from '../lib/types';

interface QuoteCardProps {
  config: QuoteCardConfig;
  theme: Theme;
  aspectRatio?: 'story' | 'square' | 'portrait';
  width?: number;
  height?: number;
  partnerName?: string | null;
}

const { width: screenWidth } = Dimensions.get('window');

export function QuoteCard({
  config,
  theme,
  aspectRatio = 'story',
  width,
  height,
  partnerName,
}: QuoteCardProps) {
  const palette = getPalette(theme);
  const dimensions = width && height ? { width, height } : CARD_DIMENSIONS[aspectRatio];
  const [gradientStart, gradientEnd] = getGradientColors(theme, config.gradientIndex || 0);

  // Format quote with line breaks for better rendering
  const words = config.quote.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  // Simple word wrap (approximately 25 chars per line for 1080px width)
  const maxCharsPerLine = Math.floor(dimensions.width / 35);

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

  // Quote marks decoration
  const quoteSize = dimensions.width * 0.15;
  const fontSize = dimensions.width * 0.055;
  const lineHeight = fontSize * 1.4;
  const padding = dimensions.width * 0.1;
  const topMargin = dimensions.height * 0.25;

  return (
    <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
      <Svg width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </LinearGradient>
          <LinearGradient id="overlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </LinearGradient>
        </Defs>

        {/* Background with gradient */}
        <Rect width={dimensions.width} height={dimensions.height} fill="url(#grad)" />

        {/* Decorative circles for visual interest */}
        <Circle
          cx={-dimensions.width * 0.05}
          cy={dimensions.width * 0.05}
          r={dimensions.width * 0.2}
          fill="rgba(255,255,255,0.05)"
        />
        <Circle
          cx={dimensions.width + dimensions.width * 0.03}
          cy={dimensions.height * 0.55}
          r={dimensions.width * 0.15}
          fill="rgba(255,255,255,0.03)"
        />
        <Circle
          cx={dimensions.width * 0.8}
          cy={dimensions.height * 0.15}
          r={dimensions.width * 0.1}
          fill="rgba(255,255,255,0.04)"
        />

        {/* Overlay gradient for depth */}
        <Rect width={dimensions.width} height={dimensions.height} fill="url(#overlayGrad)" />

        {/* Decorative quote mark - top left */}
        <G opacity={0.2}>
          <SvgText
            x={padding}
            y={topMargin}
            fontSize={quoteSize}
            fill="#FFFFFF"
            fontFamily="serif"
            fontWeight="bold"
          >
            "
          </SvgText>
        </G>

        {/* Quote text */}
        <G>
          {lines.map((line, index) => (
            <SvgText
              key={index}
              x={dimensions.width / 2}
              y={topMargin + 60 + index * lineHeight}
              fontSize={fontSize}
              fill="#FFFFFF"
              textAnchor="middle"
              fontFamily="System"
              fontWeight="600"
              letterSpacing={0.5}
            >
              {line}
            </SvgText>
          ))}
        </G>

        {/* Decorative quote mark - bottom right */}
        <G opacity={0.2}>
          <SvgText
            x={dimensions.width - padding - quoteSize * 0.5}
            y={dimensions.height * 0.75}
            fontSize={quoteSize}
            fill="#FFFFFF"
            fontFamily="serif"
            fontWeight="bold"
          >
            "
          </SvgText>
        </G>

        {/* Decorative line */}
        <Rect
          x={dimensions.width * 0.425}
          y={dimensions.height * 0.78}
          width={dimensions.width * 0.15}
          height={1}
          fill="rgba(255,255,255,0.3)"
        />

        {/* Chapter indicator */}
        {config.chapter && (
          <SvgText
            x={dimensions.width / 2}
            y={dimensions.height * 0.815}
            fontSize={dimensions.width * 0.032}
            fill="rgba(255,255,255,0.9)"
            textAnchor="middle"
            fontFamily="System"
            fontWeight="500"
            letterSpacing={2}
          >
            CHAPTER {config.chapter}
          </SvgText>
        )}

        {/* Story title with partner name */}
        {partnerName ? (
          <G>
            {/* Main title */}
            <SvgText
              x={dimensions.width / 2}
              y={dimensions.height * 0.82}
              fontSize={dimensions.width * 0.028}
              fill="rgba(255,255,255,0.8)"
              textAnchor="middle"
              fontFamily="System"
              fontWeight="400"
            >
              {config.author || 'Our Story'}
            </SvgText>
            {/* Partner line */}
            <SvgText
              x={dimensions.width / 2}
              y={dimensions.height * 0.855}
              fontSize={dimensions.width * 0.032}
              fill="rgba(255,255,255,0.9)"
              textAnchor="middle"
              fontFamily="System"
              fontWeight="500"
            >
              with{' '}
              <TSpan fontFamily="System" fontWeight="600" fill="#FFFFFF">
                {partnerName}
              </TSpan>
            </SvgText>
          </G>
        ) : (
          <SvgText
            x={dimensions.width / 2}
            y={dimensions.height * 0.84}
            fontSize={dimensions.width * 0.028}
            fill="rgba(255,255,255,0.8)"
            textAnchor="middle"
            fontFamily="System"
            fontWeight="400"
          >
            {config.author || 'Our Story'}
          </SvgText>
        )}

        {/* Branding footer */}
        {config.showBranding && (
          <G>
            <Rect
              x={0}
              y={dimensions.height - dimensions.height * 0.08}
              width={dimensions.width}
              height={dimensions.height * 0.08}
              fill="rgba(0,0,0,0.2)"
            />
            <SvgText
              x={dimensions.width / 2}
              y={dimensions.height - dimensions.height * 0.035}
              fontSize={dimensions.width * 0.024}
              fill="rgba(255,255,255,0.6)"
              textAnchor="middle"
              fontFamily="System"
              fontWeight="500"
              letterSpacing={1}
            >
              Parallel Story Builder
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
});
