import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Svg, Rect, Defs, LinearGradient, G, Circle, Text as SvgText, Line } from 'react-native-svg';
import { MilestoneCardConfig, getGradientColors, getPalette, CARD_DIMENSIONS } from '../lib/cardGenerator';

interface MilestoneCardProps {
  config: MilestoneCardConfig;
  aspectRatio?: 'story' | 'square' | 'portrait';
  width?: number;
  height?: number;
}

export function MilestoneCard({
  config,
  aspectRatio = 'story',
  width,
  height,
}: MilestoneCardProps) {
  const palette = getPalette(config.theme);
  const dimensions = width && height ? { width, height } : CARD_DIMENSIONS[aspectRatio];
  const [gradientStart, gradientEnd] = getGradientColors(config.theme, config.gradientIndex || 0);

  const padding = dimensions.width * 0.1;
  const centerY = dimensions.height * 0.42;
  const circleRadius = dimensions.width * 0.22;

  return (
    <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
      <Svg width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </LinearGradient>
          <LinearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect width={dimensions.width} height={dimensions.height} fill="url(#grad)" />

        {/* Decorative circles */}
        <Circle
          cx={dimensions.width * 0.1}
          cy={dimensions.height * 0.15}
          r={dimensions.width * 0.15}
          fill="rgba(255,255,255,0.05)"
        />
        <Circle
          cx={dimensions.width * 0.9}
          cy={dimensions.height * 0.85}
          r={dimensions.width * 0.2}
          fill="rgba(255,255,255,0.05)"
        />

        {/* Title */}
        <SvgText
          x={dimensions.width / 2}
          y={dimensions.height * 0.18}
          fontSize={dimensions.width * 0.06}
          fill="#FFFFFF"
          textAnchor="middle"
          fontFamily="System"
          fontWeight="700"
          letterSpacing={1}
        >
          {config.title.length > 25 ? config.title.substring(0, 25) + '...' : config.title}
        </SvgText>

        {/* "Our Journey" subtitle */}
        <SvgText
          x={dimensions.width / 2}
          y={dimensions.height * 0.24}
          fontSize={dimensions.width * 0.03}
          fill="rgba(255,255,255,0.7)"
          textAnchor="middle"
          fontFamily="System"
          fontWeight="500"
          letterSpacing={3}
        >
          OUR JOURNEY
        </SvgText>

        {/* Main circle */}
        <Circle
          cx={dimensions.width / 2}
          cy={centerY}
          r={circleRadius}
          fill="url(#circleGrad)"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={2}
        />

        {/* Chapter count */}
        <SvgText
          x={dimensions.width / 2}
          y={centerY + dimensions.width * 0.08}
          fontSize={dimensions.width * 0.18}
          fill="#FFFFFF"
          textAnchor="middle"
          fontFamily="System"
          fontWeight="700"
        >
          {config.chapterCount}
        </SvgText>

        {/* "Chapters" label */}
        <SvgText
          x={dimensions.width / 2}
          y={centerY + dimensions.width * 0.16}
          fontSize={dimensions.width * 0.035}
          fill="rgba(255,255,255,0.9)"
          textAnchor="middle"
          fontFamily="System"
          fontWeight="600"
          letterSpacing={2}
        >
          CHAPTERS
        </SvgText>

        {/* Days together indicator */}
        {config.daysTogether !== undefined && config.daysTogether > 0 && (
          <G>
            <Line
              x1={padding}
              y1={dimensions.height * 0.68}
              x2={dimensions.width - padding}
              y2={dimensions.height * 0.68}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
            />

            <SvgText
              x={dimensions.width / 2}
              y={dimensions.height * 0.74}
              fontSize={dimensions.width * 0.055}
              fill="#FFFFFF"
              textAnchor="middle"
              fontFamily="System"
              fontWeight="600"
            >
              {config.daysTogether} Days Together
            </SvgText>

            {config.startDate && (
              <SvgText
                x={dimensions.width / 2}
                y={dimensions.height * 0.79}
                fontSize={dimensions.width * 0.028}
                fill="rgba(255,255,255,0.7)"
                textAnchor="middle"
                fontFamily="System"
                fontWeight="400"
              >
                Since {config.startDate}
              </SvgText>
            )}
          </G>
        )}

        {/* Heart icon */}
        <G transform={`translate(${dimensions.width / 2 - 20}, ${dimensions.height * 0.58})`}>
          <SvgText
            x={20}
            y={20}
            fontSize={30}
            fill="rgba(255,255,255,0.4)"
            textAnchor="middle"
          >
            ❤️
          </SvgText>
        </G>

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
