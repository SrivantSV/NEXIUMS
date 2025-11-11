# Nexus AI - File Processing System Documentation

## Overview

The Nexus AI File Processing System is a comprehensive multimodal file handling solution that supports 50+ file types with advanced analysis capabilities including OCR, transcription, vision analysis, code parsing, and more.

## Features

### ✨ Core Capabilities

- **50+ File Types Supported**: Documents, images, audio, video, code, data files, archives, and more
- **OCR Processing**: Extract text from images and scanned documents using Tesseract.js
- **Audio Transcription**: Transcribe audio files using OpenAI Whisper API
- **Video Analysis**: Extract frames and transcribe video content
- **Code Analysis**: AST parsing, complexity metrics, and issue detection
- **Security Scanning**: Malware detection, vulnerability scanning, and secret detection
- **Semantic Search**: Vector-based search with embeddings
- **Full-Text Search**: Fast keyword-based search across all file content

### 📁 Supported File Types

#### Documents
- PDF, DOC, DOCX, TXT, MD, RTF, ODT, EPUB

#### Spreadsheets
- XLSX, XLS, CSV, TSV, ODS

#### Presentations
- PPTX, PPT, ODP

#### Images
- JPG, JPEG, PNG, GIF, WEBP, SVG, BMP, TIFF, HEIC, AVIF

#### Audio
- MP3, WAV, M4A, FLAC, AAC, OGG

#### Video
- MP4, AVI, MOV, MKV, WEBM

#### Code
- JS, TS, JSX, TSX, PY, JAVA, CPP, C, CS, PHP, RB, GO, RS, SWIFT, KT, HTML, CSS, SCSS, SQL

#### Data
- JSON, XML, YAML, TOML, CSV, SQLite

#### Archives
- ZIP, RAR, TAR, GZ, 7Z

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                  File Upload UI                      │
│              (Drag & Drop Interface)                 │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│              File Processing Pipeline                │
│  ┌────────────┬──────────────┬─────────────┐       │
│  │ Validation │   Security   │   Storage   │       │
│  │  & Checks  │   Scanning   │   Upload    │       │
│  └────────────┴──────────────┴─────────────┘       │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│            Specialized Processors                    │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┐       │
│  │ PDF  │Image│Audio│Video│ Code│ Data│      │       │
│  │Proc. │Proc.│Proc.│Proc.│Proc.│Proc.│      │       │
│  └──────┴──────┴──────┴──────┴──────┴──────┘       │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│               Analysis & Indexing                    │
│  ┌──────────┬──────────────┬─────────────┐         │
│  │   Text   │   Embedding  │   Search    │         │
│  │ Analysis │  Generation  │   Indexing  │         │
│  └──────────┴──────────────┴─────────────┘         │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│              Storage & Database                      │
│         (S3 + PostgreSQL + Vector DB)                │
└─────────────────────────────────────────────────────┘
```

## Usage

### Basic File Upload

```tsx
import { FileUpload } from '@/components/files/FileUpload';

function MyComponent() {
  const handleUpload = (result: FileProcessingResult) => {
    console.log('File processed:', result);
  };

  return (
    <FileUpload
      onUpload={handleUpload}
      maxFiles={10}
      maxSize={500 * 1024 * 1024} // 500MB
      acceptedTypes={['pdf', 'jpg', 'png', 'mp4']}
    />
  );
}
```

### Programmatic File Processing

```tsx
import { processFile } from '@/lib/files/processor';

async function processMyFile(file: File, userId: string) {
  const result = await processFile(file, userId, {
    enableOCR: true,
    enableTranscription: true,
    enableVisionAnalysis: true,
    enableCodeAnalysis: true,
    generateEmbeddings: true,
  });

  console.log('Text content:', result.processedData.textContent);
  console.log('Analysis:', result.analysis);
  console.log('Embeddings:', result.embeddings);
}
```

### File Search

```tsx
import { getFileSearchEngine } from '@/lib/files/search-engine';

async function searchFiles(query: string, userId: string) {
  const searchEngine = getFileSearchEngine();

  const results = await searchEngine.searchFiles(query, userId, {
    fileType: ['pdf', 'doc'],
    category: 'document',
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date(),
    },
  });

  return results;
}
```

### Using Hooks

```tsx
import { useFileUpload } from '@/hooks/useFileUpload';

function UploadComponent() {
  const { uploadAndProcess, isUploading, progress } = useFileUpload();

  const handleFileSelect = async (file: File) => {
    try {
      const result = await uploadAndProcess(file, {
        processingOptions: {
          enableOCR: true,
          enableTranscription: true,
        },
        onProgress: (progress) => {
          console.log(`Progress: ${progress.progress}%`);
        },
      });

      console.log('Upload complete:', result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
        disabled={isUploading}
      />
      {isUploading && <p>Uploading... {progress}%</p>}
    </div>
  );
}
```

## API Routes

### Upload File

```bash
POST /api/files
Content-Type: application/json

{
  "id": "file-id",
  "originalFile": {
    "name": "document.pdf",
    "size": 1024000,
    "type": "application/pdf",
    ...
  },
  "processedData": { ... },
  "analysis": { ... },
  ...
}
```

### Get Files

```bash
GET /api/files?category=document&limit=50&offset=0
```

### Search Files

```bash
GET /api/files/search?q=contract&fileType=pdf,doc
POST /api/files/search
Content-Type: application/json

{
  "query": "contract",
  "filters": {
    "fileType": ["pdf", "doc"],
    "category": "document"
  }
}
```

### Get Single File

```bash
GET /api/files/{id}
```

### Update File

```bash
PATCH /api/files/{id}
Content-Type: application/json

{
  "fileName": "new-name.pdf",
  "tags": ["important", "contract"]
}
```

### Delete File

```bash
DELETE /api/files/{id}
DELETE /api/files?ids=id1,id2,id3
```

## Configuration

### Environment Variables

```env
# AWS S3 Configuration
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# OpenAI Configuration (for transcription and embeddings)
OPENAI_API_KEY=your-openai-api-key

# Database
DATABASE_URL=postgresql://...
```

### Processing Options

```typescript
interface ProcessingOptions {
  enableOCR?: boolean;              // Enable OCR for images and PDFs
  enableTranscription?: boolean;    // Enable audio/video transcription
  enableVisionAnalysis?: boolean;   // Enable image analysis
  enableCodeAnalysis?: boolean;     // Enable code parsing and analysis
  enableSecurityScan?: boolean;     // Enable security scanning
  generateEmbeddings?: boolean;     // Generate embeddings for search
  generateThumbnail?: boolean;      // Generate thumbnail images
  extractImages?: boolean;          // Extract images from documents
  maxFileSize?: number;             // Max file size in bytes
  language?: string;                // Language for OCR/transcription
  quality?: 'low' | 'medium' | 'high'; // Processing quality
}
```

## Database Schema

```prisma
model File {
  id              String   @id @default(cuid())
  userId          String
  fileName        String
  fileType        String
  fileSize        Int
  category        String
  extension       String?
  storageUrl      String?
  thumbnailUrl    String?
  textContent     String?
  metadata        Json?
  analysis        Json?
  tags            String[]
  status          String
  processingTime  Int
  securityScan    Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  embeddings      FileEmbedding[]
  versions        FileVersion[]
}

model FileEmbedding {
  id         String   @id @default(cuid())
  fileId     String
  chunkIndex Int
  text       String
  embedding  Float[]
  createdAt  DateTime @default(now())
}
```

## Security

### Security Scanning Features

1. **Malware Detection**: Checks for executable signatures
2. **File Type Verification**: Validates MIME types match extensions
3. **Content Scanning**: Detects suspicious scripts and patterns
4. **XSS Detection**: Identifies potential XSS vulnerabilities
5. **SQL Injection Detection**: Finds SQL injection patterns
6. **Secret Detection**: Detects exposed API keys and credentials
7. **File Size Validation**: Prevents DoS attacks via large files

### Best Practices

- Always enable security scanning for user-uploaded files
- Validate file types on both client and server
- Use signed URLs for file access
- Implement rate limiting on uploads
- Store files in isolated storage buckets
- Scan for viruses using external services for production

## Performance Optimization

### Tips for Better Performance

1. **Chunked Processing**: Large files are processed in chunks
2. **Parallel Processing**: Multiple files processed concurrently
3. **Lazy Loading**: Load file data only when needed
4. **Caching**: Cache processed results and embeddings
5. **CDN**: Use CDN for file delivery
6. **Compression**: Compress files before storage
7. **Thumbnail Generation**: Pre-generate thumbnails for quick previews

### Limits

- Max file size: 500MB (configurable)
- Max concurrent uploads: 10 (configurable)
- Embedding chunk size: 512 tokens
- Search results: Top 20 most relevant
- OCR languages: English (expandable)

## Examples

### Complete Upload Flow

```tsx
import { FileUpload } from '@/components/files/FileUpload';
import { FilePreview } from '@/components/files/FilePreview';
import { useState } from 'react';

function FileManager() {
  const [files, setFiles] = useState<FileProcessingResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileProcessingResult | null>(null);

  return (
    <div>
      <FileUpload
        onUpload={(result) => {
          setFiles(prev => [...prev, result]);
        }}
        maxFiles={10}
      />

      <div className="file-grid">
        {files.map(file => (
          <div key={file.id} onClick={() => setSelectedFile(file)}>
            <img src={file.preview.thumbnail} alt={file.originalFile.name} />
            <p>{file.originalFile.name}</p>
          </div>
        ))}
      </div>

      {selectedFile && (
        <FilePreview
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

**Issue**: OCR not working
- **Solution**: Ensure Tesseract.js is properly loaded. Check browser console for errors.

**Issue**: Transcription fails
- **Solution**: Verify OPENAI_API_KEY is set and valid. Check API quota.

**Issue**: Files not uploading to S3
- **Solution**: Verify AWS credentials and bucket permissions.

**Issue**: Search returns no results
- **Solution**: Ensure files are properly indexed after processing.

**Issue**: Large files timing out
- **Solution**: Increase timeout limits or use chunked uploads.

## Future Enhancements

- [ ] Support for more file types (Figma, Sketch, etc.)
- [ ] Real-time collaboration on files
- [ ] Advanced OCR with multiple languages
- [ ] AI-powered content summarization
- [ ] Automatic tagging and categorization
- [ ] File version comparison
- [ ] Batch operations
- [ ] Advanced security scanning with external APIs
- [ ] Custom processors API
- [ ] Webhook notifications

## Contributing

To add a new file processor:

1. Create processor class in `src/lib/files/processors/`
2. Implement `FileProcessor` interface
3. Register processor in `FileProcessingPipeline`
4. Add file types to `SUPPORTED_FILE_TYPES`
5. Write tests
6. Update documentation

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/nexus-ai/issues
- Documentation: https://docs.nexus-ai.com
- Email: support@nexus-ai.com
