import React, { useEffect, useState, useMemo, useRef } from 'react';
import { StyleSheet, View, Image, ActivityIndicator, Dimensions, Platform } from 'react-native';

interface LazyImageProps {
  source: { uri: string };
  style?: any;
  width?: number;
  height?: number;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  placeholderColor?: string;
  fadeDuration?: number;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  blurHash?: string;
  priority?: 'low' | 'normal' | 'high';
}

const { width: screenWidth } = Dimensions.get('window');

// Simple theme colors instead of using @shopify/flash-list theme
const defaultTheme = {
  backgroundColor: '#f0f0f0',
  color: '#007AFF',
};

export const LazyImage: React.FC<LazyImageProps> = ({
  source,
  style,
  width,
  height,
  borderRadius = 8,
  resizeMode = 'cover',
  placeholderColor,
  fadeDuration = 300,
  onLoadStart,
  onLoadEnd,
  onError,
  blurHash,
  priority = 'normal',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<Image>(null);

  // Calculate dimensions if not provided
  const imageWidth = width || style?.width || (screenWidth * 0.8);
  const imageHeight = height || style?.height || 200;

  // Generate blur hash placeholder
  const blurHashPlaceholder = useMemo(() => {
    if (!blurHash) return null;

    // Simple blur hash placeholder implementation
    return (
      <View
        style={[
          styles.blurPlaceholder,
          {
            width: imageWidth,
            height: imageHeight,
            borderRadius,
            backgroundColor: placeholderColor || defaultTheme.backgroundColor,
          },
        ]}
      />
    );
  }, [blurHash, imageWidth, imageHeight, borderRadius, placeholderColor]);

  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    setImageLoaded(true);
    onLoadEnd?.();
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    setImageError(true);
    onError?.(error);
  };

  return (
    <View style={[styles.container, { borderRadius }]}>
      {!imageError && (
        <>
          {/* Placeholder */}
          {(isLoading || !imageLoaded) && (
            <View
              style={[
                styles.placeholder,
                {
                  width: imageWidth,
                  height: imageHeight,
                  borderRadius,
                  backgroundColor: placeholderColor || defaultTheme.backgroundColor,
                },
              ]}
            >
              {blurHashPlaceholder}
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color={defaultTheme.color}
                  style={styles.loader}
                />
              )}
            </View>
          )}

          {/* Actual Image */}
          <Image
            ref={imageRef}
            source={source}
            style={[
              styles.image,
              {
                width: imageWidth,
                height: imageHeight,
                borderRadius,
                opacity: imageLoaded ? 1 : 0,
                position: 'absolute',
                left: 0,
                top: 0,
              },
              style,
            ]}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoad}
            onError={handleError}
          />
        </>
      )}

      {/* Error fallback */}
      {imageError && (
        <View
          style={[
            styles.errorFallback,
            {
              width: imageWidth,
              height: imageHeight,
              borderRadius,
              backgroundColor: defaultTheme.backgroundColor,
            },
          ]}
        >
          <View style={styles.errorPlaceholder}>
            <Image
              source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABTSURBVFiF7ZaxDcAgDATDsJH7q6F6h0d4QO4g4ggOIcO2ec445w4QJ5DzTnHHMO2ec445w4QJ5DzTnHHMO2ec445w4QJ5DzTnHHMO2ec445w4QJ5DzTnHHMO2ed4D6T+AeW9L1kAAAAASUVORK5CYII=' }}
              style={[
                styles.placeholderImage,
                {
                  width: imageWidth / 2,
                  height: imageHeight / 2,
                  resizeMode: 'contain',
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurPlaceholder: {
    position: 'absolute',
    backgroundColor: '#e0e0e0',
  },
  loader: {
    position: 'absolute',
  },
  image: {
    backgroundColor: 'transparent',
  },
  errorFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    opacity: 0.3,
  },
});

// Image optimization wrapper
export interface OptimizedImageProps extends LazyImageProps {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'auto' | 'webp' | 'jpeg' | 'png';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  quality = 80,
  maxWidth,
  maxHeight,
  format = 'auto',
  ...props
}) => {
  // Generate optimized URI
  const optimizedSource = useMemo(() => {
    if (!source.uri) return source;

    try {
      const url = new URL(source.uri);
      const params = new URLSearchParams(url.search);

      // Add optimization parameters
      if (quality) params.set('q', quality.toString());
      if (maxWidth) params.set('w', maxWidth.toString());
      if (maxHeight) params.set('h', maxHeight.toString());

      // Format preference
      if (format !== 'auto') {
        params.set('fm', format);
      }

      url.search = params.toString();
      return { ...source, uri: url.toString() };
    } catch {
      // URL parsing failed, return original source
      return source;
    }
  }, [source, quality, maxWidth, maxHeight, format]);

  return <LazyImage {...props} source={optimizedSource} />;
};

// Predefined image sizes
export const ImageSizes = {
  thumbnail: { width: 100, height: 100 },
  small: { width: 200, height: 200 },
  medium: { width: 400, height: 400 },
  large: { width: 800, height: 800 },
  full: { width: undefined, height: undefined },
} as const;

// Hook for image preloading
export const useImagePreloader = () => {
  const preloadedImages = useRef<Set<string>>(new Set());

  const preload = async (sources: { uri: string }[]) => {
    return Promise.all(
      sources.map(({ uri }) => {
        if (preloadedImages.current.has(uri)) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
          Image.prefetch(uri).then(() => {
            preloadedImages.current.add(uri);
            resolve();
          }).catch(reject);
        });
      })
    );
  };

  const clear = () => {
    preloadedImages.current.clear();
  };

  return { preload, clear };
};
