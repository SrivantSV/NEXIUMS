// Vector Store for Semantic Search
// Handles embedding storage and similarity search

import {
  VectorSearchRequest,
  VectorSearchResult,
  Embedding,
} from '@/types/memory';

export class VectorStore {
  private embeddings: Map<string, Embedding>;
  private index: Map<string, number[]>; // Simple in-memory index

  constructor() {
    this.embeddings = new Map();
    this.index = new Map();
  }

  /**
   * Add embedding to vector store
   */
  async addEmbedding(embedding: Embedding): Promise<void> {
    this.embeddings.set(embedding.id, embedding);
    this.index.set(embedding.id, embedding.vector);
  }

  /**
   * Add multiple embeddings
   */
  async addEmbeddings(embeddings: Embedding[]): Promise<void> {
    for (const embedding of embeddings) {
      await this.addEmbedding(embedding);
    }
  }

  /**
   * Search for similar vectors
   */
  async search(request: VectorSearchRequest): Promise<VectorSearchResult[]> {
    const { vector, topK, filter } = request;
    const results: VectorSearchResult[] = [];

    // Calculate similarity for all embeddings
    for (const [id, embedding] of this.embeddings) {
      // Apply filters
      if (filter && !this.matchesFilter(embedding, filter)) {
        continue;
      }

      const storedVector = this.index.get(id);
      if (!storedVector) continue;

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(vector, storedVector);

      results.push({
        id,
        score: similarity,
        content: embedding.content,
        metadata: embedding.metadata,
      });
    }

    // Sort by similarity and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Get embedding by ID
   */
  async getEmbedding(id: string): Promise<Embedding | null> {
    return this.embeddings.get(id) || null;
  }

  /**
   * Delete embedding
   */
  async deleteEmbedding(id: string): Promise<boolean> {
    const deleted = this.embeddings.delete(id);
    this.index.delete(id);
    return deleted;
  }

  /**
   * Update embedding
   */
  async updateEmbedding(id: string, embedding: Embedding): Promise<void> {
    this.embeddings.set(id, embedding);
    this.index.set(id, embedding.vector);
  }

  /**
   * Clear all embeddings
   */
  async clear(): Promise<void> {
    this.embeddings.clear();
    this.index.clear();
  }

  /**
   * Get total count
   */
  async count(): Promise<number> {
    return this.embeddings.size;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Check if embedding matches filter criteria
   */
  private matchesFilter(embedding: Embedding, filter: any): boolean {
    if (filter.userId && embedding.metadata.userId !== filter.userId) {
      return false;
    }

    if (filter.projectId && embedding.metadata.projectId !== filter.projectId) {
      return false;
    }

    if (filter.conversationId && embedding.metadata.conversationId !== filter.conversationId) {
      return false;
    }

    if (filter.dateRange) {
      const embeddingDate = embedding.createdAt;
      if (embeddingDate < filter.dateRange.start || embeddingDate > filter.dateRange.end) {
        return false;
      }
    }

    if (filter.metadata) {
      for (const [key, value] of Object.entries(filter.metadata)) {
        if (embedding.metadata[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Batch search for multiple queries
   */
  async batchSearch(requests: VectorSearchRequest[]): Promise<VectorSearchResult[][]> {
    return Promise.all(requests.map(req => this.search(req)));
  }

  /**
   * Get statistics about the vector store
   */
  async getStats(): Promise<{
    total: number;
    byUserId: Map<string, number>;
    byProjectId: Map<string, number>;
    avgVectorLength: number;
  }> {
    const byUserId = new Map<string, number>();
    const byProjectId = new Map<string, number>();
    let totalVectorLength = 0;

    for (const embedding of this.embeddings.values()) {
      const userId = embedding.metadata.userId;
      const projectId = embedding.metadata.projectId;

      if (userId) {
        byUserId.set(userId, (byUserId.get(userId) || 0) + 1);
      }

      if (projectId) {
        byProjectId.set(projectId, (byProjectId.get(projectId) || 0) + 1);
      }

      totalVectorLength += embedding.vector.length;
    }

    return {
      total: this.embeddings.size,
      byUserId,
      byProjectId,
      avgVectorLength: this.embeddings.size > 0
        ? totalVectorLength / this.embeddings.size
        : 0,
    };
  }
}
