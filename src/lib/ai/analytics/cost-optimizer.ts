/**
 * Cost Optimization System
 * Optimizes model selection for cost while maintaining quality thresholds
 */

import {
  ModelRequest,
  ModelSelection,
  ModelConfig,
} from '../types';
import { getAvailableModels, getModelById } from '../models/registry';
import { performanceTracker } from './performance-tracker';

export class CostOptimizer {
  /**
   * Optimize model selection for cost while maintaining quality threshold
   */
  async optimizeForCost(
    request: ModelRequest,
    qualityThreshold: number = 0.8
  ): Promise<ModelSelection[]> {
    const candidates = getAvailableModels();

    const optimized = await Promise.all(
      candidates.map(async (model) => {
        const estimatedCost = this.estimateCost(model, request);
        const estimatedQuality = await this.estimateQuality(model, request);
        const efficiency = estimatedQuality > 0 ? estimatedQuality / estimatedCost : 0;

        return {
          model,
          estimatedCost,
          estimatedQuality,
          efficiency,
        };
      })
    );

    // Filter by quality threshold
    const qualityFiltered = optimized.filter(
      (o) => o.estimatedQuality >= qualityThreshold
    );

    // Sort by efficiency (quality/cost ratio)
    const sorted = qualityFiltered.sort((a, b) => b.efficiency - a.efficiency);

    // Convert to ModelSelection format
    return sorted.map((item, index) => ({
      model: item.model,
      confidence: 1 - index * 0.1,
      reasoning: [
        `Cost: $${item.estimatedCost.toFixed(4)}`,
        `Quality: ${(item.estimatedQuality * 100).toFixed(0)}%`,
        `Efficiency: ${item.efficiency.toFixed(2)}`,
      ],
      alternatives: sorted.slice(1, 4).map((s) => s.model),
      estimatedCost: item.estimatedCost,
      estimatedLatency: item.model.performance.averageLatency,
      estimatedQuality: item.estimatedQuality * 100,
    }));
  }

  /**
   * Find the cheapest model that meets requirements
   */
  async findCheapestModel(
    request: ModelRequest,
    minQuality: number = 0.7
  ): Promise<ModelConfig | null> {
    const optimized = await this.optimizeForCost(request, minQuality);
    return optimized.length > 0 ? optimized[0].model : null;
  }

  /**
   * Calculate cost savings compared to baseline model
   */
  async calculateSavings(
    selectedModel: string,
    baselineModel: string,
    request: ModelRequest
  ): Promise<{
    savings: number;
    percentage: number;
    baselineCost: number;
    selectedCost: number;
  }> {
    const selected = getModelById(selectedModel);
    const baseline = getModelById(baselineModel);

    if (!selected || !baseline) {
      throw new Error('Model not found');
    }

    const selectedCost = this.estimateCost(selected, request);
    const baselineCost = this.estimateCost(baseline, request);

    const savings = baselineCost - selectedCost;
    const percentage = baselineCost > 0 ? (savings / baselineCost) * 100 : 0;

    return {
      savings,
      percentage,
      baselineCost,
      selectedCost,
    };
  }

  /**
   * Get cost breakdown for a request
   */
  getCostBreakdown(
    model: ModelConfig,
    inputTokens: number,
    outputTokens: number
  ): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    details: string[];
  } {
    const inputCost = (inputTokens / 1_000_000) * model.pricing.inputTokenCost;
    const outputCost = (outputTokens / 1_000_000) * model.pricing.outputTokenCost;
    const totalCost = inputCost + outputCost;

    const details = [
      `Input: ${inputTokens.toLocaleString()} tokens @ $${model.pricing.inputTokenCost}/M = $${inputCost.toFixed(6)}`,
      `Output: ${outputTokens.toLocaleString()} tokens @ $${model.pricing.outputTokenCost}/M = $${outputCost.toFixed(6)}`,
      `Total: $${totalCost.toFixed(6)}`,
    ];

    return {
      inputCost,
      outputCost,
      totalCost,
      details,
    };
  }

  /**
   * Suggest cost-saving alternatives
   */
  async suggestAlternatives(
    currentModel: string,
    request: ModelRequest
  ): Promise<Array<{
    model: ModelConfig;
    savings: number;
    savingsPercentage: number;
    qualityDifference: number;
  }>> {
    const current = getModelById(currentModel);
    if (!current) return [];

    const currentCost = this.estimateCost(current, request);
    const currentQuality = await this.estimateQuality(current, request);

    const alternatives = getAvailableModels()
      .filter((m) => m.id !== currentModel)
      .map(async (model) => {
        const cost = this.estimateCost(model, request);
        const quality = await this.estimateQuality(model, request);
        const savings = currentCost - cost;
        const savingsPercentage = currentCost > 0 ? (savings / currentCost) * 100 : 0;
        const qualityDifference = quality - currentQuality;

        return {
          model,
          savings,
          savingsPercentage,
          qualityDifference,
        };
      });

    const resolved = await Promise.all(alternatives);

    // Return only models with positive savings and acceptable quality loss
    return resolved
      .filter((a) => a.savings > 0 && a.qualityDifference > -0.15)
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 5);
  }

  // Private helper methods

  private estimateCost(model: ModelConfig, request: ModelRequest): number {
    const estimatedInputTokens = this.estimateInputTokens(request.messages);
    const estimatedOutputTokens = estimatedInputTokens * 0.5; // Assume 50% output

    const inputCost = (estimatedInputTokens / 1_000_000) * model.pricing.inputTokenCost;
    const outputCost = (estimatedOutputTokens / 1_000_000) * model.pricing.outputTokenCost;

    return inputCost + outputCost;
  }

  private async estimateQuality(
    model: ModelConfig,
    request: ModelRequest
  ): Promise<number> {
    // Get real-time performance data
    const performance = await performanceTracker.getModelPerformance(model.id);

    // Base quality from model config
    let quality = model.performance.qualityScore / 100;

    // Adjust based on real-time performance
    if (performance.successRate < 95) {
      quality *= 0.9;
    }

    // Adjust based on user satisfaction
    quality = (quality + performance.userSatisfaction / 100) / 2;

    return quality;
  }

  private estimateInputTokens(messages: any[]): number {
    // Rough estimation: 1 token ≈ 4 characters
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 4);
  }
}

// Export singleton instance
export const costOptimizer = new CostOptimizer();
