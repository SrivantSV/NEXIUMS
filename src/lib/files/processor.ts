/**
 * Core File Processing Pipeline
 * Orchestrates file processing, analysis, and storage
 */

import {
  FileProcessingResult,
  ProcessedFileData,
  FileMetadata,
  ProcessingOptions,
  FileProcessor,
  FileAnalysis,
  ExtractedContent,
  FileEmbedding,
  FilePreview,
  SecurityScanResult,
  SUPPORTED_FILE_TYPES,
  getFileExtension,
  TextAnalysis,
  ImageAnalysisResult,
} from '@/types/files';
import { generateId } from '@/lib/utils/id';
import { SecurityScanner } from './security-scanner';
import { EmbeddingService } from './embedding-service';

// Import processors
import { PDFProcessor } from './processors/pdf-processor';
import { ImageProcessor } from './processors/image-processor';
import { AudioProcessor } from './processors/audio-processor';
import { VideoProcessor } from './processors/video-processor';
import { CodeProcessor } from './processors/code-processor';
import { DocumentProcessor } from './processors/document-processor';
import { DataProcessor } from './processors/data-processor';
import { TextProcessor } from './processors/text-processor';
import { ArchiveProcessor } from './processors/archive-processor';

export class FileProcessingPipeline {
  private processors: Map<string, FileProcessor> = new Map();
  private securityScanner: SecurityScanner;
  private embeddingService: EmbeddingService;

  constructor() {
    this.initializeProcessors();
    this.securityScanner = new SecurityScanner();
    this.embeddingService = new EmbeddingService();
  }

  private initializeProcessors(): void {
    // Register all processors
    const pdfProcessor = new PDFProcessor();
    const imageProcessor = new ImageProcessor();
    const audioProcessor = new AudioProcessor();
    const videoProcessor = new VideoProcessor();
    const codeProcessor = new CodeProcessor();
    const documentProcessor = new DocumentProcessor();
    const dataProcessor = new DataProcessor();
    const textProcessor = new TextProcessor();
    const archiveProcessor = new ArchiveProcessor();

    // Map file types to processors
    this.processors.set('pdf', pdfProcessor);

    // Images
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'heic', 'avif'].forEach(type => {
      this.processors.set(type, imageProcessor);
    });

    // Audio
    ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg'].forEach(type => {
      this.processors.set(type, audioProcessor);
    });

    // Video
    ['mp4', 'avi', 'mov', 'mkv', 'webm'].forEach(type => {
      this.processors.set(type, videoProcessor);
    });

    // Code
    ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'html', 'css', 'scss', 'sql'].forEach(type => {
      this.processors.set(type, codeProcessor);
    });

    // Documents
    ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp'].forEach(type => {
      this.processors.set(type, documentProcessor);
    });

    // Data
    ['json', 'xml', 'yaml', 'yml', 'toml', 'csv', 'tsv', 'sqlite', 'db'].forEach(type => {
      this.processors.set(type, dataProcessor);
    });

    // Text
    ['txt', 'md', 'rtf'].forEach(type => {
      this.processors.set(type, textProcessor);
    });

    // Archives
    ['zip', 'rar', 'tar', 'gz', '7z'].forEach(type => {
      this.processors.set(type, archiveProcessor);
    });

    // SVG (special case - can be treated as both image and code)
    this.processors.set('svg', textProcessor);
  }

  async processFile(
    file: File,
    userId: string,
    options: ProcessingOptions = {}
  ): Promise<FileProcessingResult> {
    const processingId = generateId();
    const startTime = Date.now();

    try {
      console.log(`[FileProcessor] Starting processing for file: ${file.name}`);

      // 1. File validation
      await this.validateFile(file);

      // 2. Security scan
      const securityResult = await this.securityScanner.scan(file);
      if (securityResult.hasThreat) {
        throw new Error(`Security threat detected: ${securityResult.threats.join(', ')}`);
      }

      // 3. Extract basic metadata
      const metadata = await this.extractMetadata(file);

      // 4. Determine processor
      const extension = getFileExtension(file.name);
      if (!extension) {
        throw new Error('Unable to determine file type');
      }

      const processor = this.getProcessor(extension);
      if (!processor) {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      // 5. Process file content
      console.log(`[FileProcessor] Processing file with ${extension} processor`);
      const processedData = await processor.process(file, {
        enableOCR: options.enableOCR ?? true,
        enableTranscription: options.enableTranscription ?? true,
        enableVisionAnalysis: options.enableVisionAnalysis ?? true,
        enableCodeAnalysis: options.enableCodeAnalysis ?? true,
        ...options,
      });

      // 6. Perform analysis
      console.log(`[FileProcessor] Analyzing content`);
      const analysis = await this.analyzeContent(processedData, extension);

      // 7. Extract searchable content
      const extractedContent = this.extractSearchableContent(processedData);

      // 8. Generate embeddings
      console.log(`[FileProcessor] Generating embeddings`);
      const embeddings = options.generateEmbeddings !== false
        ? await this.generateEmbeddings(processedData, processingId)
        : [];

      // 9. Create preview
      console.log(`[FileProcessor] Generating preview`);
      const preview = await this.generatePreview(file, processedData, extension);

      // 10. Build result
      const result: FileProcessingResult = {
        id: processingId,
        userId,
        originalFile: metadata,
        processedData,
        analysis,
        extractedContent,
        embeddings,
        preview,
        securityScan: securityResult,
        processingTime: Date.now() - startTime,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log(`[FileProcessor] Processing completed in ${result.processingTime}ms`);
      return result;

    } catch (error) {
      console.error(`[FileProcessor] Processing failed:`, error);

      const errorResult: FileProcessingResult = {
        id: processingId,
        userId,
        originalFile: {
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
        },
        processedData: {},
        analysis: {},
        extractedContent: [],
        embeddings: [],
        preview: {
          type: 'error',
          content: error instanceof Error ? error.message : 'Unknown error',
        },
        securityScan: { hasThreat: false, threats: [], scanTime: 0 },
        processingTime: Date.now() - startTime,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      throw error;
    }
  }

  private async validateFile(file: File): Promise<void> {
    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file extension
    const extension = getFileExtension(file.name);
    if (!extension || !SUPPORTED_FILE_TYPES[extension]) {
      throw new Error(`Unsupported file type: ${extension || 'unknown'}`);
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new Error('File is empty');
    }
  }

  private async extractMetadata(file: File): Promise<FileMetadata> {
    const extension = getFileExtension(file.name);
    const fileType = extension ? SUPPORTED_FILE_TYPES[extension] : null;

    return {
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      extension: extension || undefined,
      category: fileType?.category,
      mimeType: file.type,
      lastModified: new Date(file.lastModified),
      uploadedAt: new Date(),
    };
  }

  private getProcessor(extension: string): FileProcessor | null {
    return this.processors.get(extension) || null;
  }

  private async analyzeContent(
    processedData: ProcessedFileData,
    fileType: string
  ): Promise<FileAnalysis> {
    const analysis: FileAnalysis = {};

    try {
      // Text analysis
      if (processedData.textContent && processedData.textContent.length > 0) {
        analysis.textAnalysis = await this.analyzeText(processedData.textContent);
      }

      // Image analysis
      if (processedData.images && processedData.images.length > 0) {
        analysis.imageAnalysis = await this.analyzeImages(processedData.images);
      }

      // Code analysis (already done by processor)
      if (processedData.codeAnalysis) {
        analysis.codeAnalysis = processedData.codeAnalysis;
      }

      // Data analysis
      if (processedData.structuredData) {
        analysis.dataAnalysis = {
          schema: processedData.dataSchema,
          sample: Array.isArray(processedData.structuredData)
            ? processedData.structuredData.slice(0, 10)
            : [processedData.structuredData],
        };
      }

      // Audio analysis
      if (processedData.audioData) {
        analysis.audioAnalysis = {
          duration: processedData.audioData.transcription?.duration || 0,
          sampleRate: 44100, // Default
          channels: 2, // Default
          bitrate: 128, // Default
          format: 'mp3', // Default
        };
      }

      // Video analysis
      if (processedData.videoData) {
        analysis.videoAnalysis = {
          duration: processedData.videoData.transcription?.duration || 0,
          width: 1920, // Default
          height: 1080, // Default
          frameRate: 30, // Default
          bitrate: 5000, // Default
          codec: 'h264', // Default
          hasAudio: !!processedData.videoData.transcription,
        };
      }
    } catch (error) {
      console.error('[FileProcessor] Analysis failed:', error);
      // Continue even if analysis fails
    }

    return analysis;
  }

  private async analyzeText(text: string): Promise<TextAnalysis> {
    // Basic text analysis
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

    // Extract keywords (simple frequency-based approach)
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      const cleaned = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleaned.length > 3) {
        wordFreq.set(cleaned, (wordFreq.get(cleaned) || 0) + 1);
      }
    });

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, score: count }));

    return {
      language: 'en', // Would use language detection in production
      wordCount: words.length,
      characterCount: text.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      keywords,
    };
  }

  private async analyzeImages(images: any[]): Promise<ImageAnalysisResult[]> {
    // Basic image analysis - would integrate with vision APIs in production
    return images.map(img => ({
      imageId: img.id,
      labels: [],
      objects: [],
      faces: [],
      colors: [],
    }));
  }

  private extractSearchableContent(processedData: ProcessedFileData): ExtractedContent[] {
    const content: ExtractedContent[] = [];

    // Extract text content
    if (processedData.textContent) {
      content.push({
        id: generateId(),
        type: 'text',
        content: processedData.textContent,
      });
    }

    // Extract images
    if (processedData.images) {
      processedData.images.forEach(img => {
        content.push({
          id: img.id,
          type: 'image',
          content: img.src,
          metadata: {
            width: img.width,
            height: img.height,
            alt: img.alt,
            caption: img.caption,
          },
        });
      });
    }

    // Extract code blocks
    if (processedData.codeAnalysis) {
      content.push({
        id: generateId(),
        type: 'code',
        content: processedData.textContent || '',
        metadata: {
          language: processedData.codeAnalysis.language,
          functions: processedData.codeAnalysis.functions?.length || 0,
          classes: processedData.codeAnalysis.classes?.length || 0,
        },
      });
    }

    return content;
  }

  private async generateEmbeddings(
    processedData: ProcessedFileData,
    fileId: string
  ): Promise<FileEmbedding[]> {
    const embeddings: FileEmbedding[] = [];

    if (!processedData.textContent) {
      return embeddings;
    }

    // Split text into chunks (max 512 tokens per chunk)
    const chunks = this.chunkText(processedData.textContent, 512);

    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await this.embeddingService.generateEmbedding(chunks[i]);
        embeddings.push({
          id: generateId(),
          fileId,
          chunkIndex: i,
          text: chunks[i],
          embedding,
        });
      } catch (error) {
        console.error(`[FileProcessor] Failed to generate embedding for chunk ${i}:`, error);
      }
    }

    return embeddings;
  }

  private chunkText(text: string, maxTokens: number): string[] {
    // Simple chunking by words (approximation: 1 token ≈ 0.75 words)
    const words = text.split(/\s+/);
    const maxWords = Math.floor(maxTokens * 0.75);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(' '));
    }

    return chunks;
  }

  private async generatePreview(
    file: File,
    processedData: ProcessedFileData,
    extension: string
  ): Promise<FilePreview> {
    try {
      // Text preview
      if (processedData.textContent) {
        return {
          type: 'text',
          content: processedData.textContent.substring(0, 1000),
        };
      }

      // Image preview
      if (processedData.images && processedData.images.length > 0) {
        return {
          type: 'image',
          content: processedData.images[0].src,
          thumbnail: processedData.images[0].thumbnail,
        };
      }

      // Code preview
      if (processedData.codeAnalysis) {
        return {
          type: 'code',
          content: processedData.textContent?.substring(0, 1000) || '',
        };
      }

      // PDF preview
      if (extension === 'pdf') {
        return {
          type: 'pdf',
          content: processedData.textContent?.substring(0, 1000) || '',
          pageCount: processedData.metadata?.pageCount,
        };
      }

      // Audio preview
      if (processedData.audioData) {
        return {
          type: 'audio',
          content: URL.createObjectURL(file),
          duration: processedData.audioData.transcription?.duration,
        };
      }

      // Video preview
      if (processedData.videoData) {
        return {
          type: 'video',
          content: URL.createObjectURL(file),
          duration: processedData.videoData.transcription?.duration,
          thumbnail: processedData.videoData.keyFrames?.[0]?.src,
        };
      }

      // Default preview
      return {
        type: 'text',
        content: `File: ${file.name}\nSize: ${file.size} bytes`,
      };
    } catch (error) {
      console.error('[FileProcessor] Preview generation failed:', error);
      return {
        type: 'error',
        content: 'Failed to generate preview',
      };
    }
  }
}

// Singleton instance
let processorInstance: FileProcessingPipeline | null = null;

export function getFileProcessor(): FileProcessingPipeline {
  if (!processorInstance) {
    processorInstance = new FileProcessingPipeline();
  }
  return processorInstance;
}

export async function processFile(
  file: File,
  userId: string,
  options?: ProcessingOptions
): Promise<FileProcessingResult> {
  const processor = getFileProcessor();
  return processor.processFile(file, userId, options);
}
