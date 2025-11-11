/**
 * File Management Utilities
 * Helper functions for file operations
 */

import { FileProcessingResult, FileCategory, SUPPORTED_FILE_TYPES } from '@/types/files';

/**
 * Get file icon based on category
 */
export function getFileIcon(category: FileCategory): string {
  const icons: Record<FileCategory, string> = {
    document: '📄',
    spreadsheet: '📊',
    presentation: '📽️',
    image: '🖼️',
    audio: '🎵',
    video: '🎬',
    code: '💻',
    data: '📋',
    design: '🎨',
    archive: '📦',
    other: '📁',
  };

  return icons[category] || icons.other;
}

/**
 * Get file color based on extension
 */
export function getFileColor(extension: string): string {
  const colors: Record<string, string> = {
    // Documents
    pdf: 'red',
    doc: 'blue',
    docx: 'blue',
    txt: 'gray',
    md: 'purple',

    // Images
    jpg: 'green',
    jpeg: 'green',
    png: 'green',
    gif: 'green',
    svg: 'orange',

    // Code
    js: 'yellow',
    ts: 'blue',
    py: 'blue',
    java: 'red',
    cpp: 'blue',

    // Data
    json: 'purple',
    xml: 'orange',
    csv: 'green',

    // Media
    mp3: 'pink',
    mp4: 'purple',
  };

  return colors[extension] || 'gray';
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    acceptedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSize || 500 * 1024 * 1024; // 500MB
  const acceptedTypes = options.acceptedTypes || Object.keys(SUPPORTED_FILE_TYPES);

  // Check size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${Math.round(maxSize / (1024 * 1024))}MB`,
    };
  }

  // Check empty file
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  // Check type
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !acceptedTypes.includes(extension)) {
    return {
      valid: false,
      error: `File type .${extension} is not supported`,
    };
  }

  return { valid: true };
}

/**
 * Group files by category
 */
export function groupFilesByCategory(files: FileProcessingResult[]): Record<FileCategory, FileProcessingResult[]> {
  const groups: Record<FileCategory, FileProcessingResult[]> = {
    document: [],
    spreadsheet: [],
    presentation: [],
    image: [],
    audio: [],
    video: [],
    code: [],
    data: [],
    design: [],
    archive: [],
    other: [],
  };

  for (const file of files) {
    const category = file.originalFile.category || 'other';
    groups[category].push(file);
  }

  return groups;
}

/**
 * Sort files by various criteria
 */
export function sortFiles(
  files: FileProcessingResult[],
  sortBy: 'name' | 'size' | 'date' | 'type',
  order: 'asc' | 'desc' = 'asc'
): FileProcessingResult[] {
  const sorted = [...files];

  sorted.sort((a, b) => {
    let compareA: any;
    let compareB: any;

    switch (sortBy) {
      case 'name':
        compareA = a.originalFile.name.toLowerCase();
        compareB = b.originalFile.name.toLowerCase();
        break;
      case 'size':
        compareA = a.originalFile.size;
        compareB = b.originalFile.size;
        break;
      case 'date':
        compareA = a.createdAt.getTime();
        compareB = b.createdAt.getTime();
        break;
      case 'type':
        compareA = a.originalFile.extension || '';
        compareB = b.originalFile.extension || '';
        break;
      default:
        return 0;
    }

    if (compareA < compareB) {
      return order === 'asc' ? -1 : 1;
    }
    if (compareA > compareB) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return sorted;
}

/**
 * Filter files by search query
 */
export function filterFilesByQuery(
  files: FileProcessingResult[],
  query: string
): FileProcessingResult[] {
  const lowerQuery = query.toLowerCase();

  return files.filter(file => {
    // Search in filename
    if (file.originalFile.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in text content
    if (file.processedData.textContent?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in extension
    if (file.originalFile.extension?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in category
    if (file.originalFile.category?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    return false;
  });
}

/**
 * Calculate total size of files
 */
export function calculateTotalSize(files: FileProcessingResult[]): number {
  return files.reduce((total, file) => total + file.originalFile.size, 0);
}

/**
 * Get file statistics
 */
export function getFileStatistics(files: FileProcessingResult[]) {
  const stats = {
    total: files.length,
    totalSize: calculateTotalSize(files),
    byCategory: {} as Record<FileCategory, number>,
    byExtension: {} as Record<string, number>,
    averageSize: 0,
    largestFile: null as FileProcessingResult | null,
    smallestFile: null as FileProcessingResult | null,
  };

  // Count by category
  for (const file of files) {
    const category = file.originalFile.category || 'other';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

    const extension = file.originalFile.extension || 'unknown';
    stats.byExtension[extension] = (stats.byExtension[extension] || 0) + 1;
  }

  // Calculate average size
  stats.averageSize = files.length > 0 ? stats.totalSize / files.length : 0;

  // Find largest and smallest files
  if (files.length > 0) {
    stats.largestFile = files.reduce((largest, file) =>
      file.originalFile.size > largest.originalFile.size ? file : largest
    );

    stats.smallestFile = files.reduce((smallest, file) =>
      file.originalFile.size < smallest.originalFile.size ? file : smallest
    );
  }

  return stats;
}

/**
 * Extract file name without extension
 */
export function getFileNameWithoutExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return fileName;
  return fileName.substring(0, lastDotIndex);
}

/**
 * Generate safe file name
 */
export function generateSafeFileName(fileName: string): string {
  // Remove special characters and spaces
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Check if file is image
 */
export function isImageFile(file: FileProcessingResult): boolean {
  return file.originalFile.category === 'image';
}

/**
 * Check if file is video
 */
export function isVideoFile(file: FileProcessingResult): boolean {
  return file.originalFile.category === 'video';
}

/**
 * Check if file is audio
 */
export function isAudioFile(file: FileProcessingResult): boolean {
  return file.originalFile.category === 'audio';
}

/**
 * Check if file is document
 */
export function isDocumentFile(file: FileProcessingResult): boolean {
  return (
    file.originalFile.category === 'document' ||
    file.originalFile.category === 'spreadsheet' ||
    file.originalFile.category === 'presentation'
  );
}

/**
 * Check if file is code
 */
export function isCodeFile(file: FileProcessingResult): boolean {
  return file.originalFile.category === 'code';
}

/**
 * Get file preview URL
 */
export function getFilePreviewUrl(file: FileProcessingResult): string | null {
  if (file.preview.type === 'image') {
    return file.preview.content;
  }

  if (file.preview.thumbnail) {
    return file.preview.thumbnail;
  }

  if (file.originalFile.thumbnailUrl) {
    return file.originalFile.thumbnailUrl;
  }

  return null;
}

/**
 * Calculate file processing progress
 */
export function calculateProgress(
  current: number,
  total: number
): { percentage: number; remaining: number } {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const remaining = total - current;

  return {
    percentage: Math.min(100, Math.max(0, percentage)),
    remaining: Math.max(0, remaining),
  };
}

/**
 * Estimate processing time
 */
export function estimateProcessingTime(fileSize: number): number {
  // Rough estimate: 1MB = 1 second
  const sizeInMB = fileSize / (1024 * 1024);
  return Math.ceil(sizeInMB * 1000); // milliseconds
}

/**
 * Format processing time
 */
export function formatProcessingTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get file age in human-readable format
 */
export function getFileAge(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
