// Analytics API - Main endpoint for fetching analytics data
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMetricsAggregator } from '@/lib/analytics/metrics-aggregator';
import { getInsightsGenerator } from '@/lib/analytics/insights-generator';
import type { Timeframe, AnalyticsFilters } from '@/types/analytics';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') || '7d') as Timeframe;
    const userId = searchParams.get('userId') || user.id;
    const modelId = searchParams.get('modelId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;

    // Build filters
    const filters: AnalyticsFilters = {
      userId,
      modelId,
      teamId
    };

    // Get metrics
    const aggregator = getMetricsAggregator();
    const metrics = await aggregator.getMetrics(period, filters);

    // Generate insights
    const insightsGenerator = getInsightsGenerator();
    const insights = await insightsGenerator.generateInsights(metrics, userId);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        insights
      }
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
