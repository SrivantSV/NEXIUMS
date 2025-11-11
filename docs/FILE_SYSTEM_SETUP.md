# File Processing System - Setup Guide

## Installation

### 1. Install Required Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install pdfjs-dist tesseract.js exifreader
npm install mammoth xlsx jszip yaml @iarna/toml
npm install sonner  # For toast notifications
```

### 2. Install Development Dependencies

```bash
npm install -D @types/pdfjs-dist
```

### 3. Environment Configuration

Create or update your `.env` file:

```env
# AWS S3 Configuration (Required for production)
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# OpenAI Configuration (Required for transcription and embeddings)
OPENAI_API_KEY=sk-your-openai-api-key

# Database (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/nexusai
```

### 4. Database Setup

Add the file schema to your Prisma schema:

```bash
# Copy the schema from prisma/schema-files.prisma to your main schema.prisma
# Then run migrations
npx prisma migrate dev --name add-file-system
npx prisma generate
```

### 5. AWS S3 Setup

1. Create an S3 bucket in AWS Console
2. Configure CORS for the bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

3. Create an IAM user with S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

### 6. OpenAI Setup

1. Get API key from https://platform.openai.com/api-keys
2. Add to environment variables
3. Ensure you have credits/usage quota

## Quick Start

### 1. Basic File Upload

```tsx
import { FileUpload } from '@/components/files/FileUpload';

function App() {
  return (
    <FileUpload
      onUpload={(result) => {
        console.log('File uploaded:', result);
      }}
    />
  );
}
```

### 2. File Processing

```tsx
import { processFile } from '@/lib/files/processor';

async function processMyFile(file: File) {
  const result = await processFile(file, userId, {
    enableOCR: true,
    enableTranscription: true,
    generateEmbeddings: true,
  });

  console.log('Processed:', result);
}
```

### 3. File Search

```tsx
import { getFileSearchEngine } from '@/lib/files/search-engine';

async function searchFiles(query: string) {
  const searchEngine = getFileSearchEngine();
  const results = await searchEngine.searchFiles(query, userId);
  return results;
}
```

## Configuration Options

### File Upload Limits

```tsx
<FileUpload
  maxFiles={10}                    // Max number of files
  maxSize={500 * 1024 * 1024}      // Max size per file (500MB)
  acceptedTypes={['pdf', 'jpg']}   // Allowed file types
/>
```

### Processing Options

```typescript
{
  enableOCR: true,              // Extract text from images
  enableTranscription: true,    // Transcribe audio/video
  enableVisionAnalysis: true,   // Analyze images
  enableCodeAnalysis: true,     // Parse and analyze code
  enableSecurityScan: true,     // Scan for security threats
  generateEmbeddings: true,     // Create vector embeddings
  generateThumbnail: true,      // Generate preview thumbnails
  extractImages: true,          // Extract images from PDFs
  language: 'eng',              // OCR language
  quality: 'high',              // Processing quality
}
```

## Testing

### 1. Test File Upload

```bash
# Upload a test file via API
curl -X POST http://localhost:3000/api/files \
  -H "Content-Type: application/json" \
  -d @test-file.json
```

### 2. Test File Search

```bash
# Search files
curl "http://localhost:3000/api/files/search?q=test&fileType=pdf"
```

### 3. Manual Testing

1. Start development server: `npm run dev`
2. Navigate to your file upload page
3. Upload various file types
4. Verify processing results
5. Test search functionality

## Troubleshooting

### Common Issues

**Issue**: "AWS credentials not configured"
- Check `.env` file has correct AWS credentials
- Verify credentials have S3 permissions
- Test with AWS CLI: `aws s3 ls s3://your-bucket-name`

**Issue**: "OpenAI API error"
- Verify API key is correct
- Check API quota/credits
- Test API: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

**Issue**: "Database connection error"
- Verify DATABASE_URL is correct
- Check database is running
- Run migrations: `npx prisma migrate dev`

**Issue**: "File processing timeout"
- Increase timeout in Next.js config
- Use smaller files for testing
- Check network connectivity

**Issue**: "PDF.js worker error"
- Ensure PDF.js worker is loaded correctly
- Check CDN availability
- Use local worker file if needed

## Development Mode

For development without AWS/OpenAI:

```env
# Use local storage (no AWS needed)
# AWS_S3_BUCKET=
# AWS_ACCESS_KEY_ID=

# Skip transcription/embeddings (no OpenAI needed)
# OPENAI_API_KEY=
```

The system will fallback to:
- Local file storage (in-memory)
- Skip transcription (return placeholder)
- Skip embeddings (return zero vectors)

## Production Checklist

- [ ] AWS S3 bucket configured with proper CORS
- [ ] AWS IAM user with minimal required permissions
- [ ] OpenAI API key with sufficient quota
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] File size limits configured
- [ ] Rate limiting enabled
- [ ] Security scanning enabled
- [ ] CDN configured for file delivery
- [ ] Backup strategy for uploaded files
- [ ] Monitoring and logging setup
- [ ] Error tracking configured

## Performance Tips

1. **Use CDN**: Serve files through CloudFront or similar
2. **Enable Caching**: Cache processed results
3. **Lazy Loading**: Load file content on demand
4. **Compression**: Enable gzip/brotli compression
5. **Parallel Processing**: Process multiple files concurrently
6. **Thumbnail Generation**: Generate thumbnails for quick previews
7. **Pagination**: Load files in batches
8. **Indexing**: Create database indexes for common queries

## Security Best Practices

1. **Validate All Uploads**: Check file types, sizes, and content
2. **Scan for Malware**: Use security scanning service
3. **Sanitize Filenames**: Remove special characters
4. **Use Signed URLs**: Don't expose direct S3 URLs
5. **Implement Rate Limiting**: Prevent abuse
6. **Encrypt Sensitive Files**: Use S3 encryption
7. **Audit Logging**: Track all file operations
8. **Access Control**: Implement proper permissions

## Monitoring

### Key Metrics to Track

- Upload success/failure rate
- Processing time per file type
- Storage usage
- API costs (OpenAI, AWS)
- Error rates
- Search performance
- User engagement

### Recommended Tools

- AWS CloudWatch for S3 metrics
- Application monitoring (Sentry, DataDog)
- Custom dashboards for file analytics
- Log aggregation (ELK, CloudWatch Logs)

## Support

For issues and questions:
- Documentation: `/docs/FILE_PROCESSING_SYSTEM.md`
- GitHub Issues: Create an issue with details
- Community: Join our Discord server

## Next Steps

1. Review the main documentation: `FILE_PROCESSING_SYSTEM.md`
2. Explore example implementations
3. Test with different file types
4. Integrate with your chat interface
5. Monitor performance and optimize
6. Scale as needed

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
