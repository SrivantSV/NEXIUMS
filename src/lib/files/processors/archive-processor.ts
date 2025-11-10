/**
 * Archive Processor
 * Processes ZIP, RAR, TAR, and other archive files
 */

import { FileProcessor, ProcessedFileData, ProcessingOptions } from '@/types/files';

export class ArchiveProcessor implements FileProcessor {
  getSupportedTypes(): string[] {
    return ['zip', 'rar', 'tar', 'gz', '7z'];
  }

  async validate(file: File): Promise<boolean> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return !!extension && this.getSupportedTypes().includes(extension);
  }

  async process(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      if (extension === 'zip') {
        return await this.processZip(file, options);
      } else {
        // Other archive formats require server-side processing
        return {
          textContent: `[Archive file: ${file.name}]`,
          metadata: {
            format: extension,
            fileName: file.name,
            size: file.size,
            note: 'Archive extraction requires server-side processing',
          },
        };
      }
    } catch (error) {
      console.error('[ArchiveProcessor] Processing failed:', error);
      throw new Error(`Archive processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processZip(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      // Use JSZip to process ZIP files
      const JSZip = await import('jszip');
      const zip = await JSZip.default.loadAsync(file);

      const fileList: Array<{
        name: string;
        size: number;
        compressedSize: number;
        date: Date;
        isDirectory: boolean;
      }> = [];

      let textContent = '--- Archive Contents ---\n';

      // List all files
      zip.forEach((relativePath, zipEntry) => {
        fileList.push({
          name: relativePath,
          size: zipEntry._data ? zipEntry._data.uncompressedSize : 0,
          compressedSize: zipEntry._data ? zipEntry._data.compressedSize : 0,
          date: zipEntry.date,
          isDirectory: zipEntry.dir,
        });

        textContent += `${zipEntry.dir ? '[DIR]' : '[FILE]'} ${relativePath} (${zipEntry._data?.uncompressedSize || 0} bytes)\n`;
      });

      // Try to extract text from text files
      for (const entry of fileList) {
        if (!entry.isDirectory && this.isTextFile(entry.name) && entry.size < 100000) {
          try {
            const content = await zip.file(entry.name)?.async('text');
            if (content) {
              textContent += `\n--- ${entry.name} ---\n${content.substring(0, 1000)}\n`;
            }
          } catch (error) {
            console.warn(`[ArchiveProcessor] Could not extract ${entry.name}:`, error);
          }
        }
      }

      return {
        textContent,
        structuredData: {
          files: fileList,
        },
        metadata: {
          format: 'zip',
          fileName: file.name,
          fileCount: fileList.filter(f => !f.isDirectory).length,
          directoryCount: fileList.filter(f => f.isDirectory).length,
          totalSize: fileList.reduce((sum, f) => sum + f.size, 0),
          compressedSize: file.size,
        },
      };
    } catch (error) {
      console.error('[ArchiveProcessor] ZIP processing failed:', error);
      throw error;
    }
  }

  private isTextFile(filename: string): boolean {
    const textExtensions = [
      'txt', 'md', 'json', 'xml', 'yaml', 'yml', 'csv', 'tsv',
      'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'py', 'java',
      'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift',
      'kt', 'sql', 'sh', 'bash', 'log', 'ini', 'conf', 'cfg',
    ];

    const extension = filename.split('.').pop()?.toLowerCase();
    return !!extension && textExtensions.includes(extension);
  }
}
