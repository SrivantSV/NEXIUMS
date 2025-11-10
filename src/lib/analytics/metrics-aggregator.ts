// Analytics Metrics Aggregator
// Aggregates raw events into meaningful metrics and insights

import { createClient } from '@/lib/supabase/client';
import type {
  AnalyticsMetrics,
  UserMetrics,
  CostMetrics,
  ModelMetrics,
  PerformanceMetrics,
  Timeframe,
  AnalyticsFilters,
  TimeSeriesData,
  ModelCostBreakdown,
  ModelUsageData
} from '@/types/analytics';

export class MetricsAggregator {
  private supabase = createClient();

  /**
   * Get comprehensive analytics metrics
   */
  async getMetrics(
    timeframe: Timeframe,
    filters: AnalyticsFilters = {}
  ): Promise<AnalyticsMetrics> {
    const { start, end } = this.parseTimeframe(timeframe);

    const [
      userMetrics,
      costMetrics,
      modelMetrics,
      performanceMetrics
    ] = await Promise.all([
      this.getUserMetrics(start, end, filters),
      this.getCostMetrics(start, end, filters),
      this.getModelMetrics(start, end, filters),
      this.getPerformanceMetrics(start, end, filters)
    ]);

    return {
      userMetrics,
      usageMetrics: {
        totalRequests: userMetrics.totalSessions,
        requestsPerUser: userMetrics.messagesPerUser,
        requestsPerDay: [],
        peakUsageHours: [],
        averageRequestsPerSession: userMetrics.sessionsPerUser,
        tokensConsumed: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          averageTokensPerRequest: 0
        }
      },
      behaviorMetrics: {
        mostUsedFeatures: [],
        userFlows: [],
        dropOffPoints: [],
        conversionFunnels: []
      },
      engagementMetrics: {
        engagementScore: 0,
        stickinessRatio: 0,
        returnRate: 0,
        sessionFrequency: 0,
        featureInteractions: 0
      },
      retentionMetrics: {
        day1Retention: 0,
        day7Retention: 0,
        day30Retention: 0,
        cohortRetention: [],
        churnRate: 0,
        churnPrediction: []
      },
      featureMetrics: {
        features: [],
        adoption: [],
        engagement: [],
        retention: []
      },
      performanceMetrics,
      qualityMetrics: {
        averageRating: 0,
        satisfactionScore: 0,
        nps: 0,
        feedbackCount: 0
      },
      satisfactionMetrics: {
        overallSatisfaction: 0,
        featureSatisfaction: [],
        modelSatisfaction: [],
        supportSatisfaction: 0
      },
      revenueMetrics: {
        totalRevenue: 0,
        monthlyRecurringRevenue: 0,
        annualRecurringRevenue: 0,
        averageRevenuePerUser: 0,
        revenueGrowthRate: 0,
        revenueByTier: [],
        revenueTrend: []
      },
      subscriptionMetrics: {
        totalSubscribers: 0,
        newSubscribers: 0,
        canceledSubscriptions: 0,
        upgrades: 0,
        downgrades: 0,
        subscribersByTier: [],
        conversionRate: 0,
        trialConversionRate: 0
      },
      churnMetrics: {
        churnRate: 0,
        churnedUsers: 0,
        churnReasons: [],
        churnRisk: [],
        retentionRate: 0,
        lifeTimeValue: 0
      },
      growthMetrics: {
        userGrowthRate: 0,
        revenueGrowthRate: 0,
        netPromoterScore: 0,
        viralCoefficient: 0,
        customerAcquisitionCost: 0,
        lifeTimeValueToCAC: 0
      },
      systemMetrics: {
        uptime: 99.9,
        availability: 99.9,
        latency: {
          p50: performanceMetrics.averageResponseTime,
          p95: performanceMetrics.averageResponseTime * 2,
          p99: performanceMetrics.averageResponseTime * 3,
          average: performanceMetrics.averageResponseTime
        },
        throughput: 0,
        errorRate: performanceMetrics.errorRate,
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0
      },
      errorMetrics: {
        totalErrors: 0,
        errorRate: performanceMetrics.errorRate,
        errorsByType: [],
        errorsByEndpoint: [],
        criticalErrors: 0,
        errorTrend: []
      },
      apiMetrics: {
        totalRequests: userMetrics.totalSessions,
        requestsPerSecond: 0,
        averageLatency: performanceMetrics.averageResponseTime,
        successRate: performanceMetrics.successRate,
        endpointUsage: [],
        slowestEndpoints: []
      },
      modelMetrics,
      costMetrics,
      routingMetrics: {
        totalRoutes: 0,
        routingAccuracy: 0,
        averageConfidence: 0,
        routingLatency: 0,
        modelSelections: [],
        savingsGenerated: costMetrics.totalSavings,
        failoverRate: 0,
        optimizationScore: 0
      },
      teamMetrics: {
        totalTeams: 0,
        averageTeamSize: 0,
        activeTeams: 0,
        teamGrowth: 0,
        teamActivity: []
      },
      collaborationMetrics: {
        sharedProjects: 0,
        collaborationSessions: 0,
        averageCollaborators: 0,
        messageExchanges: 0,
        fileShares: 0
      },
      productivityMetrics: {
        tasksCompleted: 0,
        averageTaskDuration: 0,
        projectsCompleted: 0,
        codeGenerated: 0,
        artifactsCreated: userMetrics.artifactsCreated
      }
    };
  }

  /**
   * Get user metrics
   */
  private async getUserMetrics(
    start: Date,
    end: Date,
    filters: AnalyticsFilters
  ): Promise<UserMetrics> {
    const userId = filters.userId;

    // Get daily active users
    const { data: dauData } = await this.supabase
      .from('model_requests')
      .select('user_id, created_at')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at');

    const dailyActiveUsers = this.aggregateDailyActiveUsers(dauData || []);

    // Get user summary
    const { data: summaryData } = await this.supabase
      .from('user_analytics_summary')
      .select('*')
      .then(result => {
        if (userId) {
          return this.supabase
            .from('user_analytics_summary')
            .select('*')
            .eq('user_id', userId)
            .single();
        }
        return result;
      });

    const summary = Array.isArray(summaryData) ? summaryData[0] : summaryData;

    return {
      dailyActiveUsers,
      weeklyActiveUsers: [],
      monthlyActiveUsers: [],
      averageSessionDuration: 0,
      sessionsPerUser: summary?.total_sessions || 0,
      totalSessions: summary?.total_requests || 0,
      messagesPerUser: summary?.total_requests || 0,
      artifactsCreated: summary?.projects_created || 0,
      filesUploaded: summary?.files_uploaded || 0,
      projectsCreated: summary?.projects_created || 0,
      collaborationsInitiated: summary?.collaborations || 0,
      featureAdoption: [],
      mcpUsage: [],
      modelUsage: [],
      onboardingCompletion: 0,
      timeToFirstValue: 0,
      featureDiscovery: [],
      userSegments: [],
      cohortAnalysis: []
    };
  }

  /**
   * Get cost metrics
   */
  private async getCostMetrics(
    start: Date,
    end: Date,
    filters: AnalyticsFilters
  ): Promise<CostMetrics> {
    let query = this.supabase
      .from('model_requests')
      .select('model_id, model_name, provider, cost, input_tokens, output_tokens, was_routed')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.modelId) {
      query = query.eq('model_id', filters.modelId);
    }

    const { data: requests } = await query;

    if (!requests || requests.length === 0) {
      return this.getEmptyCostMetrics();
    }

    // Calculate model costs
    const modelCostsMap = new Map<string, ModelCostBreakdown>();

    requests.forEach(req => {
      const existing = modelCostsMap.get(req.model_id) || {
        modelId: req.model_id,
        modelName: req.model_name,
        provider: req.provider,
        requestCount: 0,
        totalCost: 0,
        inputTokens: 0,
        outputTokens: 0,
        averageCostPerRequest: 0,
        costShare: 0,
        trend: 'stable' as const
      };

      existing.requestCount++;
      existing.totalCost += Number(req.cost);
      existing.inputTokens += req.input_tokens;
      existing.outputTokens += req.output_tokens;

      modelCostsMap.set(req.model_id, existing);
    });

    const modelCosts = Array.from(modelCostsMap.values());
    const totalCost = modelCosts.reduce((sum, m) => sum + m.totalCost, 0);

    // Calculate averages and shares
    modelCosts.forEach(model => {
      model.averageCostPerRequest = model.totalCost / model.requestCount;
      model.costShare = (model.totalCost / totalCost) * 100;
    });

    // Calculate smart router savings
    const routedRequests = requests.filter(r => r.was_routed);
    const potentialCost = totalCost * 1.3; // Assume 30% savings from routing
    const actualCost = totalCost;
    const totalSavings = potentialCost - actualCost;

    return {
      totalCost,
      costPerUser: 0,
      costPerRequest: totalCost / requests.length,
      costPerProject: 0,
      costTrend: 'stable',
      modelCosts,
      averageRequestCost: totalCost / requests.length,
      costTrends: [],
      potentialCost,
      actualCost,
      totalSavings,
      savingsPercentage: (totalSavings / potentialCost) * 100,
      savingsByUser: [],
      routerEfficiency: routedRequests.length / requests.length * 100,
      costByTeam: [],
      costByProject: [],
      costByFeature: [],
      costByUser: [],
      optimizationOpportunities: [],
      recommendedActions: [],
      budgetAlerts: [],
      monthlyForecast: totalCost * 30,
      quarterlyForecast: totalCost * 90,
      yearlyForecast: totalCost * 365
    };
  }

  /**
   * Get model metrics
   */
  private async getModelMetrics(
    start: Date,
    end: Date,
    filters: AnalyticsFilters
  ): Promise<ModelMetrics> {
    let query = this.supabase
      .from('model_requests')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.modelId) {
      query = query.eq('model_id', filters.modelId);
    }

    const { data: requests } = await query;

    if (!requests || requests.length === 0) {
      return this.getEmptyModelMetrics();
    }

    // Aggregate by model
    const modelMap = new Map<string, any>();

    requests.forEach(req => {
      const existing = modelMap.get(req.model_id) || {
        modelId: req.model_id,
        modelName: req.model_name,
        provider: req.provider,
        requests: [],
        totalRequests: 0,
        totalResponseTime: 0,
        successCount: 0,
        totalRating: 0,
        ratingCount: 0
      };

      existing.requests.push(req);
      existing.totalRequests++;
      existing.totalResponseTime += req.response_time;
      if (req.status === 'success') existing.successCount++;
      if (req.user_feedback_rating) {
        existing.totalRating += req.user_feedback_rating;
        existing.ratingCount++;
      }

      modelMap.set(req.model_id, existing);
    });

    const requestsPerModel: ModelUsageData[] = Array.from(modelMap.values()).map(m => ({
      modelId: m.modelId,
      modelName: m.modelName,
      provider: m.provider,
      requestCount: m.totalRequests,
      percentage: (m.totalRequests / requests.length) * 100,
      trend: 'stable',
      avgResponseTime: m.totalResponseTime / m.totalRequests,
      successRate: (m.successCount / m.totalRequests) * 100
    }));

    const responseTime = Array.from(modelMap.values()).map(m => ({
      modelId: m.modelId,
      avgResponseTime: m.totalResponseTime / m.totalRequests,
      p50ResponseTime: m.totalResponseTime / m.totalRequests,
      p95ResponseTime: m.totalResponseTime / m.totalRequests * 2,
      p99ResponseTime: m.totalResponseTime / m.totalRequests * 3,
      trend: []
    }));

    const userSatisfaction = Array.from(modelMap.values())
      .filter(m => m.ratingCount > 0)
      .map(m => ({
        modelId: m.modelId,
        averageRating: m.totalRating / m.ratingCount,
        totalRatings: m.ratingCount,
        thumbsUp: 0,
        thumbsDown: 0,
        satisfactionScore: (m.totalRating / m.ratingCount / 5) * 100
      }));

    return {
      requestsPerModel,
      responseTime,
      successRate: [],
      userSatisfaction,
      taskCompletion: [],
      accuracyScores: [],
      routingAccuracy: 0,
      routingLatency: 0,
      routingConfidence: [],
      modelComparisons: [],
      performanceBenchmarks: [],
      costEfficiency: [],
      qualityCostRatio: []
    };
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(
    start: Date,
    end: Date,
    filters: AnalyticsFilters
  ): Promise<PerformanceMetrics> {
    let query = this.supabase
      .from('model_requests')
      .select('response_time, status')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data: requests } = await query;

    if (!requests || requests.length === 0) {
      return {
        averageResponseTime: 0,
        successRate: 0,
        errorRate: 0,
        responseTimeTrend: [],
        throughput: 0,
        cacheHitRate: 0
      };
    }

    const totalResponseTime = requests.reduce((sum, r) => sum + r.response_time, 0);
    const successCount = requests.filter(r => r.status === 'success').length;

    return {
      averageResponseTime: totalResponseTime / requests.length,
      successRate: (successCount / requests.length) * 100,
      errorRate: ((requests.length - successCount) / requests.length) * 100,
      responseTimeTrend: [],
      throughput: requests.length / ((end.getTime() - start.getTime()) / 1000),
      cacheHitRate: 0
    };
  }

  /**
   * Parse timeframe into start and end dates
   */
  private parseTimeframe(timeframe: Timeframe): { start: Date; end: Date } {
    if (typeof timeframe === 'object' && 'start' in timeframe) {
      return timeframe;
    }

    const end = new Date();
    let start = new Date();

    switch (timeframe) {
      case '1h':
        start = new Date(end.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    return { start, end };
  }

  /**
   * Aggregate daily active users from raw data
   */
  private aggregateDailyActiveUsers(data: any[]): TimeSeriesData[] {
    const dailyMap = new Map<string, Set<string>>();

    data.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, new Set());
      }
      dailyMap.get(date)!.add(item.user_id);
    });

    return Array.from(dailyMap.entries()).map(([date, users]) => ({
      timestamp: new Date(date),
      value: users.size
    }));
  }

  /**
   * Get empty cost metrics
   */
  private getEmptyCostMetrics(): CostMetrics {
    return {
      totalCost: 0,
      costPerUser: 0,
      costPerRequest: 0,
      costPerProject: 0,
      costTrend: 'stable',
      modelCosts: [],
      averageRequestCost: 0,
      costTrends: [],
      potentialCost: 0,
      actualCost: 0,
      totalSavings: 0,
      savingsPercentage: 0,
      savingsByUser: [],
      routerEfficiency: 0,
      costByTeam: [],
      costByProject: [],
      costByFeature: [],
      costByUser: [],
      optimizationOpportunities: [],
      recommendedActions: [],
      budgetAlerts: [],
      monthlyForecast: 0,
      quarterlyForecast: 0,
      yearlyForecast: 0
    };
  }

  /**
   * Get empty model metrics
   */
  private getEmptyModelMetrics(): ModelMetrics {
    return {
      requestsPerModel: [],
      responseTime: [],
      successRate: [],
      userSatisfaction: [],
      taskCompletion: [],
      accuracyScores: [],
      routingAccuracy: 0,
      routingLatency: 0,
      routingConfidence: [],
      modelComparisons: [],
      performanceBenchmarks: [],
      costEfficiency: [],
      qualityCostRatio: []
    };
  }
}

// Singleton instance
let aggregatorInstance: MetricsAggregator | null = null;

export function getMetricsAggregator(): MetricsAggregator {
  if (!aggregatorInstance) {
    aggregatorInstance = new MetricsAggregator();
  }
  return aggregatorInstance;
}
