import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { CardData, CARD_DIMENSIONS, getGradientColors } from './cardGenerator';

export interface RenderOptions {
  quality?: number;
  format?: 'png' | 'jpeg';
}

export interface ShareResult {
  success: boolean;
  uri?: string;
  error?: string;
}

// Generate filename for card
function generateFileName(cardData: CardData, format: 'png' | 'jpeg'): string {
  const timestamp = Date.now();
  const style = cardData.config.style;
  const title = cardData.story.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  return `${title}_${style}_${timestamp}.${format === 'jpeg' ? 'jpg' : 'png'}`;
}

// Save card to device
export async function saveCardToDevice(
  uri: string,
  cardData: CardData,
  format: 'png' | 'jpeg' = 'png'
): Promise<string> {
  const fileName = generateFileName(cardData, format);
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.copyAsync({
    from: uri,
    to: fileUri,
  });

  return fileUri;
}

// Share card
export async function shareCard(
  uri: string,
  cardData: CardData,
  format: 'png' | 'jpeg' = 'png'
): Promise<ShareResult> {
  try {
    // First save to device
    const fileUri = await saveCardToDevice(uri, cardData, format);

    // Check if sharing is available
    if (!(await Sharing.isAvailableAsync())) {
      return {
        success: false,
        error: 'Sharing is not available on this device',
      };
    }

    // Determine MIME type
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: `Share ${cardData.config.style} card`,
      UTI: format === 'jpeg' ? 'public.jpeg' : 'public.png',
    });

    return { success: true, uri: fileUri };
  } catch (error) {
    console.error('Error sharing card:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share card',
    };
  }
}

// Save card to gallery (requires media library permissions)
export async function saveCardToGallery(
  uri: string,
  cardData: CardData,
  format: 'png' | 'jpeg' = 'png'
): Promise<ShareResult> {
  try {
    const fileName = generateFileName(cardData, format);

    if (Platform.OS === 'ios') {
      // On iOS, save to camera roll
      // Note: This requires expo-media-library or similar
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({ from: uri, to: fileUri });
      return { success: true, uri: fileUri };
    } else {
      // On Android, copy to external storage
      const externalDir = FileSystem.externalDirectoryPath || FileSystem.documentDirectory;
      const fileUri = externalDir + '/' + fileName;
      await FileSystem.copyAsync({ from: uri, to: fileUri });
      return { success: true, uri: fileUri };
    }
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save to gallery',
    };
  }
}

// Clean up temporary files
export async function cleanupCardFiles(olderThanMs: number = 3600000): Promise<void> {
  try {
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) return;

    const files = await FileSystem.readDirectoryAsync(documentDir);
    const now = Date.now();

    for (const file of files) {
      if (file.includes('_quote_') || file.includes('_milestone_') || file.includes('_illustrated_')) {
        const fileUri = documentDir + file;
        const info = await FileSystem.getInfoAsync(fileUri);

        if (info.exists && info.modificationTime) {
          const age = now - info.modificationTime * 1000;
          if (age > olderThanMs) {
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up card files:', error);
  }
}

// Get card dimensions based on aspect ratio
export function getCardDimensions(aspectRatio: keyof typeof CARD_DIMENSIONS) {
  return CARD_DIMENSIONS[aspectRatio];
}

// Validate card data
export function validateCardData(cardData: CardData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!cardData.story?.title) {
    errors.push('Story title is required');
  }

  if (!cardData.chapters || cardData.chapters.length === 0) {
    errors.push('At least one chapter is required');
  }

  if (cardData.config.style === 'quote') {
    const quoteConfig = cardData.config;
    if (!quoteConfig.quote || quoteConfig.quote.length < 10) {
      errors.push('Quote must be at least 10 characters long');
    }
  }

  if (cardData.config.style === 'milestone') {
    const milestoneConfig = cardData.config;
    if (typeof milestoneConfig.chapterCount !== 'number') {
      errors.push('Chapter count is required for milestone cards');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export card as base64 for web preview
export async function cardToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error converting to base64:', error);
    throw error;
  }
}

// Calculate estimated file size
export function estimateFileSize(
  width: number,
  height: number,
  format: 'png' | 'jpeg'
): number {
  const pixelCount = width * height;

  // PNG is roughly 3-4 bytes per pixel depending on compression
  // JPEG is roughly 0.5-1 byte per pixel depending on quality
  if (format === 'png') {
    return Math.round(pixelCount * 3.5);
  } else {
    return Math.round(pixelCount * 0.75);
  }
}

// Get formatted file size
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Card generation state for UI feedback
export interface CardGenerationState {
  isGenerating: boolean;
  progress: number;
  stage: 'rendering' | 'encoding' | 'saving' | 'sharing' | 'complete' | 'error';
}

// Create initial generation state
export function createInitialState(): CardGenerationState {
  return {
    isGenerating: false,
    progress: 0,
    stage: 'rendering',
  };
}
