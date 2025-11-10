/**
 * Cloud Storage Service
 * Handles file uploads to AWS S3 or other cloud storage providers
 */

import { StorageProvider, StorageUploadResult } from '@/types/files';
import { generateId } from '@/lib/utils/id';

/**
 * AWS S3 Storage Provider
 */
export class S3StorageProvider implements StorageProvider {
  private bucketName: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || '';
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
  }

  async upload(file: File, path?: string): Promise<StorageUploadResult> {
    try {
      // Generate unique path if not provided
      const filePath = path || this.generateFilePath(file);

      // In production, use AWS SDK to upload to S3
      // For now, we'll use a presigned URL approach or direct API call

      if (!this.bucketName || !this.accessKeyId) {
        console.warn('[S3Storage] AWS credentials not configured, using local storage fallback');
        return this.uploadToLocalStorage(file, filePath);
      }

      // Use AWS SDK v3
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

      const client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      const response = await client.send(command);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filePath}`;

      return {
        url,
        path: filePath,
        size: file.size,
        etag: response.ETag,
        metadata: {
          bucket: this.bucketName,
          region: this.region,
          contentType: file.type,
        },
      };
    } catch (error) {
      console.error('[S3Storage] Upload failed:', error);
      throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async download(path: string): Promise<Blob> {
    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');

      const client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      const response = await client.send(command);

      // Convert stream to blob
      const stream = response.Body as ReadableStream;
      const arrayBuffer = await new Response(stream).arrayBuffer();
      return new Blob([arrayBuffer], { type: response.ContentType });
    } catch (error) {
      console.error('[S3Storage] Download failed:', error);
      throw new Error(`Storage download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(path: string): Promise<void> {
    try {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

      const client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      await client.send(command);
    } catch (error) {
      console.error('[S3Storage] Delete failed:', error);
      throw new Error(`Storage delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUrl(path: string): Promise<string> {
    try {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      const client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      // Generate presigned URL valid for 1 hour
      const url = await getSignedUrl(client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      console.error('[S3Storage] Get URL failed:', error);
      throw new Error(`Storage get URL failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const { S3Client, HeadObjectCommand } = await import('@aws-sdk/client-s3');

      const client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      });

      await client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  private generateFilePath(file: File): string {
    const timestamp = Date.now();
    const randomId = generateId();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomId}.${extension}`;

    // Organize by date
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `uploads/${year}/${month}/${day}/${fileName}`;
  }

  private async uploadToLocalStorage(file: File, path: string): Promise<StorageUploadResult> {
    // Fallback for development/testing without AWS credentials
    const url = URL.createObjectURL(file);

    return {
      url,
      path,
      size: file.size,
      metadata: {
        mode: 'local',
        note: 'Using local storage fallback',
      },
    };
  }
}

/**
 * Local Storage Provider (for development)
 */
export class LocalStorageProvider implements StorageProvider {
  private storage: Map<string, Blob> = new Map();

  async upload(file: File, path?: string): Promise<StorageUploadResult> {
    const filePath = path || `local/${Date.now()}-${file.name}`;
    this.storage.set(filePath, file);

    return {
      url: URL.createObjectURL(file),
      path: filePath,
      size: file.size,
    };
  }

  async download(path: string): Promise<Blob> {
    const blob = this.storage.get(path);
    if (!blob) {
      throw new Error(`File not found: ${path}`);
    }
    return blob;
  }

  async delete(path: string): Promise<void> {
    this.storage.delete(path);
  }

  async getUrl(path: string): Promise<string> {
    const blob = this.storage.get(path);
    if (!blob) {
      throw new Error(`File not found: ${path}`);
    }
    return URL.createObjectURL(blob);
  }

  async exists(path: string): Promise<boolean> {
    return this.storage.has(path);
  }
}

// Storage service singleton
let storageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!storageProvider) {
    // Use S3 if configured, otherwise use local storage
    const useS3 = process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID;
    storageProvider = useS3 ? new S3StorageProvider() : new LocalStorageProvider();
  }
  return storageProvider;
}

export async function uploadFile(file: File, path?: string): Promise<StorageUploadResult> {
  const provider = getStorageProvider();
  return provider.upload(file, path);
}

export async function downloadFile(path: string): Promise<Blob> {
  const provider = getStorageProvider();
  return provider.download(path);
}

export async function deleteFile(path: string): Promise<void> {
  const provider = getStorageProvider();
  return provider.delete(path);
}

export async function getFileUrl(path: string): Promise<string> {
  const provider = getStorageProvider();
  return provider.getUrl(path);
}
