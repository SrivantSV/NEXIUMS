/**
 * File Upload Component
 * Drag-and-drop file upload with progress tracking
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, File as FileIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  FileProcessingResult,
  UploadProgress,
  ProcessingOptions,
  SUPPORTED_FILE_TYPES,
  formatFileSize,
  getFileExtension,
} from '@/types/files';
import { useFileUpload } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

export interface FileUploadProps {
  onUpload?: (result: FileProcessingResult) => void;
  onUploadComplete?: (results: FileProcessingResult[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  processingOptions?: ProcessingOptions;
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
}

interface FileUploadItem {
  id: string;
  file: File;
  progress: UploadProgress;
  result?: FileProcessingResult;
}

export function FileUpload({
  onUpload,
  onUploadComplete,
  maxFiles = 10,
  maxSize = 500 * 1024 * 1024, // 500MB
  acceptedTypes = Object.keys(SUPPORTED_FILE_TYPES),
  processingOptions = {},
  className,
  multiple = true,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAndProcess } = useFileUpload();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        handleFiles(selectedFiles);
      }
    },
    []
  );

  const handleFiles = async (newFiles: File[]) => {
    // Validate file count
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];

    for (const file of newFiles) {
      // Check size
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" is too large (max ${formatFileSize(maxSize)})`);
        continue;
      }

      // Check type
      const extension = getFileExtension(file.name);
      if (!extension || !acceptedTypes.includes(extension)) {
        toast.error(`File type .${extension} is not supported`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create upload items
    const uploadItems: FileUploadItem[] = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: {
        progress: 0,
        status: 'uploading',
      },
    }));

    setFiles(prev => [...prev, ...uploadItems]);

    // Start uploading
    const results: FileProcessingResult[] = [];

    for (const item of uploadItems) {
      try {
        const result = await uploadAndProcess(item.file, {
          processingOptions,
          onProgress: (progress) => {
            setFiles(prev =>
              prev.map(f =>
                f.id === item.id
                  ? { ...f, progress }
                  : f
              )
            );
          },
        });

        // Update with result
        setFiles(prev =>
          prev.map(f =>
            f.id === item.id
              ? {
                  ...f,
                  progress: { progress: 100, status: 'completed' },
                  result,
                }
              : f
          )
        );

        results.push(result);
        onUpload?.(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';

        setFiles(prev =>
          prev.map(f =>
            f.id === item.id
              ? {
                  ...f,
                  progress: {
                    progress: 0,
                    status: 'error',
                    error: errorMessage,
                  },
                }
              : f
          )
        );

        toast.error(`Failed to upload ${item.file.name}: ${errorMessage}`);
      }
    }

    if (results.length > 0) {
      onUploadComplete?.(results);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const retryFile = async (id: string) => {
    const item = files.find(f => f.id === id);
    if (!item) return;

    setFiles(prev =>
      prev.map(f =>
        f.id === id
          ? { ...f, progress: { progress: 0, status: 'uploading' } }
          : f
      )
    );

    try {
      const result = await uploadAndProcess(item.file, {
        processingOptions,
        onProgress: (progress) => {
          setFiles(prev =>
            prev.map(f =>
              f.id === id
                ? { ...f, progress }
                : f
            )
          );
        },
      });

      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                progress: { progress: 100, status: 'completed' },
                result,
              }
            : f
        )
      );

      onUpload?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                progress: {
                  progress: 0,
                  status: 'error',
                  error: errorMessage,
                },
              }
            : f
        )
      );

      toast.error(`Failed to upload: ${errorMessage}`);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
          'hover:border-primary/50 hover:bg-accent/50',
          {
            'border-primary bg-primary/10': dragOver,
            'border-muted-foreground/25': !dragOver,
            'opacity-50 cursor-not-allowed': disabled,
          }
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />

        <h3 className="text-lg font-medium mb-2">
          {dragOver ? 'Drop files here' : 'Upload Files'}
        </h3>

        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop files or click to browse
        </p>

        <p className="text-xs text-muted-foreground">
          Support for {acceptedTypes.length}+ file types
          {maxSize && ` • Max ${formatFileSize(maxSize)} per file`}
          {maxFiles && ` • Up to ${maxFiles} files`}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.map(type => `.${type}`).join(',')}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">
            {files.filter(f => f.progress.status === 'completed').length} of {files.length} files completed
          </h4>

          <div className="space-y-2">
            {files.map(item => (
              <FileUploadItemComponent
                key={item.id}
                item={item}
                onRemove={() => removeFile(item.id)}
                onRetry={() => retryFile(item.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FileUploadItemComponentProps {
  item: FileUploadItem;
  onRemove: () => void;
  onRetry: () => void;
}

function FileUploadItemComponent({ item, onRemove, onRetry }: FileUploadItemComponentProps) {
  const { file, progress } = item;

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
      {/* Icon */}
      <div className="flex-shrink-0">
        {progress.status === 'completed' && (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
        {progress.status === 'error' && (
          <AlertCircle className="w-5 h-5 text-red-500" />
        )}
        {(progress.status === 'uploading' || progress.status === 'processing') && (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatFileSize(file.size)}
          </span>
        </div>

        {/* Progress bar */}
        {(progress.status === 'uploading' || progress.status === 'processing') && (
          <div className="space-y-1">
            <Progress value={progress.progress} className="h-1" />
            <p className="text-xs text-muted-foreground">
              {progress.status === 'uploading' && `Uploading... ${Math.round(progress.progress)}%`}
              {progress.status === 'processing' && `Processing... ${Math.round(progress.progress)}%`}
            </p>
          </div>
        )}

        {/* Status messages */}
        {progress.status === 'completed' && (
          <p className="text-xs text-green-600 dark:text-green-400">
            Upload completed
          </p>
        )}

        {progress.status === 'error' && (
          <div className="space-y-1">
            <p className="text-xs text-red-600 dark:text-red-400">
              {progress.error || 'Upload failed'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="h-6 text-xs"
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Remove button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onRemove}
        className="flex-shrink-0 h-8 w-8"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
