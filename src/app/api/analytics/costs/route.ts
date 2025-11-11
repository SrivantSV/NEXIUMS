// Cost Analytics API - Detailed cost breakdown and optimization insights
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMetricsAggregator } from '@/lib/analytics/metrics-aggregator';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';

    const aggregator = getMetricsAggregator();
    const metrics = await aggregator.getMetrics(period as any, { userId: user.id });

    return NextResponse.json({
      success: true,
      data: {
        totalCost: metrics.costMetrics.totalCost,
        costPerRequest: metrics.costMetrics.costPerRequest,
        modelCosts: metrics.costMetrics.modelCosts,
        savings: {
          total: metrics.costMetrics.totalSavings,
          percentage: metrics.costMetrics.savingsPercentage,
          potential: metrics.costMetrics.potentialCost,
          actual: metrics.costMetrics.actualCost
        },
        optimization: {
          score: metrics.costMetrics.routerEfficiency,
          opportunities: metrics.costMetrics.optimizationOpportunities,
          recommendations: metrics.costMetrics.recommendedActions
        },
        forecast: {
          monthly: metrics.costMetrics.monthlyForecast,
          quarterly: metrics.costMetrics.quarterlyForecast,
          yearly: metrics.costMetrics.yearlyForecast
        }
      }
    });
  } catch (error) {
    console.error('Cost analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost analytics' },
      { status: 500 }
    );
  }
}
