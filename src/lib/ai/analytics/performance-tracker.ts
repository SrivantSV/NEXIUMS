/**
 * Performance Tracking and Analytics System
 * Tracks model performance, cost, and user satisfaction in real-time
 */

import {
  CompletionRequest,
  CompletionResponse,
  UserFeedback,
  UsageMetrics,
  ModelPerformance,
} from '../types';

interface PerformanceMetrics {
  modelId: string;
  latencies: number[];
  tokenCounts: number[];
  costs: number[];
  successCount: number;
  errorCount: number;
  userRatings: number[];
  timestamp: Date;
}

export class PerformanceTracker {
  private metricsCache: Map<string, PerformanceMetrics> = new Map();
  private readonly CACHE_SIZE = 1000;
  private readonly UPDATE_INTERVAL = 60000; // 1 minute

  /**
   * Track model performance for a request
   */
  async trackModelPerformance(
    modelId: string,
    request: CompletionRequest,
    response: CompletionResponse,
    userFeedback?: UserFeedback
  ): Promise<void> {
    const metrics = this.getOrCreateMetrics(modelId);

    // Add latency
    metrics.latencies.push(response.responseTime);
    if (metrics.latencies.length > this.CACHE_SIZE) {
      metrics.latencies.shift();
    }

    // Add token count
    metrics.tokenCounts.push(response.usage.totalTokens);
    if (metrics.tokenCounts.length > this.CACHE_SIZE) {
      metrics.tokenCounts.shift();
    }

    // Calculate and add cost
    const cost = this.calculateCost(modelId, response.usage);
    metrics.costs.push(cost);
    if (metrics.costs.length > this.CACHE_SIZE) {
      metrics.costs.shift();
    }

    // Track success/error
    if (response.finishReason === 'stop') {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }

    // Add user feedback if available
    if (userFeedback?.rating) {
      metrics.userRatings.push(userFeedback.rating);
      if (metrics.userRatings.length > this.CACHE_SIZE) {
        metrics.userRatings.shift();
      }
    }

    metrics.timestamp = new Date();

    // Store metrics (in production, this would go to a database)
    await this.storeMetrics(modelId, metrics);
  }

  /**
   * Get performance statistics for a model
   */
  async getModelPerformance(modelId: string): Promise<ModelPerformance> {
    const metrics = this.metricsCache.get(modelId);

    if (!metrics || metrics.latencies.length === 0) {
      return this.getDefaultPerformance();
    }

    const averageLatency = this.average(metrics.latencies);
    const totalTokens = this.sum(metrics.tokenCounts);
    const totalTime = this.sum(metrics.latencies) / 1000; // Convert to seconds
    const tokensPerSecond = totalTime > 0 ? totalTokens / totalTime : 0;

    const totalRequests = metrics.successCount + metrics.errorCount;
    const successRate = totalRequests > 0
      ? (metrics.successCount / totalRequests) * 100
      : 100;

    const userSatisfaction = metrics.userRatings.length > 0
      ? (this.average(metrics.userRatings) / 5) * 100
      : 85;

    // Quality score based on success rate and user satisfaction
    const qualityScore = (successRate * 0.6 + userSatisfaction * 0.4);

    // Cost efficiency: quality per dollar
    const avgCost = this.average(metrics.costs);
    const costEfficiency = avgCost > 0 ? (qualityScore / avgCost) * 10 : 90;

    return {
      averageLatency: Math.round(averageLatency),
      tokensPerSecond: Math.round(tokensPerSecond),
      qualityScore: Math.round(qualityScore),
      reliabilityScore: Math.round(successRate),
      costEfficiency: Math.round(Math.min(costEfficiency, 100)),
      userSatisfaction: Math.round(userSatisfaction),
      successRate: Math.round(successRate * 10) / 10,
      lastUpdated: metrics.timestamp,
    };
  }

  /**
   * Get usage metrics for a user
   */
  async getUserUsageMetrics(userId: string): Promise<UsageMetrics[]> {
    // In production, this would query from database
    // For now, return mock data
    return [];
  }

  /**
   * Process user feedback
   */
  async processUserFeedback(feedback: UserFeedback): Promise<void> {
    const metrics = this.getOrCreateMetrics(feedback.modelId);
    metrics.userRatings.push(feedback.rating);

    // Store feedback (in production, save to database)
    await this.storeFeedback(feedback);
  }

  /**
   * Update model rankings based on performance
   */
  async updateModelRankings(): Promise<void> {
    // Calculate rankings across all models
    const performances = new Map<string, ModelPerformance>();

    for (const [modelId] of this.metricsCache) {
      const perf = await this.getModelPerformance(modelId);
      performances.set(modelId, perf);
    }

    // Store rankings (in production, update database)
    // This would trigger model registry updates
  }

  /**
   * Get top performing models by category
   */
  async getTopModels(
    category: 'quality' | 'speed' | 'cost' | 'satisfaction',
    limit: number = 5
  ): Promise<Array<{ modelId: string; score: number }>> {
    const rankings: Array<{ modelId: string; score: number }> = [];

    for (const [modelId] of this.metricsCache) {
      const perf = await this.getModelPerformance(modelId);
      let score = 0;

      switch (category) {
        case 'quality':
          score = perf.qualityScore;
          break;
        case 'speed':
          score = 100 - Math.min((perf.averageLatency / 5000) * 100, 100);
          break;
        case 'cost':
          score = perf.costEfficiency;
          break;
        case 'satisfaction':
          score = perf.userSatisfaction;
          break;
      }

      rankings.push({ modelId, score });
    }

    return rankings
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Private helper methods

  private getOrCreateMetrics(modelId: string): PerformanceMetrics {
    if (!this.metricsCache.has(modelId)) {
      this.metricsCache.set(modelId, {
        modelId,
        latencies: [],
        tokenCounts: [],
        costs: [],
        successCount: 0,
        errorCount: 0,
        userRatings: [],
        timestamp: new Date(),
      });
    }
    return this.metricsCache.get(modelId)!;
  }

  private calculateCost(modelId: string, usage: any): number {
    // This would look up actual pricing from model registry
    // For now, return estimated cost
    return (usage.totalTokens / 1_000_000) * 3.0;
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private sum(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0);
  }

  private getDefaultPerformance(): ModelPerformance {
    return {
      averageLatency: 1000,
      tokensPerSecond: 50,
      qualityScore: 85,
      reliabilityScore: 95,
      costEfficiency: 85,
      userSatisfaction: 85,
      successRate: 95,
      lastUpdated: new Date(),
    };
  }

  private async storeMetrics(modelId: string, metrics: PerformanceMetrics): Promise<void> {
    // In production, store to database
    // For now, keep in memory cache
  }

  private async storeFeedback(feedback: UserFeedback): Promise<void> {
    // In production, store to database
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();
