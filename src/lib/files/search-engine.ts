/**
 * File Search Engine
 * Provides semantic and full-text search for files
 */

import {
  FileProcessingResult,
  FileSearchResult,
  SearchFilters,
  FileEmbedding,
  FileCategory,
} from '@/types/files';
import { EmbeddingService } from './embedding-service';

interface FileIndex {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  category: FileCategory;
  content: string;
  metadata: any;
  embeddings: FileEmbedding[];
  createdAt: Date;
  tags: string[];
}

export class FileSearchEngine {
  private embeddingService: EmbeddingService;
  private fileIndex: Map<string, FileIndex> = new Map();

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Index a processed file for search
   */
  async indexFile(fileResult: FileProcessingResult): Promise<void> {
    try {
      const index: FileIndex = {
        id: fileResult.id,
        userId: fileResult.userId,
        fileName: fileResult.originalFile.name,
        fileType: fileResult.originalFile.type,
        category: fileResult.originalFile.category || 'other',
        content: fileResult.processedData.textContent || '',
        metadata: fileResult.originalFile,
        embeddings: fileResult.embeddings,
        createdAt: fileResult.createdAt,
        tags: this.generateTags(fileResult),
      };

      this.fileIndex.set(fileResult.id, index);

      console.log(`[FileSearchEngine] Indexed file: ${fileResult.originalFile.name}`);
    } catch (error) {
      console.error('[FileSearchEngine] Indexing failed:', error);
      throw error;
    }
  }

  /**
   * Search files using hybrid semantic + full-text search
   */
  async searchFiles(
    query: string,
    userId: string,
    filters: SearchFilters = {}
  ): Promise<FileSearchResult[]> {
    try {
      console.log(`[FileSearchEngine] Searching for: "${query}"`);

      // Filter files by user and filters
      const candidateFiles = this.filterFiles(userId, filters);

      if (candidateFiles.length === 0) {
        return [];
      }

      // Perform semantic search
      const semanticResults = await this.semanticSearch(query, candidateFiles);

      // Perform full-text search
      const fullTextResults = this.fullTextSearch(query, candidateFiles);

      // Combine and rank results
      const combinedResults = this.combineResults(semanticResults, fullTextResults);

      // Sort by score (descending)
      combinedResults.sort((a, b) => b.score - a.score);

      // Return top 20 results
      return combinedResults.slice(0, 20);
    } catch (error) {
      console.error('[FileSearchEngine] Search failed:', error);
      return [];
    }
  }

  /**
   * Semantic search using vector similarity
   */
  private async semanticSearch(
    query: string,
    files: FileIndex[]
  ): Promise<Map<string, { score: number; highlights: string[] }>> {
    const results = new Map<string, { score: number; highlights: string[] }>();

    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Calculate similarity for each file
      for (const file of files) {
        if (file.embeddings.length === 0) continue;

        let maxSimilarity = 0;
        let bestChunk = '';

        // Find best matching chunk
        for (const embedding of file.embeddings) {
          const similarity = this.embeddingService.cosineSimilarity(
            queryEmbedding,
            embedding.embedding
          );

          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestChunk = embedding.text;
          }
        }

        if (maxSimilarity > 0.5) { // Threshold for relevance
          results.set(file.id, {
            score: maxSimilarity,
            highlights: [bestChunk.substring(0, 200)],
          });
        }
      }
    } catch (error) {
      console.error('[FileSearchEngine] Semantic search failed:', error);
    }

    return results;
  }

  /**
   * Full-text search using keyword matching
   */
  private fullTextSearch(
    query: string,
    files: FileIndex[]
  ): Map<string, { score: number; highlights: string[] }> {
    const results = new Map<string, { score: number; highlights: string[] }>();
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    for (const file of files) {
      const content = file.content.toLowerCase();
      const fileName = file.fileName.toLowerCase();

      let score = 0;
      const highlights: string[] = [];

      // Check filename matches (higher weight)
      for (const term of queryTerms) {
        if (fileName.includes(term)) {
          score += 10;
        }
      }

      // Check content matches
      for (const term of queryTerms) {
        const regex = new RegExp(term, 'gi');
        const matches = content.match(regex);

        if (matches) {
          score += matches.length;

          // Extract highlights
          const snippets = this.extractSnippets(file.content, term, 100);
          highlights.push(...snippets.slice(0, 3));
        }
      }

      // Check tags
      for (const term of queryTerms) {
        for (const tag of file.tags) {
          if (tag.toLowerCase().includes(term)) {
            score += 5;
          }
        }
      }

      if (score > 0) {
        // Normalize score (0-1)
        const normalizedScore = Math.min(1, score / 50);
        results.set(file.id, {
          score: normalizedScore,
          highlights: highlights.slice(0, 3),
        });
      }
    }

    return results;
  }

  /**
   * Combine semantic and full-text results
   */
  private combineResults(
    semanticResults: Map<string, { score: number; highlights: string[] }>,
    fullTextResults: Map<string, { score: number; highlights: string[] }>
  ): FileSearchResult[] {
    const combinedResults: FileSearchResult[] = [];
    const allFileIds = new Set([
      ...semanticResults.keys(),
      ...fullTextResults.keys(),
    ]);

    for (const fileId of allFileIds) {
      const file = this.fileIndex.get(fileId);
      if (!file) continue;

      const semanticResult = semanticResults.get(fileId);
      const fullTextResult = fullTextResults.get(fileId);

      // Weighted combination: 60% semantic, 40% full-text
      const semanticScore = semanticResult ? semanticResult.score * 0.6 : 0;
      const fullTextScore = fullTextResult ? fullTextResult.score * 0.4 : 0;
      const combinedScore = semanticScore + fullTextScore;

      // Combine highlights
      const allHighlights = [
        ...(semanticResult?.highlights || []),
        ...(fullTextResult?.highlights || []),
      ];

      // Determine match type
      let matchType: 'semantic' | 'fulltext' | 'hybrid' = 'hybrid';
      if (semanticScore > 0 && fullTextScore === 0) {
        matchType = 'semantic';
      } else if (fullTextScore > 0 && semanticScore === 0) {
        matchType = 'fulltext';
      }

      // Reconstruct file result (simplified - would fetch from database in production)
      const fileResult: any = {
        id: file.id,
        userId: file.userId,
        originalFile: file.metadata,
        processedData: { textContent: file.content },
        analysis: {},
        extractedContent: [],
        embeddings: [],
        preview: { type: 'text', content: file.content.substring(0, 200) },
        securityScan: { hasThreat: false, threats: [], scanTime: 0 },
        processingTime: 0,
        status: 'completed' as const,
        createdAt: file.createdAt,
        updatedAt: file.createdAt,
      };

      combinedResults.push({
        file: fileResult,
        score: combinedScore,
        highlights: [
          {
            field: 'content',
            snippets: allHighlights.slice(0, 3),
          },
        ],
        matchType,
      });
    }

    return combinedResults;
  }

  /**
   * Filter files by user and criteria
   */
  private filterFiles(userId: string, filters: SearchFilters): FileIndex[] {
    let files = Array.from(this.fileIndex.values()).filter(
      file => file.userId === userId
    );

    // Apply file type filter
    if (filters.fileType) {
      const types = Array.isArray(filters.fileType) ? filters.fileType : [filters.fileType];
      files = files.filter(file => types.includes(file.fileType));
    }

    // Apply category filter
    if (filters.category) {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      files = files.filter(file => categories.includes(file.category));
    }

    // Apply date range filter
    if (filters.dateRange) {
      files = files.filter(file => {
        const fileDate = new Date(file.createdAt);
        return fileDate >= filters.dateRange!.start && fileDate <= filters.dateRange!.end;
      });
    }

    // Apply size filter
    if (filters.minSize !== undefined) {
      files = files.filter(file => file.metadata.size >= filters.minSize!);
    }

    if (filters.maxSize !== undefined) {
      files = files.filter(file => file.metadata.size <= filters.maxSize!);
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      files = files.filter(file =>
        filters.tags!.some(tag => file.tags.includes(tag))
      );
    }

    return files;
  }

  /**
   * Extract text snippets around a search term
   */
  private extractSnippets(text: string, term: string, contextLength: number): string[] {
    const snippets: string[] = [];
    const regex = new RegExp(term, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - contextLength);
      const end = Math.min(text.length, match.index + term.length + contextLength);

      let snippet = text.substring(start, end);

      // Add ellipsis
      if (start > 0) snippet = '...' + snippet;
      if (end < text.length) snippet = snippet + '...';

      snippets.push(snippet);

      if (snippets.length >= 3) break;
    }

    return snippets;
  }

  /**
   * Generate tags for a file
   */
  private generateTags(fileResult: FileProcessingResult): string[] {
    const tags: string[] = [];

    // Add file extension
    if (fileResult.originalFile.extension) {
      tags.push(fileResult.originalFile.extension);
    }

    // Add category
    if (fileResult.originalFile.category) {
      tags.push(fileResult.originalFile.category);
    }

    // Add metadata tags
    if (fileResult.analysis.textAnalysis?.keywords) {
      const topKeywords = fileResult.analysis.textAnalysis.keywords
        .slice(0, 5)
        .map(k => k.word);
      tags.push(...topKeywords);
    }

    // Add code language
    if (fileResult.analysis.codeAnalysis?.language) {
      tags.push(fileResult.analysis.codeAnalysis.language);
    }

    return tags;
  }

  /**
   * Get file by ID
   */
  getFile(fileId: string): FileIndex | undefined {
    return this.fileIndex.get(fileId);
  }

  /**
   * Remove file from index
   */
  removeFile(fileId: string): void {
    this.fileIndex.delete(fileId);
  }

  /**
   * Get all files for a user
   */
  getUserFiles(userId: string): FileIndex[] {
    return Array.from(this.fileIndex.values()).filter(
      file => file.userId === userId
    );
  }

  /**
   * Clear all indexed files
   */
  clear(): void {
    this.fileIndex.clear();
  }
}

// Singleton instance
let searchEngineInstance: FileSearchEngine | null = null;

export function getFileSearchEngine(): FileSearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new FileSearchEngine();
  }
  return searchEngineInstance;
}
