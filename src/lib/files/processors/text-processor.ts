/**
 * Text Processor
 * Processes plain text, Markdown, RTF, and SVG files
 */

import { FileProcessor, ProcessedFileData, ProcessingOptions } from '@/types/files';

export class TextProcessor implements FileProcessor {
  getSupportedTypes(): string[] {
    return ['txt', 'md', 'rtf', 'svg'];
  }

  async validate(file: File): Promise<boolean> {
    return file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.svg');
  }

  async process(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      const textContent = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase() || 'txt';

      const metadata: any = {
        fileName: file.name,
        size: file.size,
        type: file.type,
        extension,
        encoding: 'utf-8',
      };

      // Special handling for Markdown
      if (extension === 'md') {
        metadata.isMarkdown = true;
        metadata.headings = this.extractMarkdownHeadings(textContent);
        metadata.links = this.extractMarkdownLinks(textContent);
        metadata.images = this.extractMarkdownImages(textContent);
        metadata.codeBlocks = this.extractMarkdownCodeBlocks(textContent);
      }

      // Special handling for SVG
      if (extension === 'svg') {
        metadata.isSVG = true;
        metadata.dimensions = this.extractSVGDimensions(textContent);
      }

      return {
        textContent,
        metadata,
      };
    } catch (error) {
      console.error('[TextProcessor] Processing failed:', error);
      throw new Error(`Text processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractMarkdownHeadings(markdown: string): Array<{ level: number; text: string; line: number }> {
    const headings: Array<{ level: number; text: string; line: number }> = [];
    const lines = markdown.split('\n');

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2],
          line: index + 1,
        });
      }
    });

    return headings;
  }

  private extractMarkdownLinks(markdown: string): Array<{ text: string; url: string }> {
    const links: Array<{ text: string; url: string }> = [];
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkPattern.exec(markdown)) !== null) {
      links.push({
        text: match[1],
        url: match[2],
      });
    }

    return links;
  }

  private extractMarkdownImages(markdown: string): Array<{ alt: string; url: string }> {
    const images: Array<{ alt: string; url: string }> = [];
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imagePattern.exec(markdown)) !== null) {
      images.push({
        alt: match[1],
        url: match[2],
      });
    }

    return images;
  }

  private extractMarkdownCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
    const codeBlocks: Array<{ language: string; code: string }> = [];
    const codeBlockPattern = /```(\w*)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockPattern.exec(markdown)) !== null) {
      codeBlocks.push({
        language: match[1] || 'plaintext',
        code: match[2],
      });
    }

    return codeBlocks;
  }

  private extractSVGDimensions(svg: string): { width?: string; height?: string; viewBox?: string } {
    const dimensions: any = {};

    const widthMatch = svg.match(/width="([^"]+)"/);
    if (widthMatch) {
      dimensions.width = widthMatch[1];
    }

    const heightMatch = svg.match(/height="([^"]+)"/);
    if (heightMatch) {
      dimensions.height = heightMatch[1];
    }

    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      dimensions.viewBox = viewBoxMatch[1];
    }

    return dimensions;
  }
}
