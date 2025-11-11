/**
 * Data Processor
 * Processes JSON, XML, CSV, YAML, and database files
 */

import { FileProcessor, ProcessedFileData, ProcessingOptions, DataSchema } from '@/types/files';

export class DataProcessor implements FileProcessor {
  getSupportedTypes(): string[] {
    return ['json', 'xml', 'yaml', 'yml', 'toml', 'csv', 'tsv', 'sqlite', 'db'];
  }

  async validate(file: File): Promise<boolean> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return !!extension && this.getSupportedTypes().includes(extension);
  }

  async process(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      switch (extension) {
        case 'json':
          return await this.processJSON(file);
        case 'xml':
          return await this.processXML(file);
        case 'yaml':
        case 'yml':
          return await this.processYAML(file);
        case 'csv':
        case 'tsv':
          return await this.processCSV(file, extension === 'tsv' ? '\t' : ',');
        case 'toml':
          return await this.processTOML(file);
        case 'sqlite':
        case 'db':
          return await this.processDatabase(file);
        default:
          throw new Error(`Unsupported data file type: ${extension}`);
      }
    } catch (error) {
      console.error('[DataProcessor] Processing failed:', error);
      throw new Error(`Data processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processJSON(file: File): Promise<ProcessedFileData> {
    const textContent = await file.text();

    try {
      const structuredData = JSON.parse(textContent);
      const dataSchema = this.inferSchema(structuredData);

      return {
        textContent,
        structuredData,
        dataSchema,
        metadata: {
          format: 'json',
          isArray: Array.isArray(structuredData),
          itemCount: Array.isArray(structuredData) ? structuredData.length : 1,
        },
      };
    } catch (error) {
      throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }

  private async processXML(file: File): Promise<ProcessedFileData> {
    const textContent = await file.text();

    try {
      // Parse XML using DOMParser
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(textContent, 'text/xml');

      // Check for parse errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML');
      }

      // Convert XML to JSON-like structure
      const structuredData = this.xmlToJson(xmlDoc.documentElement);

      return {
        textContent,
        structuredData,
        metadata: {
          format: 'xml',
          rootElement: xmlDoc.documentElement.tagName,
        },
      };
    } catch (error) {
      throw new Error(`Invalid XML: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }

  private async processYAML(file: File): Promise<ProcessedFileData> {
    const textContent = await file.text();

    try {
      // Import yaml library dynamically
      const yaml = await import('yaml');
      const structuredData = yaml.parse(textContent);
      const dataSchema = this.inferSchema(structuredData);

      return {
        textContent,
        structuredData,
        dataSchema,
        metadata: {
          format: 'yaml',
          isArray: Array.isArray(structuredData),
        },
      };
    } catch (error) {
      throw new Error(`Invalid YAML: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }

  private async processCSV(file: File, delimiter: string): Promise<ProcessedFileData> {
    const textContent = await file.text();
    const lines = textContent.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    // Parse CSV
    const headers = this.parseCSVLine(lines[0], delimiter);
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter);
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row);
    }

    const dataSchema = this.inferSchema(rows);

    return {
      textContent,
      structuredData: rows,
      dataSchema,
      metadata: {
        format: delimiter === '\t' ? 'tsv' : 'csv',
        rowCount: rows.length,
        columnCount: headers.length,
        columns: headers,
      },
    };
  }

  private async processTOML(file: File): Promise<ProcessedFileData> {
    const textContent = await file.text();

    try {
      // Import toml library dynamically
      const TOML = await import('@iarna/toml');
      const structuredData = TOML.parse(textContent);

      return {
        textContent,
        structuredData,
        metadata: {
          format: 'toml',
        },
      };
    } catch (error) {
      throw new Error(`Invalid TOML: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }

  private async processDatabase(file: File): Promise<ProcessedFileData> {
    // Database processing requires server-side implementation with sql.js
    return {
      textContent: '[Database file detected - requires server-side processing]',
      metadata: {
        format: 'sqlite',
        fileName: file.name,
        size: file.size,
      },
    };
  }

  private parseCSVLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  private xmlToJson(xml: Element): any {
    const obj: any = {};

    // Add attributes
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let i = 0; i < xml.attributes.length; i++) {
        const attr = xml.attributes[i];
        obj['@attributes'][attr.name] = attr.value;
      }
    }

    // Add child nodes
    if (xml.childNodes.length > 0) {
      for (let i = 0; i < xml.childNodes.length; i++) {
        const node = xml.childNodes[i];

        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (text) {
            obj['#text'] = text;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const nodeName = element.nodeName;

          if (!obj[nodeName]) {
            obj[nodeName] = this.xmlToJson(element);
          } else {
            if (!Array.isArray(obj[nodeName])) {
              obj[nodeName] = [obj[nodeName]];
            }
            obj[nodeName].push(this.xmlToJson(element));
          }
        }
      }
    }

    return obj;
  }

  private inferSchema(data: any): DataSchema {
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { type: 'array', items: { type: 'primitive' } };
      }

      const itemSchema = this.inferSchema(data[0]);
      return {
        type: 'array',
        items: itemSchema,
      };
    } else if (typeof data === 'object' && data !== null) {
      const properties: Record<string, DataSchema> = {};
      const required: string[] = [];

      for (const key in data) {
        properties[key] = this.inferSchema(data[key]);
        if (data[key] !== null && data[key] !== undefined) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required,
      };
    } else {
      return {
        type: 'primitive',
        description: typeof data,
      };
    }
  }
}
