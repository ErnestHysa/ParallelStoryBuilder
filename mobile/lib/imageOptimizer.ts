import { Dimensions } from 'react-native';
import { Image as ImageAsset } from 'expo-image';

export interface OptimizedImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  cachePolicy?: 'memory' | 'disk' | 'none';
  blurHash?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

// Screen dimensions for optimization
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Predefined breakpoints
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Quality presets
export const QUALITY_PRESETS = {
  thumbnail: { quality: 50, format: 'webp' as const },
  low: { quality: 60, format: 'webp' as const },
  medium: { quality: 75, format: 'webp' as const },
  high: { quality: 85, format: 'jpeg' as const },
  original: { quality: 100, format: 'jpeg' as const },
} as const;

// Common aspect ratios
export const ASPECT_RATIOS = {
  square: 1,
  landscape: 16 / 9,
  portrait: 9 / 16,
  story: 9 / 16,
  cover: 4 / 3,
} as const;

/**
 * Calculate optimal dimensions based on device size and target size
 */
export function calculateOptimalDimensions(
  naturalWidth: number,
  naturalHeight: number,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    targetWidth?: number;
    targetHeight?: number;
    aspectRatio?: number;
    scale?: number;
  } = {}
): ImageDimensions {
  const {
    maxWidth = Infinity,
    maxHeight = Infinity,
    targetWidth,
    targetHeight,
    aspectRatio,
    scale = 1,
  } = options;

  // If target dimensions are provided, use them
  if (targetWidth && targetHeight) {
    return {
      width: targetWidth * scale,
      height: targetHeight * scale,
    };
  }

  // If aspect ratio is provided, calculate dimensions
  if (aspectRatio) {
    const calculatedWidth = Math.min(naturalWidth, maxWidth);
    const calculatedHeight = calculatedWidth / aspectRatio;

    if (calculatedHeight > maxHeight) {
      return {
        width: maxHeight * aspectRatio * scale,
        height: maxHeight * scale,
      };
    }

    return {
      width: calculatedWidth * scale,
      height: calculatedHeight * scale,
    };
  }

  // Scale down based on natural dimensions
  const scaledWidth = naturalWidth * scale;
  const scaledHeight = naturalHeight * scale;

  // Apply constraints
  const finalWidth = Math.min(scaledWidth, maxWidth);
  const finalHeight = Math.min(scaledHeight, maxHeight);

  return { width: finalWidth, height: finalHeight };
}

/**
 * Generate responsive image URL with optimization parameters
 */
export function generateOptimizedUrl(
  originalUrl: string,
  options: OptimizedImageOptions = {}
): string {
  if (!originalUrl) return originalUrl;

  const url = new URL(originalUrl);
  const params = new URLSearchParams(url.search);

  // Apply quality settings
  const quality = options.quality || 80;
  const format = options.format || 'webp';

  params.set('q', quality.toString());
  params.set('fm', format);

  // Apply dimensions if specified
  if (options.width) {
    params.set('w', options.width.toString());
  }
  if (options.height) {
    params.set('h', options.height.toString());
  }

  // Apply max dimensions
  if (options.maxWidth) {
    params.set('max-w', options.maxWidth.toString());
  }
  if (options.maxHeight) {
    params.set('max-h', options.maxHeight.toString());
  }

  // Apply cache policy
  if (options.cachePolicy === 'none') {
    params.set('cache', 'no');
  } else if (options.cachePolicy === 'disk') {
    params.set('cache', 'disk');
  }

  url.search = params.toString();
  return url.toString();
}

/**
 * Get optimal image dimensions for screen size
 */
export function getScreenOptimalDimensions(
  naturalWidth: number,
  naturalHeight: number,
  options: {
    breakpoint?: keyof typeof BREAKPOINTS;
    padding?: number;
    scale?: number;
  } = {}
): ImageDimensions {
  const { breakpoint = 'md', padding = 0, scale = 1 } = options;

  let maxWidth;
  switch (breakpoint) {
    case 'xs':
      maxWidth = BREAKPOINTS.xs - padding;
      break;
    case 'sm':
      maxWidth = BREAKPOINTS.sm - padding;
      break;
    case 'md':
      maxWidth = BREAKPOINTS.md - padding;
      break;
    case 'lg':
      maxWidth = BREAKPOINTS.lg - padding;
      break;
    case 'xl':
      maxWidth = BREAKPOINTS.xl - padding;
      break;
    default:
      maxWidth = screenWidth - padding;
  }

  return calculateOptimalDimensions(naturalWidth, naturalHeight, {
    maxWidth,
    scale,
  });
}

/**
 * Create thumbnail from image URI
 */
export async function createThumbnail(
  imageUri: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}
): Promise<string> {
  const {
    width = 100,
    height = 100,
    quality = 60,
    format = 'webp',
  } = options;

  try {
    // Using Expo Image for optimization
    const result = await ImageAsset.createThumbnailAsync(imageUri, {
      width,
      height,
      quality,
      format,
      compress: 0.5,
    });

    return result.uri;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return imageUri;
  }
}

/**
 * Batch optimize multiple images
 */
export async function batchOptimizeImages(
  imageUris: string[],
  options: OptimizedImageOptions = {}
): Promise<string[]> {
  const optimizedUris = await Promise.all(
    imageUris.map(uri => generateOptimizedUrl(uri, options))
  );

  return optimizedUris;
}

/**
 * Convert image to WebP format
 */
export async function convertToWebP(
  imageUri: string,
  quality: number = 80
): Promise<string> {
  return generateOptimizedUrl(imageUri, {
    format: 'webp',
    quality,
  });
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imageUri: string): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  // In a real implementation, you would use a library to get image metadata
  // This is a simplified version
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        format: 'unknown',
        size: 0,
      });
    };
    img.onerror = () => {
      resolve({
        width: 0,
        height: 0,
        format: 'unknown',
        size: 0,
      });
    };
    img.src = imageUri;
  });
}

/**
 * Smart image loader with progressive loading
 */
export function useSmartImageLoader() {
  const loadingImages = new Set<string>();
  const loadedImages = new Set<string>();

  const preloadImage = async (uri: string): Promise<void> => {
    if (loadedImages.has(uri) || loadingImages.has(uri)) {
      return;
    }

    loadingImages.add(uri);

    try {
      // Load image at low resolution first
      const lowResUri = generateOptimizedUrl(uri, {
        width: 50,
        height: 50,
        quality: 20,
      });

      // Load low res image
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.src = lowResUri;
      });

      // Then load full resolution
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.src = uri;
      });

      loadedImages.add(uri);
    } catch (error) {
      console.error('Error preloading image:', error);
    } finally {
      loadingImages.delete(uri);
    }
  };

  const preloadImages = async (uris: string[]): Promise<void> => {
    await Promise.all(uris.map(uri => preloadImage(uri)));
  };

  return { preloadImage, preloadImages };
}

/**
 * Image utility for different use cases
 */
export const ImageUtils = {
  // Social media optimization
  forSocial: (uri: string, platform: 'instagram' | 'twitter' | 'facebook') => {
    const sizes = {
      instagram: { width: 1080, height: 1080 },
      twitter: { width: 1200, height: 675 },
      facebook: { width: 1200, height: 630 },
    };

    return generateOptimizedUrl(uri, {
      width: sizes[platform].width,
      height: sizes[platform].height,
      quality: 85,
      format: 'jpeg',
    });
  },

  // Avatar optimization
  forAvatar: (uri: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizes = {
      small: 40,
      medium: 80,
      large: 160,
    };

    return generateOptimizedUrl(uri, {
      width: sizes[size],
      height: sizes[size],
      format: 'webp',
      quality: 70,
    });
  },

  // Cover image optimization
  forCover: (uri: string, aspectRatio: number = 2) => {
    const width = screenWidth;
    const height = width / aspectRatio;

    return generateOptimizedUrl(uri, {
      width,
      height,
      quality: 80,
      format: 'webp',
    });
  },

  // Gallery optimization
  forGallery: (uri: string, columns: number = 2) => {
    const width = (screenWidth - 48) / columns; // 48px total padding

    return generateOptimizedUrl(uri, {
      width,
      height: width,
      quality: 75,
      format: 'webp',
    });
  },

  // Story optimization
  forStory: (uri: string) => {
    return generateOptimizedUrl(uri, {
      width: screenWidth,
      height: screenHeight,
      quality: 85,
      format: 'webp',
    });
  },
};

// Cache for optimized images
export const optimizedImageCache = new Map<string, string>();

/**
 * Get cached optimized image URL
 */
export function getCachedOptimizedUrl(
  originalUrl: string,
  options: OptimizedImageOptions
): string {
  const cacheKey = `${originalUrl}:${JSON.stringify(options)}`;

  if (optimizedImageCache.has(cacheKey)) {
    return optimizedImageCache.get(cacheKey)!;
  }

  const optimizedUrl = generateOptimizedUrl(originalUrl, options);
  optimizedImageCache.set(cacheKey, optimizedUrl);

  return optimizedUrl;
}

/**
 * Clear image cache
 */
export function clearImageCache(): void {
  optimizedImageCache.clear();
}