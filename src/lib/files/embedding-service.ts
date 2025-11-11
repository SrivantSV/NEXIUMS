/**
 * Embedding Service
 * Generates vector embeddings for file content
 */

export class EmbeddingService {
  private readonly apiKey: string;
  private readonly model: string = 'text-embedding-3-small';
  private readonly batchSize: number = 100;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      console.warn('[EmbeddingService] OpenAI API key not configured, returning zero vector');
      return new Array(1536).fill(0); // text-embedding-3-small dimension
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: text.substring(0, 8000), // Limit to ~8k tokens
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('[EmbeddingService] Failed to generate embedding:', error);
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);

      try {
        const batchEmbeddings = await this.generateEmbeddingsBatch(batch);
        embeddings.push(...batchEmbeddings);
      } catch (error) {
        console.error(`[EmbeddingService] Failed to generate embeddings for batch ${i}:`, error);
        // Add zero vectors for failed batch
        embeddings.push(...batch.map(() => new Array(1536).fill(0)));
      }
    }

    return embeddings;
  }

  private async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      return texts.map(() => new Array(1536).fill(0));
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: texts.map(t => t.substring(0, 8000)),
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('[EmbeddingService] Batch embedding failed:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}
