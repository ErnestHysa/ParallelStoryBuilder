'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Video, Music, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaAttachment } from '@/types';

interface MediaPickerProps {
  onMediaSelect: (media: MediaAttachment[]) => void;
  selectedMedia?: MediaAttachment[];
  onRemove?: (id: string) => void;
  maxFiles?: number;
  accept?: 'image' | 'video' | 'audio' | 'all';
}

const acceptTypes = {
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  all: 'image/*,video/*,audio/*',
};

const mediaIcons = {
  image: ImageIcon,
  video: Video,
  audio: Music,
};

export function MediaPicker({
  onMediaSelect,
  selectedMedia = [],
  onRemove,
  maxFiles = 3,
  accept = 'all',
}: MediaPickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const mediaArray = Array.from(files).slice(0, maxFiles - selectedMedia.length);

    const newMedia: MediaAttachment[] = mediaArray.map((file) => {
      const type = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'audio';

      return {
        id: `${Date.now()}-${Math.random()}`,
        type,
        url: URL.createObjectURL(file),
        title: file.name,
      };
    });

    onMediaSelect([...selectedMedia, ...newMedia]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    const updated = selectedMedia.filter((m) => m.id !== id);
    onMediaSelect(updated);
    onRemove?.(id);
  };

  const canAddMore = selectedMedia.length < maxFiles;

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
            isDragging
              ? "border-rose-400 bg-rose-50 dark:bg-rose-950/20"
              : "border-cream-300 dark:border-dark-border hover:border-rose-300 dark:hover:border-rose-700 bg-cream-50 dark:bg-dark-bgTertiary"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes[accept]}
            multiple={maxFiles > 1}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-cream-200 dark:bg-dark-bgSecondary flex items-center justify-center">
              <Upload className="w-6 h-6 text-ink-500 dark:text-dark-textSecondary" />
            </div>
            <p className="font-accent font-medium text-ink-700 dark:text-dark-text">
              {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-ink-500 dark:text-dark-textMuted">
              {maxFiles > 1
                ? `Up to ${maxFiles} files (images, videos, audio)`
                : '1 file (image, video, or audio)'}
            </p>
          </div>
        </div>
      )}

      {/* Selected Media */}
      <AnimatePresence>
        {selectedMedia.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedMedia.map((media) => {
              const Icon = mediaIcons[media.type];
              return (
                <motion.div
                  key={media.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-dark-bgSecondary border border-cream-200 dark:border-dark-border rounded-full"
                >
                  <Icon className="w-4 h-4 text-ink-500 dark:text-dark-textSecondary" />
                  <span className="text-sm text-ink-700 dark:text-dark-text truncate max-w-[150px]">
                    {media.title || `Media ${media.type}`}
                  </span>
                  <button
                    onClick={() => handleRemove(media.id)}
                    className="p-1 hover:bg-cream-100 dark:hover:bg-dark-bgTertiary rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-ink-400 dark:text-dark-textMuted" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
