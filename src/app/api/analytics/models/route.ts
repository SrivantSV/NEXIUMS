// Model Analytics API - Model performance and usage metrics
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
        usage: metrics.modelMetrics.requestsPerModel,
        performance: {
          responseTime: metrics.modelMetrics.responseTime,
          successRate: metrics.performanceMetrics.successRate,
          reliability: metrics.performanceMetrics.successRate
        },
        quality: {
          satisfaction: metrics.modelMetrics.userSatisfaction,
          accuracy: metrics.modelMetrics.accuracyScores
        },
        router: {
          accuracy: metrics.modelMetrics.routingAccuracy,
          confidence: metrics.modelMetrics.routingConfidence,
          selections: metrics.routingMetrics.modelSelections
        },
        comparisons: metrics.modelMetrics.modelComparisons
      }
    });
  } catch (error) {
    console.error('Model analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model analytics' },
      { status: 500 }
    );
  }
}
