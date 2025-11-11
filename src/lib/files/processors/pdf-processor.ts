/**
 * PDF Processor
 * Processes PDF files with OCR capabilities
 */

import { FileProcessor, ProcessedFileData, ProcessingOptions, ExtractedImage } from '@/types/files';
import { generateId } from '@/lib/utils/id';

export class PDFProcessor implements FileProcessor {
  getSupportedTypes(): string[] {
    return ['pdf'];
  }

  async validate(file: File): Promise<boolean> {
    return file.type === 'application/pdf' || file.name.endsWith('.pdf');
  }

  async process(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      // For browser environment, we'll use PDF.js
      if (typeof window !== 'undefined') {
        return await this.processPDFBrowser(file, options);
      } else {
        // For server-side, we'll use a different approach
        return await this.processPDFServer(file, options);
      }
    } catch (error) {
      console.error('[PDFProcessor] Processing failed:', error);
      throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processPDFBrowser(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    // Import PDF.js dynamically
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker source
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let textContent = '';
    const images: ExtractedImage[] = [];
    const metadata: any = {};

    // Extract metadata
    try {
      const info = await pdf.getMetadata();
      metadata.title = info.info?.Title;
      metadata.author = info.info?.Author;
      metadata.subject = info.info?.Subject;
      metadata.keywords = info.info?.Keywords;
      metadata.creator = info.info?.Creator;
      metadata.producer = info.info?.Producer;
      metadata.creationDate = info.info?.CreationDate;
      metadata.modificationDate = info.info?.ModDate;
      metadata.pageCount = pdf.numPages;
    } catch (error) {
      console.warn('[PDFProcessor] Could not extract metadata:', error);
    }

    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);

        // Extract text
        const textContentObj = await page.getTextContent();
        const pageText = textContentObj.items
          .map((item: any) => item.str)
          .join(' ');
        textContent += `\n--- Page ${i} ---\n${pageText}\n`;

        // Extract images if requested
        if (options.extractImages) {
          // Note: In production, you'd render the page to canvas and extract images
          // For now, we'll just capture the page as an image
          if (typeof document !== 'undefined') {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (context) {
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              await page.render({
                canvasContext: context,
                viewport: viewport,
              }).promise;

              const imageDataUrl = canvas.toDataURL('image/png');
              images.push({
                id: generateId(),
                src: imageDataUrl,
                width: viewport.width,
                height: viewport.height,
                page: i,
                format: 'png',
              });
            }
          }
        }

        // Perform OCR if text is sparse and OCR is enabled
        if (options.enableOCR && pageText.trim().length < 50) {
          try {
            const ocrText = await this.performOCR(images[images.length - 1]?.src);
            if (ocrText) {
              textContent += `\n[OCR] ${ocrText}\n`;
            }
          } catch (error) {
            console.warn(`[PDFProcessor] OCR failed for page ${i}:`, error);
          }
        }
      } catch (error) {
        console.warn(`[PDFProcessor] Error processing page ${i}:`, error);
      }
    }

    return {
      textContent: textContent.trim(),
      images,
      metadata,
    };
  }

  private async processPDFServer(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    // For server-side processing, we'll extract text using a simpler method
    // In production, you'd use libraries like pdf-parse or pdfjs-dist on Node.js

    const text = await file.text();

    return {
      textContent: text,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    };
  }

  private async performOCR(imageDataUrl: string): Promise<string> {
    if (!imageDataUrl) return '';

    try {
      // Import Tesseract.js dynamically
      const Tesseract = await import('tesseract.js');

      const { data: { text } } = await Tesseract.recognize(
        imageDataUrl,
        'eng',
        {
          logger: () => {}, // Disable logging
        }
      );

      return text;
    } catch (error) {
      console.error('[PDFProcessor] OCR failed:', error);
      return '';
    }
  }
}
