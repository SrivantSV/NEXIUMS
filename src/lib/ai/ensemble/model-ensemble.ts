/**
 * Model Ensemble System
 * Combine multiple models for enhanced results
 */

import {
  EnsembleRequest,
  EnsembleResponse,
  CompletionRequest,
  CompletionResponse,
} from '../types';
import { getModelById } from '../models/registry';
import { ModelProviderFactory } from '../providers/factory';

export class ModelEnsemble {
  private providerFactory: ModelProviderFactory;

  constructor() {
    this.providerFactory = new ModelProviderFactory();
  }

  /**
   * Generate ensemble response using multiple models
   */
  async generateEnsemble(
    request: CompletionRequest,
    ensembleConfig: EnsembleRequest
  ): Promise<EnsembleResponse> {
    const { models, strategy, weights, threshold } = ensembleConfig;

    // Generate responses from all models in parallel
    const responses = await Promise.all(
      models.map(async (modelId) => {
        try {
          const provider = this.providerFactory.getProvider(modelId);
          const response = await provider.generateCompletion({
            ...request,
            model: modelId,
          });

          return {
            modelId,
            response,
            success: true,
          };
        } catch (error) {
          console.error(`Error from model ${modelId}:`, error);
          return {
            modelId,
            response: null,
            success: false,
          };
        }
      })
    );

    // Filter successful responses
    const successfulResponses = responses.filter((r) => r.success && r.response);

    if (successfulResponses.length === 0) {
      throw new Error('All models failed to generate responses');
    }

    // Apply ensemble strategy
    let result: string;
    let agreementScore: number;
    let contributors: Array<{ model: string; response: string; weight: number }>;

    switch (strategy) {
      case 'voting':
        ({ result, agreementScore, contributors } = this.votingStrategy(
          successfulResponses.map((r) => ({
            model: r.modelId,
            response: r.response!.content,
            weight: 1,
          }))
        ));
        break;

      case 'weighted':
        ({ result, agreementScore, contributors } = this.weightedStrategy(
          successfulResponses.map((r) => ({
            model: r.modelId,
            response: r.response!.content,
            weight: weights?.[r.modelId] || 1,
          }))
        ));
        break;

      case 'best_of':
        ({ result, agreementScore, contributors } = await this.bestOfStrategy(
          successfulResponses.map((r) => ({
            model: r.modelId,
            response: r.response!.content,
            weight: 1,
          }))
        ));
        break;

      case 'consensus':
        ({ result, agreementScore, contributors } = await this.consensusStrategy(
          successfulResponses.map((r) => ({
            model: r.modelId,
            response: r.response!.content,
            weight: 1,
          })),
          threshold || 0.7
        ));
        break;

      default:
        throw new Error(`Unknown ensemble strategy: ${strategy}`);
    }

    // Calculate confidence based on agreement
    const confidence = this.calculateConfidence(agreementScore, contributors.length);

    return {
      result,
      contributors,
      confidence,
      agreementScore,
    };
  }

  /**
   * Voting strategy: most common response wins
   */
  private votingStrategy(
    responses: Array<{ model: string; response: string; weight: number }>
  ): {
    result: string;
    agreementScore: number;
    contributors: Array<{ model: string; response: string; weight: number }>;
  } {
    // Count response frequencies
    const frequencies = new Map<string, number>();
    const responseToModels = new Map<string, string[]>();

    for (const { model, response } of responses) {
      const normalized = this.normalizeResponse(response);
      frequencies.set(normalized, (frequencies.get(normalized) || 0) + 1);

      if (!responseToModels.has(normalized)) {
        responseToModels.set(normalized, []);
      }
      responseToModels.get(normalized)!.push(model);
    }

    // Find most common response
    let maxCount = 0;
    let mostCommon = '';

    for (const [response, count] of frequencies) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = response;
      }
    }

    const agreementScore = maxCount / responses.length;

    return {
      result: mostCommon,
      agreementScore,
      contributors: responses.map(r => ({
        model: r.model,
        response: r.response,
        weight: r.weight,
      })),
    };
  }

  /**
   * Weighted strategy: combine responses based on model weights
   */
  private weightedStrategy(
    responses: Array<{ model: string; response: string; weight: number }>
  ): {
    result: string;
    agreementScore: number;
    contributors: Array<{ model: string; response: string; weight: number }>;
  } {
    // For text, choose the response from the highest weighted model
    const sorted = responses.sort((a, b) => b.weight - a.weight);
    const totalWeight = responses.reduce((sum, r) => sum + r.weight, 0);
    const topWeight = sorted[0].weight;

    return {
      result: sorted[0].response,
      agreementScore: topWeight / totalWeight,
      contributors: responses,
    };
  }

  /**
   * Best-of strategy: select highest quality response
   */
  private async bestOfStrategy(
    responses: Array<{ model: string; response: string; weight: number }>
  ): Promise<{
    result: string;
    agreementScore: number;
    contributors: Array<{ model: string; response: string; weight: number }>;
  }> {
    // Score each response based on model quality and response characteristics
    const scored = responses.map((r) => {
      const model = getModelById(r.model);
      const qualityScore = model?.performance.qualityScore || 85;
      const lengthScore = Math.min(r.response.length / 1000, 1) * 100;
      const completenessScore = r.response.endsWith('.') || r.response.endsWith('!') ? 100 : 80;

      const totalScore = qualityScore * 0.6 + lengthScore * 0.2 + completenessScore * 0.2;

      return {
        ...r,
        score: totalScore,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      result: scored[0].response,
      agreementScore: scored[0].score / 100,
      contributors: responses,
    };
  }

  /**
   * Consensus strategy: require minimum agreement threshold
   */
  private async consensusStrategy(
    responses: Array<{ model: string; response: string; weight: number }>,
    threshold: number
  ): Promise<{
    result: string;
    agreementScore: number;
    contributors: Array<{ model: string; response: string; weight: number }>;
  }> {
    // Calculate similarity between responses
    const similarities: number[][] = [];

    for (let i = 0; i < responses.length; i++) {
      similarities[i] = [];
      for (let j = 0; j < responses.length; j++) {
        if (i === j) {
          similarities[i][j] = 1.0;
        } else {
          similarities[i][j] = this.calculateSimilarity(
            responses[i].response,
            responses[j].response
          );
        }
      }
    }

    // Find response with highest average similarity
    let bestIndex = 0;
    let bestAvgSimilarity = 0;

    for (let i = 0; i < responses.length; i++) {
      const avgSimilarity =
        similarities[i].reduce((sum, s) => sum + s, 0) / responses.length;

      if (avgSimilarity > bestAvgSimilarity) {
        bestAvgSimilarity = avgSimilarity;
        bestIndex = i;
      }
    }

    if (bestAvgSimilarity < threshold) {
      // No consensus - use best-of strategy as fallback
      return this.bestOfStrategy(responses);
    }

    return {
      result: responses[bestIndex].response,
      agreementScore: bestAvgSimilarity,
      contributors: responses,
    };
  }

  // Private helper methods

  private normalizeResponse(response: string): string {
    return response.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity on words
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateConfidence(agreementScore: number, modelCount: number): number {
    // Confidence increases with both agreement and number of models
    const agreementFactor = agreementScore;
    const countFactor = Math.min(modelCount / 5, 1);

    return (agreementFactor * 0.7 + countFactor * 0.3);
  }
}

// Export singleton instance
export const modelEnsemble = new ModelEnsemble();
