// Card renderer for web - handles capturing and sharing

import { CardData, CARD_DIMENSIONS } from './cardGenerator';

export interface RenderOptions {
  quality?: number;
  format?: 'png' | 'jpeg';
  scale?: number;
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

// Download card to device
export async function downloadCard(
  blob: Blob,
  cardData: CardData,
  format: 'png' | 'jpeg' = 'png'
): Promise<ShareResult> {
  try {
    const fileName = generateFileName(cardData, format);
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);

    return { success: true, uri: url };
  } catch (error) {
    console.error('Error downloading card:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download card',
    };
  }
}

// Share card using Web Share API if available
export async function shareCard(
  blob: Blob,
  cardData: CardData,
  format: 'png' | 'jpeg' = 'png'
): Promise<ShareResult> {
  try {
    const fileName = generateFileName(cardData, format);
    const file = new File([blob], fileName, { type: `image/${format}` });

    // Check if Web Share API is available
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: cardData.story.title,
        text: `Our love story - ${cardData.config.style} card`,
      });
      return { success: true };
    }

    // Fall back to download
    return await downloadCard(blob, cardData, format);
  } catch (error) {
    // User might have cancelled the share
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: true };
    }

    console.error('Error sharing card:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share card',
    };
  }
}

// Convert canvas to blob
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      `image/${format}`,
      quality
    );
  });
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

// Calculate estimated file size
export function estimateFileSize(
  width: number,
  height: number,
  format: 'png' | 'jpeg'
): number {
  const pixelCount = width * height;

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

// Check if Web Share API is supported
export function isWebShareSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'share' in navigator;
}

// Check if sharing files is supported
export function isFileSharingSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'canShare' in navigator;
}

// Card generation state for UI feedback
export interface CardGenerationState {
  isGenerating: boolean;
  progress: number;
  stage: 'rendering' | 'encoding' | 'downloading' | 'sharing' | 'complete' | 'error';
}

// Create initial generation state
export function createInitialState(): CardGenerationState {
  return {
    isGenerating: false,
    progress: 0,
    stage: 'rendering',
  };
}

// Copy image to clipboard
export async function copyToClipboard(blob: Blob): Promise<ShareResult> {
  try {
    if (navigator.clipboard && 'write' in navigator.clipboard) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return { success: true };
    }
    return {
      success: false,
      error: 'Clipboard API not supported in this browser',
    };
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy to clipboard',
    };
  }
}
