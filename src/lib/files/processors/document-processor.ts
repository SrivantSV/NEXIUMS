/**
 * Document Processor
 * Processes Word, Excel, PowerPoint, and other document files
 */

import { FileProcessor, ProcessedFileData, ProcessingOptions } from '@/types/files';
import { generateId } from '@/lib/utils/id';

export class DocumentProcessor implements FileProcessor {
  getSupportedTypes(): string[] {
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'];
  }

  async validate(file: File): Promise<boolean> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return !!extension && this.getSupportedTypes().includes(extension);
  }

  async process(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      if (extension === 'xlsx' || extension === 'xls') {
        return await this.processExcel(file, options);
      } else if (extension === 'docx' || extension === 'doc') {
        return await this.processWord(file, options);
      } else if (extension === 'pptx' || extension === 'ppt') {
        return await this.processPowerPoint(file, options);
      } else {
        return await this.processGenericDocument(file, options);
      }
    } catch (error) {
      console.error('[DocumentProcessor] Processing failed:', error);
      throw new Error(`Document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processExcel(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      // Use xlsx library to parse Excel files
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      let textContent = '';
      const structuredData: any = {};

      // Process each sheet
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        structuredData[sheetName] = jsonData;

        // Convert to text
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        textContent += `\n--- Sheet: ${sheetName} ---\n${csvText}\n`;
      });

      return {
        textContent: textContent.trim(),
        structuredData,
        metadata: {
          sheets: workbook.SheetNames,
          sheetCount: workbook.SheetNames.length,
        },
      };
    } catch (error) {
      console.error('[DocumentProcessor] Excel processing failed:', error);
      throw error;
    }
  }

  private async processWord(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      // Use mammoth library to extract text from Word documents
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();

      const result = await mammoth.extractRawText({ arrayBuffer });

      return {
        textContent: result.value,
        metadata: {
          fileName: file.name,
          size: file.size,
        },
      };
    } catch (error) {
      console.error('[DocumentProcessor] Word processing failed:', error);
      // Fallback: try to extract text using basic method
      return {
        textContent: '[Could not extract text from Word document]',
        metadata: {
          fileName: file.name,
          size: file.size,
          error: 'Text extraction failed',
        },
      };
    }
  }

  private async processPowerPoint(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      // PowerPoint processing is more complex
      // In production, you would use libraries like officegen or pptxtojson
      // For now, we'll return a placeholder

      return {
        textContent: '[PowerPoint processing not yet implemented]',
        metadata: {
          fileName: file.name,
          size: file.size,
        },
      };
    } catch (error) {
      console.error('[DocumentProcessor] PowerPoint processing failed:', error);
      throw error;
    }
  }

  private async processGenericDocument(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      // Try to read as text
      const textContent = await file.text();

      return {
        textContent,
        metadata: {
          fileName: file.name,
          size: file.size,
          type: file.type,
        },
      };
    } catch (error) {
      console.error('[DocumentProcessor] Generic document processing failed:', error);
      throw error;
    }
  }
}
