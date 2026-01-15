import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Svg, Rect, Defs, LinearGradient, G, Text as SvgText, Circle } from 'react-native-svg';
import { IllustratedCardConfig, getGradientColors, getPalette, CARD_DIMENSIONS } from '../lib/cardGenerator';
import { Theme } from '../lib/types';

interface IllustratedCardProps {
  config: IllustratedCardConfig;
  theme: Theme;
  aspectRatio?: 'story' | 'square' | 'portrait';
  width?: number;
  height?: number;
  backgroundImageUri?: string;
}

export function IllustratedCard({
  config,
  theme,
  aspectRatio = 'story',
  width,
  height,
  backgroundImageUri,
}: IllustratedCardProps) {
  const palette = getPalette(theme);
  const dimensions = width && height ? { width, height } : CARD_DIMENSIONS[aspectRatio];
  const [gradientStart, gradientEnd] = getGradientColors(theme, config.gradientIndex || 0);

  const hasBackgroundImage = config.backgroundType === 'image' && backgroundImageUri;

  return (
    <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
      {hasBackgroundImage ? (
        <ImageBackground
          source={{ uri: backgroundImageUri }}
          style={styles.backgroundImage}
          imageStyle={{ resizeMode: 'cover' }}
        >
          <View style={styles.overlay} />
          {renderContent(config, dimensions, gradientStart, gradientEnd)}
        </ImageBackground>
      ) : (
        <Svg width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="50%" stopColor={gradientEnd} />
              <stop offset="100%" stopColor={gradientStart} />
            </LinearGradient>
            <LinearGradient id="overlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
            </LinearGradient>
            <LinearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
            </LinearGradient>
          </Defs>

          {/* Background gradient */}
          <Rect width={dimensions.width} height={dimensions.height} fill="url(#grad)" />

          {/* Overlay for text readability */}
          <Rect width={dimensions.width} height={dimensions.height} fill="url(#overlayGrad)" />

          {/* Decorative glow circle */}
          <Circle
            cx={dimensions.width * 0.8}
            cy={dimensions.height * 0.2}
            r={dimensions.width * 0.4}
            fill="url(#glow)"
          />

          {/* Decorative dots pattern */}
          <G opacity={0.1}>
            {[0, 1, 2, 3, 4].map(i => (
              <Circle
                key={`dot1-${i}`}
                cx={dimensions.width * 0.1}
                cy={dimensions.height * 0.15 + i * 30}
                r={3}
                fill="#FFFFFF"
              />
            ))}
            {[0, 1, 2, 3, 4].map(i => (
              <Circle
                key={`dot2-${i}`}
                cx={dimensions.width * 0.9}
                cy={dimensions.height * 0.7 + i * 30}
                r={3}
                fill="#FFFFFF"
              />
            ))}
          </G>

          {/* Title */}
          <SvgText
            x={dimensions.width / 2}
            y={dimensions.height * 0.32}
            fontSize={dimensions.width * 0.065}
            fill="#FFFFFF"
            textAnchor="middle"
            fontFamily="System"
            fontWeight="700"
            letterSpacing={1.5}
          >
            {config.title.length > 28 ? config.title.substring(0, 28) + '...' : config.title}
          </SvgText>

          {/* Decorative line */}
          <Rect
            x={dimensions.width * 0.35}
            y={dimensions.height * 0.38}
            width={dimensions.width * 0.3}
            height={2}
            fill="rgba(255,255,255,0.6)"
          />

          {/* Quote/text */}
          {config.quote && (
            <SvgText
              x={dimensions.width / 2}
              y={dimensions.height * 0.48}
              fontSize={dimensions.width * 0.04}
              fill="#FFFFFF"
              textAnchor="middle"
              fontFamily="System"
              fontWeight="500"
              lineHeight={dimensions.width * 0.055}
            >
              {config.quote}
            </SvgText>
          )}

          {/* Chapter badge */}
          {config.chapter && (
            <G>
              <Circle
                cx={dimensions.width / 2}
                cy={dimensions.height * 0.62}
                r={dimensions.width * 0.08}
                fill="rgba(255,255,255,0.2)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={2}
              />
              <SvgText
                x={dimensions.width / 2}
                y={dimensions.height * 0.62 + dimensions.width * 0.025}
                fontSize={dimensions.width * 0.035}
                fill="#FFFFFF"
                textAnchor="middle"
                fontFamily="System"
                fontWeight="700"
              >
                Ch. {config.chapter}
              </SvgText>
            </G>
          )}

          {/* "A Love Story" subtitle */}
          <SvgText
            x={dimensions.width / 2}
            y={dimensions.height * 0.75}
            fontSize={dimensions.width * 0.032}
            fill="rgba(255,255,255,0.7)"
            textAnchor="middle"
            fontFamily="System"
            fontWeight="500"
            letterSpacing={4}
          >
            A LOVE STORY
          </SvgText>

          {/* Decorative heart */}
          <SvgText
            x={dimensions.width / 2}
            y={dimensions.height * 0.82}
            fontSize={dimensions.width * 0.06}
            fill="#FFFFFF"
            textAnchor="middle"
            opacity={0.8}
          >
            ❤
          </SvgText>

          {/* Branding footer */}
          {config.showBranding && (
            <G>
              <Rect
                x={0}
                y={dimensions.height - dimensions.height * 0.08}
                width={dimensions.width}
                height={dimensions.height * 0.08}
                fill="rgba(0,0,0,0.3)"
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
      )}
    </View>
  );
}

function renderContent(
  config: IllustratedCardConfig,
  dimensions: { width: number; height: number },
  gradientStart: string,
  gradientEnd: string
) {
  return (
    <Svg width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
      <Defs>
        <LinearGradient id="overlayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.3)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
        </LinearGradient>
      </Defs>

      <Rect width={dimensions.width} height={dimensions.height} fill="url(#overlayGrad)" />

      <SvgText
        x={dimensions.width / 2}
        y={dimensions.height * 0.32}
        fontSize={dimensions.width * 0.065}
        fill="#FFFFFF"
        textAnchor="middle"
        fontFamily="System"
        fontWeight="700"
        letterSpacing={1.5}
      >
        {config.title.length > 28 ? config.title.substring(0, 28) + '...' : config.title}
      </SvgText>

      <Rect
        x={dimensions.width * 0.35}
        y={dimensions.height * 0.38}
        width={dimensions.width * 0.3}
        height={2}
        fill="rgba(255,255,255,0.6)"
      />

      {config.quote && (
        <SvgText
          x={dimensions.width / 2}
          y={dimensions.height * 0.48}
          fontSize={dimensions.width * 0.04}
          fill="#FFFFFF"
          textAnchor="middle"
          fontFamily="System"
          fontWeight="500"
        >
          {config.quote}
        </SvgText>
      )}

      {config.chapter && (
        <G>
          <Circle
            cx={dimensions.width / 2}
            cy={dimensions.height * 0.62}
            r={dimensions.width * 0.08}
            fill="rgba(255,255,255,0.2)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={2}
          />
          <SvgText
            x={dimensions.width / 2}
            y={dimensions.height * 0.62 + dimensions.width * 0.025}
            fontSize={dimensions.width * 0.035}
            fill="#FFFFFF"
            textAnchor="middle"
            fontFamily="System"
            fontWeight="700"
          >
            Ch. {config.chapter}
          </SvgText>
        </G>
      )}

      <SvgText
        x={dimensions.width / 2}
        y={dimensions.height * 0.75}
        fontSize={dimensions.width * 0.032}
        fill="rgba(255,255,255,0.7)"
        textAnchor="middle"
        fontFamily="System"
        fontWeight="500"
        letterSpacing={4}
      >
        A LOVE STORY
      </SvgText>

      {config.showBranding && (
        <G>
          <Rect
            x={0}
            y={dimensions.height - dimensions.height * 0.08}
            width={dimensions.width}
            height={dimensions.height * 0.08}
            fill="rgba(0,0,0,0.3)"
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
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
