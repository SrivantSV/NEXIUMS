/**
 * Comprehensive File Processing Types
 * Supports 50+ file types with advanced analysis capabilities
 */

// ============================================================================
// File Type Definitions
// ============================================================================

export type FileCategory =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'audio'
  | 'video'
  | 'code'
  | 'data'
  | 'design'
  | 'archive'
  | 'other';

export interface FileTypeInfo {
  category: FileCategory;
  mimeTypes: string[];
  processorType: string;
  supportsOCR?: boolean;
  supportsTranscription?: boolean;
  supportsVisionAnalysis?: boolean;
}

export const SUPPORTED_FILE_TYPES: Record<string, FileTypeInfo> = {
  // Documents
  'pdf': { category: 'document', mimeTypes: ['application/pdf'], processorType: 'pdf', supportsOCR: true },
  'doc': { category: 'document', mimeTypes: ['application/msword'], processorType: 'word' },
  'docx': { category: 'document', mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'], processorType: 'word' },
  'txt': { category: 'document', mimeTypes: ['text/plain'], processorType: 'text' },
  'md': { category: 'document', mimeTypes: ['text/markdown'], processorType: 'text' },
  'rtf': { category: 'document', mimeTypes: ['application/rtf'], processorType: 'text' },
  'odt': { category: 'document', mimeTypes: ['application/vnd.oasis.opendocument.text'], processorType: 'opendocument' },
  'epub': { category: 'document', mimeTypes: ['application/epub+zip'], processorType: 'epub' },

  // Spreadsheets
  'xlsx': { category: 'spreadsheet', mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], processorType: 'excel' },
  'xls': { category: 'spreadsheet', mimeTypes: ['application/vnd.ms-excel'], processorType: 'excel' },
  'csv': { category: 'spreadsheet', mimeTypes: ['text/csv'], processorType: 'csv' },
  'tsv': { category: 'spreadsheet', mimeTypes: ['text/tab-separated-values'], processorType: 'csv' },
  'ods': { category: 'spreadsheet', mimeTypes: ['application/vnd.oasis.opendocument.spreadsheet'], processorType: 'opendocument' },

  // Presentations
  'pptx': { category: 'presentation', mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'], processorType: 'powerpoint' },
  'ppt': { category: 'presentation', mimeTypes: ['application/vnd.ms-powerpoint'], processorType: 'powerpoint' },
  'odp': { category: 'presentation', mimeTypes: ['application/vnd.oasis.opendocument.presentation'], processorType: 'opendocument' },

  // Images
  'jpg': { category: 'image', mimeTypes: ['image/jpeg'], processorType: 'image', supportsOCR: true, supportsVisionAnalysis: true },
  'jpeg': { category: 'image', mimeTypes: ['image/jpeg'], processorType: 'image', supportsOCR: true, supportsVisionAnalysis: true },
  'png': { category: 'image', mimeTypes: ['image/png'], processorType: 'image', supportsOCR: true, supportsVisionAnalysis: true },
  'gif': { category: 'image', mimeTypes: ['image/gif'], processorType: 'image', supportsVisionAnalysis: true },
  'webp': { category: 'image', mimeTypes: ['image/webp'], processorType: 'image', supportsOCR: true, supportsVisionAnalysis: true },
  'svg': { category: 'image', mimeTypes: ['image/svg+xml'], processorType: 'svg' },
  'bmp': { category: 'image', mimeTypes: ['image/bmp'], processorType: 'image', supportsOCR: true, supportsVisionAnalysis: true },
  'tiff': { category: 'image', mimeTypes: ['image/tiff'], processorType: 'image', supportsOCR: true, supportsVisionAnalysis: true },
  'heic': { category: 'image', mimeTypes: ['image/heic'], processorType: 'image', supportsOCR: true, supportsVisionAnalysis: true },
  'avif': { category: 'image', mimeTypes: ['image/avif'], processorType: 'image', supportsVisionAnalysis: true },

  // Audio
  'mp3': { category: 'audio', mimeTypes: ['audio/mpeg'], processorType: 'audio', supportsTranscription: true },
  'wav': { category: 'audio', mimeTypes: ['audio/wav'], processorType: 'audio', supportsTranscription: true },
  'm4a': { category: 'audio', mimeTypes: ['audio/mp4'], processorType: 'audio', supportsTranscription: true },
  'flac': { category: 'audio', mimeTypes: ['audio/flac'], processorType: 'audio', supportsTranscription: true },
  'aac': { category: 'audio', mimeTypes: ['audio/aac'], processorType: 'audio', supportsTranscription: true },
  'ogg': { category: 'audio', mimeTypes: ['audio/ogg'], processorType: 'audio', supportsTranscription: true },

  // Video
  'mp4': { category: 'video', mimeTypes: ['video/mp4'], processorType: 'video', supportsTranscription: true, supportsVisionAnalysis: true },
  'avi': { category: 'video', mimeTypes: ['video/x-msvideo'], processorType: 'video', supportsTranscription: true },
  'mov': { category: 'video', mimeTypes: ['video/quicktime'], processorType: 'video', supportsTranscription: true, supportsVisionAnalysis: true },
  'mkv': { category: 'video', mimeTypes: ['video/x-matroska'], processorType: 'video', supportsTranscription: true },
  'webm': { category: 'video', mimeTypes: ['video/webm'], processorType: 'video', supportsTranscription: true },

  // Code
  'js': { category: 'code', mimeTypes: ['text/javascript', 'application/javascript'], processorType: 'code' },
  'ts': { category: 'code', mimeTypes: ['text/typescript', 'application/typescript'], processorType: 'code' },
  'jsx': { category: 'code', mimeTypes: ['text/jsx'], processorType: 'code' },
  'tsx': { category: 'code', mimeTypes: ['text/tsx'], processorType: 'code' },
  'py': { category: 'code', mimeTypes: ['text/x-python'], processorType: 'code' },
  'java': { category: 'code', mimeTypes: ['text/x-java'], processorType: 'code' },
  'cpp': { category: 'code', mimeTypes: ['text/x-c++'], processorType: 'code' },
  'c': { category: 'code', mimeTypes: ['text/x-c'], processorType: 'code' },
  'cs': { category: 'code', mimeTypes: ['text/x-csharp'], processorType: 'code' },
  'php': { category: 'code', mimeTypes: ['text/x-php'], processorType: 'code' },
  'rb': { category: 'code', mimeTypes: ['text/x-ruby'], processorType: 'code' },
  'go': { category: 'code', mimeTypes: ['text/x-go'], processorType: 'code' },
  'rs': { category: 'code', mimeTypes: ['text/x-rust'], processorType: 'code' },
  'swift': { category: 'code', mimeTypes: ['text/x-swift'], processorType: 'code' },
  'kt': { category: 'code', mimeTypes: ['text/x-kotlin'], processorType: 'code' },
  'html': { category: 'code', mimeTypes: ['text/html'], processorType: 'code' },
  'css': { category: 'code', mimeTypes: ['text/css'], processorType: 'code' },
  'scss': { category: 'code', mimeTypes: ['text/x-scss'], processorType: 'code' },
  'sql': { category: 'code', mimeTypes: ['text/x-sql'], processorType: 'code' },

  // Data
  'json': { category: 'data', mimeTypes: ['application/json'], processorType: 'json' },
  'xml': { category: 'data', mimeTypes: ['application/xml', 'text/xml'], processorType: 'xml' },
  'yaml': { category: 'data', mimeTypes: ['application/x-yaml'], processorType: 'yaml' },
  'yml': { category: 'data', mimeTypes: ['application/x-yaml'], processorType: 'yaml' },
  'toml': { category: 'data', mimeTypes: ['application/toml'], processorType: 'toml' },
  'sqlite': { category: 'data', mimeTypes: ['application/x-sqlite3'], processorType: 'database' },
  'db': { category: 'data', mimeTypes: ['application/x-sqlite3'], processorType: 'database' },

  // Archives
  'zip': { category: 'archive', mimeTypes: ['application/zip'], processorType: 'archive' },
  'rar': { category: 'archive', mimeTypes: ['application/x-rar-compressed'], processorType: 'archive' },
  'tar': { category: 'archive', mimeTypes: ['application/x-tar'], processorType: 'archive' },
  'gz': { category: 'archive', mimeTypes: ['application/gzip'], processorType: 'archive' },
  '7z': { category: 'archive', mimeTypes: ['application/x-7z-compressed'], processorType: 'archive' },

  // Design
  'psd': { category: 'design', mimeTypes: ['image/vnd.adobe.photoshop'], processorType: 'design' },
  'ai': { category: 'design', mimeTypes: ['application/postscript'], processorType: 'design' },
  'sketch': { category: 'design', mimeTypes: ['application/sketch'], processorType: 'design' },
  'fig': { category: 'design', mimeTypes: ['application/figma'], processorType: 'design' },
  'xd': { category: 'design', mimeTypes: ['application/vnd.adobe.xd'], processorType: 'design' },

  // Specialized
  'ipynb': { category: 'code', mimeTypes: ['application/x-ipynb+json'], processorType: 'notebook' },
};

// ============================================================================
// Core Processing Types
// ============================================================================

export interface FileMetadata {
  id?: string;
  name: string;
  size: number;
  type: string;
  extension?: string;
  category?: FileCategory;
  mimeType?: string;
  lastModified?: Date;
  uploadedAt?: Date;
  uploadedBy?: string;
  storageUrl?: string;
  thumbnailUrl?: string;
  checksum?: string;

  // Extended metadata (extracted from file)
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  createdDate?: Date;
  modifiedDate?: Date;
  pageCount?: number;
  wordCount?: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  language?: string;
}

export interface ProcessingOptions {
  enableOCR?: boolean;
  enableTranscription?: boolean;
  enableVisionAnalysis?: boolean;
  enableCodeAnalysis?: boolean;
  enableSecurityScan?: boolean;
  generateEmbeddings?: boolean;
  generateThumbnail?: boolean;
  extractImages?: boolean;
  maxFileSize?: number;
  language?: string;
  quality?: 'low' | 'medium' | 'high';
}

export interface FileProcessingResult {
  id: string;
  userId: string;
  originalFile: FileMetadata;
  processedData: ProcessedFileData;
  analysis: FileAnalysis;
  extractedContent: ExtractedContent[];
  embeddings: FileEmbedding[];
  preview: FilePreview;
  securityScan: SecurityScanResult;
  processingTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessedFileData {
  textContent?: string;
  structuredData?: any;
  images?: ExtractedImage[];
  metadata?: Record<string, any>;
  dependencies?: string[];
  codeAnalysis?: CodeAnalysis;
  dataSchema?: DataSchema;
  audioData?: AudioData;
  videoData?: VideoData;
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface FileAnalysis {
  textAnalysis?: TextAnalysis;
  imageAnalysis?: ImageAnalysisResult[];
  codeAnalysis?: CodeAnalysis;
  dataAnalysis?: DataAnalysis;
  audioAnalysis?: AudioAnalysis;
  videoAnalysis?: VideoAnalysis;
  securityAnalysis?: SecurityAnalysis;
}

export interface TextAnalysis {
  language: string;
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  readabilityScore?: number;
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  keywords?: Array<{ word: string; score: number }>;
  entities?: Array<{
    text: string;
    type: 'person' | 'organization' | 'location' | 'date' | 'other';
    confidence: number;
  }>;
  topics?: Array<{ topic: string; confidence: number }>;
  summary?: string;
}

export interface ImageAnalysisResult {
  imageId: string;
  labels?: Array<{ label: string; confidence: number }>;
  objects?: Array<{
    label: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  faces?: Array<{
    boundingBox: { x: number; y: number; width: number; height: number };
    emotions?: Record<string, number>;
    age?: number;
    gender?: string;
  }>;
  text?: string;
  colors?: Array<{ color: string; percentage: number }>;
  quality?: {
    brightness: number;
    contrast: number;
    sharpness: number;
    noise: number;
  };
  nsfw?: {
    isNSFW: boolean;
    confidence: number;
    categories?: Record<string, number>;
  };
}

export interface CodeAnalysis {
  language: string;
  functions?: Array<{
    name: string;
    lineStart: number;
    lineEnd: number;
    parameters: string[];
    complexity: number;
  }>;
  classes?: Array<{
    name: string;
    lineStart: number;
    lineEnd: number;
    methods: string[];
  }>;
  imports?: string[];
  exports?: string[];
  dependencies?: Array<{
    name: string;
    version?: string;
    type: 'production' | 'development' | 'peer';
  }>;
  metrics?: {
    linesOfCode: number;
    linesOfComments: number;
    blankLines: number;
    cyclomaticComplexity: number;
    maintainabilityIndex: number;
    duplicateBlocks?: number;
  };
  issues?: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    column?: number;
    rule?: string;
  }>;
  documentation?: string;
}

export interface DataAnalysis {
  schema?: DataSchema;
  rowCount?: number;
  columnCount?: number;
  columns?: Array<{
    name: string;
    type: string;
    nullable: boolean;
    unique: boolean;
    stats?: {
      min?: any;
      max?: any;
      mean?: number;
      median?: number;
      mode?: any;
      stdDev?: number;
      nullCount?: number;
      uniqueCount?: number;
    };
  }>;
  relationships?: Array<{
    from: string;
    to: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  }>;
  sample?: any[];
}

export interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
  format: string;
  loudness?: {
    peak: number;
    rms: number;
    lufs: number;
  };
  tempo?: number;
  key?: string;
  mood?: string;
  genre?: string;
  quality?: number;
}

export interface VideoAnalysis {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  codec: string;
  hasAudio: boolean;
  audioCodec?: string;
  keyFrames?: number[];
  scenes?: Array<{
    start: number;
    end: number;
    description?: string;
  }>;
  quality?: {
    resolution: string;
    sharpness: number;
    noise: number;
  };
}

export interface SecurityAnalysis {
  hasThreat: boolean;
  threats: Array<{
    type: 'virus' | 'malware' | 'phishing' | 'suspicious' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: string;
  }>;
  vulnerabilities?: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    cve?: string;
  }>;
  privacyIssues?: Array<{
    type: 'pii' | 'credentials' | 'secrets' | 'other';
    description: string;
    location?: string;
  }>;
}

// ============================================================================
// Extracted Content Types
// ============================================================================

export interface ExtractedContent {
  id: string;
  type: 'text' | 'image' | 'table' | 'chart' | 'code' | 'other';
  content: string | any;
  metadata?: Record<string, any>;
  page?: number;
  position?: { x: number; y: number; width: number; height: number };
}

export interface ExtractedImage {
  id: string;
  src: string;
  width: number;
  height: number;
  thumbnail?: string;
  alt?: string;
  caption?: string;
  page?: number;
  position?: { x: number; y: number };
  format?: string;
  size?: number;
  analysis?: ImageAnalysisResult;
}

export interface DataSchema {
  type: 'object' | 'array' | 'primitive';
  properties?: Record<string, DataSchema>;
  items?: DataSchema;
  required?: string[];
  description?: string;
}

export interface AudioData {
  transcription?: TranscriptionResult;
  waveform?: number[];
  spectrogram?: string; // Base64 image
}

export interface VideoData {
  transcription?: TranscriptionResult;
  keyFrames?: ExtractedImage[];
  chapters?: Array<{
    start: number;
    end: number;
    title: string;
    description?: string;
  }>;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
  language: string;
  confidence: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker?: string;
  }>;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  speakers?: Array<{
    id: string;
    name?: string;
    segments: number[];
  }>;
}

// ============================================================================
// Embedding & Search Types
// ============================================================================

export interface FileEmbedding {
  id: string;
  fileId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface FilePreview {
  type: 'text' | 'image' | 'video' | 'audio' | 'code' | 'pdf' | 'error';
  content: string | any;
  thumbnail?: string;
  duration?: number;
  pageCount?: number;
}

export interface SecurityScanResult {
  hasThreat: boolean;
  threats: string[];
  scanTime: number;
  scanEngine?: string;
  details?: Record<string, any>;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchFilters {
  fileType?: string | string[];
  category?: FileCategory | FileCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  minSize?: number;
  maxSize?: number;
  tags?: string[];
  uploadedBy?: string;
}

export interface FileSearchResult {
  file: FileProcessingResult;
  score: number;
  highlights?: Array<{
    field: string;
    snippets: string[];
  }>;
  matchType: 'semantic' | 'fulltext' | 'hybrid';
}

// ============================================================================
// Upload Types
// ============================================================================

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  bytesUploaded?: number;
  bytesTotal?: number;
  timeRemaining?: number;
}

export interface FileUploadOptions {
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  processingOptions?: ProcessingOptions;
  onProgress?: (progress: UploadProgress) => void;
}

// ============================================================================
// Processor Interface
// ============================================================================

export interface FileProcessor {
  process(file: File, options: ProcessingOptions): Promise<ProcessedFileData>;
  validate?(file: File): Promise<boolean>;
  getSupportedTypes(): string[];
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageProvider {
  upload(file: File, path: string): Promise<StorageUploadResult>;
  download(path: string): Promise<Blob>;
  delete(path: string): Promise<void>;
  getUrl(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
}

export interface StorageUploadResult {
  url: string;
  path: string;
  size: number;
  etag?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Utility Types
// ============================================================================

export function getFileExtension(filename: string): string | null {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : null;
}

export function getFileCategory(extension: string): FileCategory | null {
  const fileType = SUPPORTED_FILE_TYPES[extension];
  return fileType ? fileType.category : null;
}

export function isFileTypeSupported(extension: string): boolean {
  return extension in SUPPORTED_FILE_TYPES;
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
