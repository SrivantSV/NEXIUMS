/**
 * Image Processor
 * Processes images with vision analysis and EXIF extraction
 */

import { FileProcessor, ProcessedFileData, ProcessingOptions, ExtractedImage } from '@/types/files';
import { generateId } from '@/lib/utils/id';

export class ImageProcessor implements FileProcessor {
  getSupportedTypes(): string[] {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'heic', 'avif'];
  }

  async validate(file: File): Promise<boolean> {
    return file.type.startsWith('image/');
  }

  async process(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      const arrayBuffer = await file.arrayBuffer();

      // Extract EXIF metadata
      const metadata = await this.extractEXIFData(arrayBuffer, file);

      // Create image URL
      const imageUrl = URL.createObjectURL(file);

      // Get image dimensions
      const dimensions = await this.getImageDimensions(imageUrl);

      // Perform OCR if enabled
      let textContent = '';
      if (options.enableOCR) {
        try {
          textContent = await this.performOCR(imageUrl);
        } catch (error) {
          console.warn('[ImageProcessor] OCR failed:', error);
        }
      }

      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(imageUrl, 200, 200);

      // Create extracted image
      const extractedImage: ExtractedImage = {
        id: generateId(),
        src: imageUrl,
        width: dimensions.width,
        height: dimensions.height,
        thumbnail,
        format: file.type.split('/')[1],
        size: file.size,
      };

      // Perform vision analysis if enabled
      if (options.enableVisionAnalysis) {
        try {
          extractedImage.analysis = await this.performVisionAnalysis(imageUrl);
        } catch (error) {
          console.warn('[ImageProcessor] Vision analysis failed:', error);
        }
      }

      return {
        textContent,
        images: [extractedImage],
        metadata: {
          ...metadata,
          dimensions,
        },
      };
    } catch (error) {
      console.error('[ImageProcessor] Processing failed:', error);
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractEXIFData(arrayBuffer: ArrayBuffer, file: File): Promise<any> {
    try {
      // Import exifreader dynamically
      const ExifReader = await import('exifreader');
      const tags = ExifReader.load(arrayBuffer);

      return {
        camera: {
          make: tags.Make?.description,
          model: tags.Model?.description,
          lens: tags.LensModel?.description,
        },
        settings: {
          iso: tags.ISOSpeedRatings?.description,
          aperture: tags.FNumber?.description,
          shutterSpeed: tags.ExposureTime?.description,
          focalLength: tags.FocalLength?.description,
          flash: tags.Flash?.description,
          whiteBalance: tags.WhiteBalance?.description,
        },
        location: {
          latitude: this.convertGPSToDecimal(tags.GPSLatitude, tags.GPSLatitudeRef),
          longitude: this.convertGPSToDecimal(tags.GPSLongitude, tags.GPSLongitudeRef),
          altitude: tags.GPSAltitude?.description,
        },
        dateTime: tags.DateTime?.description || tags.DateTimeOriginal?.description,
        width: tags['Image Width']?.value || tags.PixelXDimension?.value,
        height: tags['Image Height']?.value || tags.PixelYDimension?.value,
        orientation: tags.Orientation?.description,
        software: tags.Software?.description,
        copyright: tags.Copyright?.description,
      };
    } catch (error) {
      console.warn('[ImageProcessor] EXIF extraction failed:', error);
      return {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };
    }
  }

  private convertGPSToDecimal(coordinate: any, ref: any): number | undefined {
    if (!coordinate || !ref) return undefined;

    try {
      const degrees = coordinate.description.split(',');
      const decimal =
        parseFloat(degrees[0]) +
        parseFloat(degrees[1]) / 60 +
        parseFloat(degrees[2]) / 3600;

      return ref.description === 'S' || ref.description === 'W' ? -decimal : decimal;
    } catch (error) {
      return undefined;
    }
  }

  private async getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (typeof Image === 'undefined') {
        resolve({ width: 0, height: 0 });
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = imageUrl;
    });
  }

  private async generateThumbnail(
    imageUrl: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<string> {
    try {
      if (typeof document === 'undefined') {
        return imageUrl; // Return original if not in browser
      }

      const img = await this.loadImage(imageUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return imageUrl;
      }

      // Calculate thumbnail dimensions
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw thumbnail
      ctx.drawImage(img, 0, 0, width, height);

      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.warn('[ImageProcessor] Thumbnail generation failed:', error);
      return imageUrl;
    }
  }

  private async loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  private async performOCR(imageUrl: string): Promise<string> {
    try {
      // Import Tesseract.js dynamically
      const Tesseract = await import('tesseract.js');

      const { data: { text } } = await Tesseract.recognize(
        imageUrl,
        'eng',
        {
          logger: () => {}, // Disable logging
        }
      );

      return text;
    } catch (error) {
      console.error('[ImageProcessor] OCR failed:', error);
      return '';
    }
  }

  private async performVisionAnalysis(imageUrl: string): Promise<any> {
    try {
      // In production, you would call vision APIs like OpenAI Vision, Google Vision, etc.
      // For now, we'll return a placeholder structure

      // Note: This would require API integration
      // Example: const response = await fetch('/api/vision/analyze', { ... });

      return {
        labels: [],
        objects: [],
        faces: [],
        colors: await this.extractDominantColors(imageUrl),
        quality: {
          brightness: 0.5,
          contrast: 0.5,
          sharpness: 0.5,
          noise: 0.1,
        },
      };
    } catch (error) {
      console.error('[ImageProcessor] Vision analysis failed:', error);
      return null;
    }
  }

  private async extractDominantColors(imageUrl: string): Promise<Array<{ color: string; percentage: number }>> {
    try {
      if (typeof document === 'undefined') {
        return [];
      }

      const img = await this.loadImage(imageUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return [];
      }

      // Scale down for performance
      const scale = 0.1;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Count color frequencies
      const colorMap = new Map<string, number>();
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        // Quantize colors to reduce variations
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        const color = `rgb(${r}, ${g}, ${b})`;

        colorMap.set(color, (colorMap.get(color) || 0) + 1);
      }

      // Get top 5 colors
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color, count]) => ({
          color,
          percentage: count / pixelCount,
        }));

      return sortedColors;
    } catch (error) {
      console.error('[ImageProcessor] Color extraction failed:', error);
      return [];
    }
  }
}
