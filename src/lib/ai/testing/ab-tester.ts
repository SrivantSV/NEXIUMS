/**
 * A/B Testing Framework for Model Comparison
 * Compare model performance with statistical significance
 */

import {
  ABTestConfig,
  ABTestResult,
  ModelRequest,
  CompletionResponse,
} from '../types';

interface TestMetrics {
  modelId: string;
  responseCount: number;
  totalLatency: number;
  totalCost: number;
  successCount: number;
  errorCount: number;
  qualityScores: number[];
  userRatings: number[];
}

export class ABTester {
  private activeTests: Map<string, ABTestConfig> = new Map();
  private testMetrics: Map<string, Map<string, TestMetrics>> = new Map();

  /**
   * Create a new A/B test
   */
  async createTest(config: ABTestConfig): Promise<string> {
    this.activeTests.set(config.id, config);

    // Initialize metrics for both models
    const metrics = new Map<string, TestMetrics>();
    metrics.set(config.modelA, this.initializeMetrics(config.modelA));
    metrics.set(config.modelB, this.initializeMetrics(config.modelB));
    this.testMetrics.set(config.id, metrics);

    return config.id;
  }

  /**
   * Select which model to use for a request (traffic splitting)
   */
  selectTestModel(testId: string, userId: string): string | null {
    const config = this.activeTests.get(testId);
    if (!config || config.status !== 'active') return null;

    // Use user ID hash for consistent assignment
    const hash = this.hashUserId(userId);
    const threshold = config.trafficSplit / 100;

    return hash < threshold ? config.modelA : config.modelB;
  }

  /**
   * Record test result
   */
  async recordTestResult(
    testId: string,
    modelId: string,
    response: CompletionResponse,
    cost: number,
    userRating?: number
  ): Promise<void> {
    const metrics = this.testMetrics.get(testId)?.get(modelId);
    if (!metrics) return;

    metrics.responseCount++;
    metrics.totalLatency += response.responseTime;
    metrics.totalCost += cost;

    if (response.finishReason === 'stop') {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }

    if (userRating !== undefined) {
      metrics.userRatings.push(userRating);
    }
  }

  /**
   * Get test results with statistical analysis
   */
  async getTestResults(testId: string): Promise<ABTestResult | null> {
    const config = this.activeTests.get(testId);
    const metrics = this.testMetrics.get(testId);

    if (!config || !metrics) return null;

    const modelAMetrics = metrics.get(config.modelA)!;
    const modelBMetrics = metrics.get(config.modelB)!;

    // Calculate metrics for model A
    const modelAResults = {
      avgLatency: this.calculateAverage(modelAMetrics.totalLatency, modelAMetrics.responseCount),
      avgCost: this.calculateAverage(modelAMetrics.totalCost, modelAMetrics.responseCount),
      successRate: this.calculateSuccessRate(modelAMetrics.successCount, modelAMetrics.errorCount),
      avgUserRating: this.calculateAverage(
        modelAMetrics.userRatings.reduce((sum, r) => sum + r, 0),
        modelAMetrics.userRatings.length
      ),
      sampleSize: modelAMetrics.responseCount,
    };

    // Calculate metrics for model B
    const modelBResults = {
      avgLatency: this.calculateAverage(modelBMetrics.totalLatency, modelBMetrics.responseCount),
      avgCost: this.calculateAverage(modelBMetrics.totalCost, modelBMetrics.responseCount),
      successRate: this.calculateSuccessRate(modelBMetrics.successCount, modelBMetrics.errorCount),
      avgUserRating: this.calculateAverage(
        modelBMetrics.userRatings.reduce((sum, r) => sum + r, 0),
        modelBMetrics.userRatings.length
      ),
      sampleSize: modelBMetrics.responseCount,
    };

    // Determine winner based on composite score
    const modelAScore = this.calculateCompositeScore(modelAResults);
    const modelBScore = this.calculateCompositeScore(modelBResults);

    // Calculate statistical significance
    const significance = this.calculateSignificance(
      modelAResults.sampleSize,
      modelBResults.sampleSize,
      modelAScore,
      modelBScore
    );

    const winner = modelAScore > modelBScore ? config.modelA : config.modelB;

    return {
      testId,
      modelA: {
        model: config.modelA,
        metrics: {
          latency: modelAResults.avgLatency,
          cost: modelAResults.avgCost,
          successRate: modelAResults.successRate,
          userRating: modelAResults.avgUserRating,
          sampleSize: modelAResults.sampleSize,
        },
      },
      modelB: {
        model: config.modelB,
        metrics: {
          latency: modelBResults.avgLatency,
          cost: modelBResults.avgCost,
          successRate: modelBResults.successRate,
          userRating: modelBResults.avgUserRating,
          sampleSize: modelBResults.sampleSize,
        },
      },
      winner: significance > 0.95 ? winner : undefined,
      significance,
      sampleSize: modelAResults.sampleSize + modelBResults.sampleSize,
    };
  }

  /**
   * Stop a test and get final results
   */
  async stopTest(testId: string): Promise<ABTestResult | null> {
    const config = this.activeTests.get(testId);
    if (!config) return null;

    config.status = 'completed';
    config.endDate = new Date();

    return this.getTestResults(testId);
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTestConfig[] {
    return Array.from(this.activeTests.values()).filter(
      (config) => config.status === 'active'
    );
  }

  // Private helper methods

  private initializeMetrics(modelId: string): TestMetrics {
    return {
      modelId,
      responseCount: 0,
      totalLatency: 0,
      totalCost: 0,
      successCount: 0,
      errorCount: 0,
      qualityScores: [],
      userRatings: [],
    };
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 100) / 100;
  }

  private calculateAverage(sum: number, count: number): number {
    return count > 0 ? sum / count : 0;
  }

  private calculateSuccessRate(success: number, error: number): number {
    const total = success + error;
    return total > 0 ? (success / total) * 100 : 0;
  }

  private calculateCompositeScore(results: any): number {
    // Weighted scoring: quality (40%), cost (30%), speed (30%)
    const speedScore = Math.max(0, 100 - (results.avgLatency / 50));
    const costScore = Math.max(0, 100 - (results.avgCost * 1000));
    const qualityScore = (results.successRate + results.avgUserRating * 20) / 2;

    return qualityScore * 0.4 + costScore * 0.3 + speedScore * 0.3;
  }

  private calculateSignificance(
    sampleA: number,
    sampleB: number,
    scoreA: number,
    scoreB: number
  ): number {
    // Simplified significance calculation
    // In production, use proper statistical tests (t-test, chi-square)
    const totalSamples = sampleA + sampleB;
    const minSampleSize = Math.min(sampleA, sampleB);

    if (minSampleSize < 30) return 0.5; // Not enough data

    const scoreDiff = Math.abs(scoreA - scoreB);
    const sampleFactor = Math.min(totalSamples / 200, 1);
    const diffFactor = scoreDiff / 100;

    return Math.min(0.5 + sampleFactor * 0.3 + diffFactor * 0.2, 0.99);
  }
}

// Export singleton instance
export const abTester = new ABTester();
