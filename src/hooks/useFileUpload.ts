/**
 * File Upload Hook
 * Custom React hook for file upload and processing
 */

'use client';

import { useState, useCallback } from 'react';
import {
  FileProcessingResult,
  ProcessingOptions,
  UploadProgress,
} from '@/types/files';
import { uploadFile } from '@/lib/files/storage-service';
import { processFile } from '@/lib/files/processor';
import { getFileSearchEngine } from '@/lib/files/search-engine';
import { useAuth } from '@/hooks/useAuth';

export interface UseFileUploadOptions {
  processingOptions?: ProcessingOptions;
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: FileProcessingResult) => void;
  onError?: (error: Error) => void;
}

export interface UseFileUploadReturn {
  uploadAndProcess: (file: File, options?: UseFileUploadOptions) => Promise<FileProcessingResult>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const uploadAndProcess = useCallback(
    async (file: File, options: UseFileUploadOptions = {}): Promise<FileProcessingResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const userId = user?.id || 'anonymous';

        // Phase 1: Upload to storage (0-40%)
        options.onProgress?.({
          progress: 0,
          status: 'uploading',
        });

        const storageResult = await uploadFile(file);

        setProgress(40);
        options.onProgress?.({
          progress: 40,
          status: 'uploading',
        });

        // Phase 2: Process file (40-90%)
        options.onProgress?.({
          progress: 40,
          status: 'processing',
        });

        const processingResult = await processFile(
          file,
          userId,
          options.processingOptions
        );

        // Add storage URL to result
        processingResult.originalFile.storageUrl = storageResult.url;

        setProgress(90);
        options.onProgress?.({
          progress: 90,
          status: 'processing',
        });

        // Phase 3: Index for search (90-100%)
        const searchEngine = getFileSearchEngine();
        await searchEngine.indexFile(processingResult);

        setProgress(100);
        options.onProgress?.({
          progress: 100,
          status: 'completed',
        });

        // Store in database (via API)
        await fetch('/api/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(processingResult),
        });

        options.onComplete?.(processingResult);

        return processingResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [user]
  );

  return {
    uploadAndProcess,
    isUploading,
    progress,
    error,
  };
}

/**
 * Hook for batch file uploads
 */
export function useBatchFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [errors, setErrors] = useState<Array<{ file: string; error: Error }>>([]);
  const { user } = useAuth();

  const uploadFiles = useCallback(
    async (
      files: File[],
      options: ProcessingOptions = {}
    ): Promise<FileProcessingResult[]> => {
      setUploading(true);
      setCompleted(0);
      setTotal(files.length);
      setErrors([]);

      const results: FileProcessingResult[] = [];
      const uploadErrors: Array<{ file: string; error: Error }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          const userId = user?.id || 'anonymous';

          // Upload to storage
          const storageResult = await uploadFile(file);

          // Process file
          const processingResult = await processFile(file, userId, options);
          processingResult.originalFile.storageUrl = storageResult.url;

          // Index for search
          const searchEngine = getFileSearchEngine();
          await searchEngine.indexFile(processingResult);

          // Store in database
          await fetch('/api/files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(processingResult),
          });

          results.push(processingResult);
          setCompleted(i + 1);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Upload failed');
          uploadErrors.push({ file: file.name, error });
        }
      }

      setErrors(uploadErrors);
      setUploading(false);

      return results;
    },
    [user]
  );

  return {
    uploadFiles,
    uploading,
    completed,
    total,
    errors,
    progress: total > 0 ? (completed / total) * 100 : 0,
  };
}
