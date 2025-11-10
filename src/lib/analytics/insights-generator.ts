// Analytics Insights Generator
// Generates actionable insights from metrics data

import type {
  AnalyticsInsights,
  AnalyticsMetrics,
  Recommendation,
  Anomaly,
  CostOptimization,
  PredictiveAnalytics
} from '@/types/analytics';

export class InsightsGenerator {
  /**
   * Generate comprehensive insights from metrics
   */
  async generateInsights(
    metrics: AnalyticsMetrics,
    userId?: string
  ): Promise<AnalyticsInsights> {
    const [
      recommendations,
      anomalies,
      predictions
    ] = await Promise.all([
      this.generateRecommendations(metrics),
      this.detectAnomalies(metrics),
      this.generatePredictions(metrics)
    ]);

    return {
      userInsights: {
        userGrowth: {
          rate: this.calculateGrowthRate(metrics.userMetrics.dailyActiveUsers),
          trend: 'up',
          seasonality: 'none',
          forecast: []
        },
        engagement: {
          score: metrics.engagementMetrics.engagementScore,
          trends: [],
          segments: [],
          drivers: []
        },
        retention: {
          cohortAnalysis: [],
          churnPrediction: [],
          retentionFactors: []
        },
        adoption: {
          featureUsage: metrics.featureMetrics.features,
          adoptionFunnel: [],
          stickiness: []
        }
      },
      usageInsights: {
        totalRequests: metrics.usageMetrics.totalRequests,
        trend: 'up',
        peakHours: metrics.usageMetrics.peakUsageHours,
        topFeatures: metrics.featureMetrics.features.slice(0, 5),
        userDistribution: []
      },
      costInsights: {
        optimization: {
          totalSavings: metrics.costMetrics.totalSavings,
          savingsOpportunities: await this.identifyCostSavingsOpportunities(metrics.costMetrics),
          routerEfficiency: metrics.costMetrics.routerEfficiency,
          modelEfficiency: this.analyzeModelEfficiency(metrics.costMetrics),
          score: this.calculateOptimizationScore(metrics.costMetrics)
        },
        attribution: {
          byUser: metrics.costMetrics.costByUser,
          byTeam: metrics.costMetrics.costByTeam,
          byProject: metrics.costMetrics.costByProject,
          byFeature: metrics.costMetrics.costByFeature
        },
        forecasting: {
          monthlyForecast: metrics.costMetrics.monthlyForecast,
          budgetAlerts: metrics.costMetrics.budgetAlerts,
          scalingCosts: []
        },
        roi: {
          userROI: 0,
          featureROI: [],
          modelROI: []
        }
      },
      performanceInsights: {
        responseTime: {
          current: metrics.performanceMetrics.averageResponseTime,
          baseline: 1000,
          change: 0,
          trend: 'stable'
        },
        errorRate: {
          current: metrics.performanceMetrics.errorRate,
          baseline: 1,
          change: 0,
          trend: 'stable'
        },
        throughput: {
          current: metrics.performanceMetrics.throughput,
          baseline: 100,
          change: 0,
          trend: 'stable'
        },
        reliability: metrics.performanceMetrics.successRate,
        issues: []
      },
      modelInsights: {
        usage: {
          distribution: metrics.modelMetrics.requestsPerModel,
          trends: [],
          topModels: metrics.modelMetrics.requestsPerModel
            .sort((a, b) => b.requestCount - a.requestCount)
            .slice(0, 3)
            .map(m => m.modelId)
        },
        performance: {
          averageResponseTime: metrics.performanceMetrics.averageResponseTime,
          reliability: metrics.performanceMetrics.successRate,
          comparisons: metrics.modelMetrics.modelComparisons
        },
        quality: {
          satisfaction: metrics.modelMetrics.userSatisfaction.reduce((sum, m) => sum + m.averageRating, 0) / (metrics.modelMetrics.userSatisfaction.length || 1),
          accuracy: 0,
          effectiveness: 0
        },
        efficiency: {
          costEfficiency: 0,
          qualityCostRatio: 0,
          recommendations: []
        }
      },
      businessInsights: {
        revenue: {
          mrr: metrics.revenueMetrics.monthlyRecurringRevenue,
          arr: metrics.revenueMetrics.annualRecurringRevenue,
          growth: metrics.revenueMetrics.revenueGrowthRate,
          forecast: metrics.revenueMetrics.monthlyRecurringRevenue * 1.1
        },
        growth: metrics.growthMetrics,
        health: {
          overall: 75,
          metrics: {
            userGrowth: 80,
            retention: 70,
            engagement: 75,
            revenue: 75
          }
        }
      },
      routerInsights: {
        accuracy: metrics.modelMetrics.routingAccuracy,
        confidence: 0,
        savings: metrics.costMetrics.totalSavings,
        efficiency: metrics.costMetrics.routerEfficiency,
        distribution: metrics.routingMetrics.modelSelections
      },
      recommendations,
      anomalies,
      predictions,
      recentActivity: [],
      summary: {
        period: '7d',
        highlights: this.generateHighlights(metrics),
        keyMetrics: {
          totalUsers: metrics.userMetrics.dailyActiveUsers.length,
          activeUsers: metrics.userMetrics.dailyActiveUsers[metrics.userMetrics.dailyActiveUsers.length - 1]?.value || 0,
          totalRequests: metrics.usageMetrics.totalRequests,
          totalCost: metrics.costMetrics.totalCost,
          avgResponseTime: metrics.performanceMetrics.averageResponseTime,
          satisfaction: 0
        },
        changes: {
          users: 0,
          requests: 0,
          cost: 0,
          performance: 0
        }
      }
    };
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    metrics: AnalyticsMetrics
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Cost optimization recommendations
    if (metrics.costMetrics.totalCost > 100) {
      const topCostModel = metrics.costMetrics.modelCosts
        .sort((a, b) => b.totalCost - a.totalCost)[0];

      if (topCostModel) {
        recommendations.push({
          id: crypto.randomUUID(),
          type: 'cost',
          priority: 'high',
          title: `Optimize ${topCostModel.modelName} Usage`,
          description: `${topCostModel.modelName} accounts for ${topCostModel.costShare.toFixed(1)}% of your AI costs. Consider using the smart router to optimize model selection.`,
          impact: `Save up to $${(topCostModel.totalCost * 0.3).toFixed(2)}/month`,
          effort: 'low',
          potentialValue: topCostModel.totalCost * 0.3,
          actionItems: [
            'Enable smart router for automatic model optimization',
            'Review use cases for potential model alternatives',
            'Set up cost alerts for this model'
          ],
          createdAt: new Date()
        });
      }
    }

    // Performance recommendations
    if (metrics.performanceMetrics.averageResponseTime > 2000) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'performance',
        priority: 'medium',
        title: 'Improve Response Time',
        description: `Average response time is ${metrics.performanceMetrics.averageResponseTime}ms. Consider optimizing model selection for faster responses.`,
        impact: 'Better user experience and engagement',
        effort: 'medium',
        potentialValue: 0,
        actionItems: [
          'Use faster models for simple queries',
          'Implement request caching',
          'Enable streaming responses'
        ],
        createdAt: new Date()
      });
    }

    // Usage recommendations
    if (metrics.userMetrics.dailyActiveUsers.length > 0) {
      const latestDAU = metrics.userMetrics.dailyActiveUsers[metrics.userMetrics.dailyActiveUsers.length - 1]?.value || 0;

      if (latestDAU < 10) {
        recommendations.push({
          id: crypto.randomUUID(),
          type: 'growth',
          priority: 'high',
          title: 'Increase User Engagement',
          description: 'User activity is lower than expected. Focus on engagement strategies.',
          impact: 'Higher retention and product adoption',
          effort: 'high',
          potentialValue: 0,
          actionItems: [
            'Implement onboarding flow',
            'Send engagement emails',
            'Add more features users love'
          ],
          createdAt: new Date()
        });
      }
    }

    // Feature adoption recommendations
    if (metrics.featureMetrics.features.length < 3) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'feature',
        priority: 'medium',
        title: 'Explore More Features',
        description: 'You\'re only using a few features. Discover more capabilities to maximize value.',
        impact: 'Better productivity and ROI',
        effort: 'low',
        potentialValue: 0,
        actionItems: [
          'Take a product tour',
          'Review feature documentation',
          'Try AI model comparison'
        ],
        createdAt: new Date()
      });
    }

    return recommendations.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }

  /**
   * Detect anomalies in metrics
   */
  private async detectAnomalies(
    metrics: AnalyticsMetrics
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Cost spike detection
    if (metrics.costMetrics.costTrends.length > 1) {
      const latest = metrics.costMetrics.costTrends[metrics.costMetrics.costTrends.length - 1];
      const previous = metrics.costMetrics.costTrends[metrics.costMetrics.costTrends.length - 2];

      if (latest && previous) {
        const change = ((latest.cost - previous.cost) / previous.cost) * 100;

        if (change > 50) {
          anomalies.push({
            id: crypto.randomUUID(),
            type: 'cost_spike',
            metric: 'total_cost',
            severity: change > 100 ? 'high' : 'medium',
            value: latest.cost,
            expectedValue: previous.cost,
            change,
            timestamp: latest.date,
            description: `Cost increased by ${change.toFixed(1)}% from previous period`,
            suggestion: 'Review recent usage patterns and enable smart routing'
          });
        }
      }
    }

    // Performance anomalies
    if (metrics.performanceMetrics.averageResponseTime > 5000) {
      anomalies.push({
        id: crypto.randomUUID(),
        type: 'performance',
        metric: 'response_time',
        severity: 'high',
        value: metrics.performanceMetrics.averageResponseTime,
        expectedValue: 2000,
        timestamp: new Date(),
        description: 'Response time is significantly higher than baseline',
        suggestion: 'Check system performance and consider using faster models'
      });
    }

    // Error rate anomalies
    if (metrics.performanceMetrics.errorRate > 5) {
      anomalies.push({
        id: crypto.randomUUID(),
        type: 'error',
        metric: 'error_rate',
        severity: metrics.performanceMetrics.errorRate > 10 ? 'critical' : 'high',
        value: metrics.performanceMetrics.errorRate,
        expectedValue: 1,
        timestamp: new Date(),
        description: `Error rate at ${metrics.performanceMetrics.errorRate.toFixed(1)}% is above acceptable threshold`,
        suggestion: 'Review error logs and check model availability'
      });
    }

    return anomalies.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityWeight[b.severity] - severityWeight[a.severity];
    });
  }

  /**
   * Generate predictions
   */
  private async generatePredictions(
    metrics: AnalyticsMetrics
  ): Promise<PredictiveAnalytics> {
    return {
      userGrowthForecast: this.forecastUserGrowth(metrics.userMetrics.dailyActiveUsers),
      churnPrediction: [],
      costForecast: this.forecastCost(metrics.costMetrics),
      capacityPlanning: {
        currentCapacity: 1000,
        projectedDemand: 1200,
        recommendedCapacity: 1500,
        timeline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    };
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(data: any[]): number {
    if (data.length < 2) return 0;

    const latest = data[data.length - 1]?.value || 0;
    const previous = data[data.length - 2]?.value || 0;

    if (previous === 0) return 0;

    return ((latest - previous) / previous) * 100;
  }

  /**
   * Identify cost savings opportunities
   */
  private async identifyCostSavingsOpportunities(
    costMetrics: any
  ): Promise<CostOptimization[]> {
    const opportunities: CostOptimization[] = [];

    // Model optimization opportunities
    costMetrics.modelCosts.forEach((model: any, index: number) => {
      if (model.costShare > 40) {
        opportunities.push({
          id: crypto.randomUUID(),
          type: 'model_selection',
          title: `Optimize ${model.modelName} usage`,
          description: `This model accounts for ${model.costShare.toFixed(1)}% of costs. Consider alternatives for simpler tasks.`,
          potentialSaving: model.totalCost * 0.25,
          savingsPercentage: 25,
          effort: 'medium',
          impact: 'high',
          priority: 100 - index * 10,
          actionItems: [
            'Review use cases for this model',
            'Use smart router for automatic optimization',
            'Consider lighter models for simple queries'
          ]
        });
      }
    });

    // Smart routing opportunity
    if (costMetrics.routerEfficiency < 50) {
      opportunities.push({
        id: crypto.randomUUID(),
        type: 'routing',
        title: 'Enable Smart Router',
        description: 'Automatic model selection can reduce costs by routing requests to the most cost-effective model.',
        potentialSaving: costMetrics.totalCost * 0.3,
        savingsPercentage: 30,
        effort: 'low',
        impact: 'high',
        priority: 95,
        actionItems: [
          'Enable smart router in settings',
          'Set routing preferences',
          'Monitor savings dashboard'
        ]
      });
    }

    return opportunities;
  }

  /**
   * Analyze model efficiency
   */
  private analyzeModelEfficiency(costMetrics: any): any[] {
    return costMetrics.modelCosts.map((model: any) => ({
      modelId: model.modelId,
      efficiencyScore: Math.max(0, 100 - model.costShare),
      recommendation: model.costShare > 40
        ? 'Consider using this model less frequently'
        : 'Efficient usage'
    }));
  }

  /**
   * Calculate optimization score
   */
  private calculateOptimizationScore(costMetrics: any): number {
    const savingsScore = Math.min(costMetrics.savingsPercentage, 50) * 2;
    const routingScore = Math.min(costMetrics.routerEfficiency, 100);

    return (savingsScore + routingScore) / 2;
  }

  /**
   * Generate highlights
   */
  private generateHighlights(metrics: AnalyticsMetrics): string[] {
    const highlights: string[] = [];

    if (metrics.costMetrics.totalSavings > 0) {
      highlights.push(`Saved $${metrics.costMetrics.totalSavings.toFixed(2)} with smart routing`);
    }

    if (metrics.performanceMetrics.successRate > 95) {
      highlights.push(`${metrics.performanceMetrics.successRate.toFixed(1)}% success rate`);
    }

    if (metrics.userMetrics.dailyActiveUsers.length > 0) {
      const latestDAU = metrics.userMetrics.dailyActiveUsers[metrics.userMetrics.dailyActiveUsers.length - 1]?.value || 0;
      highlights.push(`${latestDAU} active users today`);
    }

    return highlights;
  }

  /**
   * Forecast user growth
   */
  private forecastUserGrowth(historicalData: any[]): any[] {
    if (historicalData.length === 0) return [];

    const avgGrowth = this.calculateGrowthRate(historicalData) / 100;
    const latest = historicalData[historicalData.length - 1]?.value || 0;

    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      predicted: latest * Math.pow(1 + avgGrowth, i + 1),
      confidence: {
        lower: latest * Math.pow(1 + avgGrowth * 0.7, i + 1),
        upper: latest * Math.pow(1 + avgGrowth * 1.3, i + 1)
      }
    }));
  }

  /**
   * Forecast cost
   */
  private forecastCost(costMetrics: any): any[] {
    const dailyCost = costMetrics.totalCost / 7; // Assuming 7 day period

    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      predictedCost: dailyCost * (i + 1),
      confidence: 0.85
    }));
  }
}

// Singleton instance
let insightsGeneratorInstance: InsightsGenerator | null = null;

export function getInsightsGenerator(): InsightsGenerator {
  if (!insightsGeneratorInstance) {
    insightsGeneratorInstance = new InsightsGenerator();
  }
  return insightsGeneratorInstance;
}
