import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';

// Supabase configuration - replace with your actual configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MediaUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  compress?: boolean;
}

interface UploadResult {
  url: string;
  publicUrl: string;
  path: string;
  size: number;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
  };
}

export class MediaStorage {
  private static instance: MediaStorage;

  static getInstance(): MediaStorage {
    if (!MediaStorage.instance) {
      MediaStorage.instance = new MediaStorage();
    }
    return MediaStorage.instance;
  }

  /**
   * Upload an image to Supabase Storage with compression
   */
  async uploadImageToStorage(
    imageUri: string,
    options: MediaUploadOptions = {}
  ): Promise<UploadResult> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      compress = true,
    } = options;

    try {
      // Generate a unique filename
      const filename = this.generateFilename('image');
      const filePath = `images/${filename}`;

      let processedUri = imageUri;

      // Compress image if requested
      if (compress) {
        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            { resize: { width: maxWidth, height: maxHeight } },
          ],
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );
        processedUri = manipResult.uri;
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(processedUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(processedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Generate public URL
      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Get image dimensions
      let dimensions;
      if (!compress || options.maxWidth || options.maxHeight) {
        const { width, height } = await this.getImageDimensions(processedUri);
        dimensions = { width, height };
      }

      return {
        url: data.path,
        publicUrl: publicUrlData.publicUrl,
        path: filePath,
        size: fileInfo.size,
        metadata: {
          ...dimensions,
          format: 'jpeg',
        },
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Upload an audio file to Supabase Storage
   */
  async uploadAudioToStorage(
    audioUri: string,
    duration: number = 0
  ): Promise<UploadResult> {
    try {
      // Generate a unique filename
      const filename = this.generateFilename('audio');
      const filePath = `audio/${filename}`;

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, decode(base64), {
          contentType: 'audio/mpeg',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Generate public URL
      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return {
        url: data.path,
        publicUrl: publicUrlData.publicUrl,
        path: filePath,
        size: fileInfo.size,
        metadata: {
          duration,
          format: 'mp3',
        },
      };
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }

  /**
   * Upload a video file to Supabase Storage
   */
  async uploadVideoToStorage(
    videoUri: string,
    options: MediaUploadOptions = {}
  ): Promise<UploadResult> {
    const {
      maxWidth = 1280,
      maxHeight = 720,
      quality = 0.8,
    } = options;

    try {
      // Generate a unique filename
      const filename = this.generateFilename('video');
      const filePath = `videos/${filename}`;

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Note: Video compression would typically require a dedicated video processing service
      // For now, we'll just upload the original file
      const base64 = await FileSystem.readAsStringAsync(videoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, decode(base64), {
          contentType: 'video/mp4',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Generate public URL
      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return {
        url: data.path,
        publicUrl: publicUrlData.publicUrl,
        path: filePath,
        size: fileInfo.size,
        metadata: {
          format: 'mp4',
        },
      };
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('media')
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Generate a thumbnail for an image
   */
  async generateThumbnail(
    imageUri: string,
    size: number = 200
  ): Promise<UploadResult> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: size, height: size } },
          { crop: { originX: 0, originY: 0, width: size, height: size } },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      // Upload thumbnail
      const filename = `thumb_${this.generateFilename('image')}`;
      const filePath = `thumbnails/${filename}`;

      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw new Error(`Thumbnail upload failed: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return {
        url: data.path,
        publicUrl: publicUrlData.publicUrl,
        path: filePath,
        size: manipResult.size || 0,
        metadata: {
          width: size,
          height: size,
          format: 'jpeg',
        },
      };
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  /**
   * Get file metadata from Supabase Storage
   */
  async getFileMetadata(filePath: string): Promise<any> {
    try {
      const { data, error } = await supabase.storage
        .from('media')
        .list(filePath.split('/').slice(0, -1).join('/'), {
          limit: 1,
          offset: 0,
        });

      if (error) {
        throw new Error(`Metadata fetch failed: ${error.message}`);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      throw error;
    }
  }

  /**
   * Compress an image locally
   */
  async compressImage(
    imageUri: string,
    options: MediaUploadOptions = {}
  ): Promise<string> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
    } = options;

    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: maxWidth, height: maxHeight } },
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return manipResult.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return imageUri; // Return original if compression fails
    }
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(imageUri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve({
          width: image.width,
          height: image.height,
        });
      };
      image.onerror = () => {
        // Fallback to getting info from file system
        FileSystem.getInfoAsync(imageUri).then(info => {
          // Rough estimate based on file size
          const estimatedSize = info.size;
          const aspectRatio = 16 / 9; // Default aspect ratio
          const pixels = estimatedSize / 3; // Rough estimate of pixels per byte
          const width = Math.sqrt(pixels * aspectRatio);
          const height = pixels / width;
          resolve({
            width: Math.round(width),
            height: Math.round(height),
          });
        });
      };
      image.src = imageUri;
    });
  }

  /**
   * Generate a unique filename with timestamp
   */
  private generateFilename(type: 'image' | 'audio' | 'video'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = type === 'image' ? 'jpg' : type === 'audio' ? 'mp3' : 'mp4';
    return `${type}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * List files in a storage path
   */
  async listFiles(path: string, options: {
    limit?: number;
    offset?: number;
    sortBy?: {
      column: 'name' | 'created_at' | 'size';
      order: 'asc' | 'desc';
    };
  } = {}): Promise<any[]> {
    const { limit = 100, offset = 0, sortBy } = options;

    try {
      let query = supabase.storage
        .from('media')
        .list(path, { limit, offset });

      if (sortBy) {
        // Note: Supabase Storage list doesn't support sorting directly
        // You would need to fetch all files and sort them manually
        // or use a database table to track file metadata
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`List files failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }
}

// Convenience functions
export const uploadImageToStorage = async (
  imageUri: string,
  options?: MediaUploadOptions
): Promise<UploadResult> => {
  return MediaStorage.getInstance().uploadImageToStorage(imageUri, options);
};

export const uploadAudioToStorage = async (
  audioUri: string,
  duration?: number
): Promise<UploadResult> => {
  return MediaStorage.getInstance().uploadAudioToStorage(audioUri, duration);
};

export const uploadVideoToStorage = async (
  videoUri: string,
  options?: MediaUploadOptions
): Promise<UploadResult> => {
  return MediaStorage.getInstance().uploadVideoToStorage(videoUri, options);
};

export const deleteFileFromStorage = async (filePath: string): Promise<void> => {
  return MediaStorage.getInstance().deleteFile(filePath);
};

export const generateThumbnail = async (
  imageUri: string,
  size?: number
): Promise<UploadResult> => {
  return MediaStorage.getInstance().generateThumbnail(imageUri, size);
};

export const compressImage = async (
  imageUri: string,
  options?: MediaUploadOptions
): Promise<string> => {
  return MediaStorage.getInstance().compressImage(imageUri, options);
};