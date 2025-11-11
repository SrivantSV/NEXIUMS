// Analytics Export API - Export analytics data in various formats
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMetricsAggregator } from '@/lib/analytics/metrics-aggregator';
import { getInsightsGenerator } from '@/lib/analytics/insights-generator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { format = 'json', period = '7d', includeInsights = true } = body;

    // Get analytics data
    const aggregator = getMetricsAggregator();
    const metrics = await aggregator.getMetrics(period, { userId: user.id });

    let data: any = { metrics };

    if (includeInsights) {
      const insightsGenerator = getInsightsGenerator();
      const insights = await insightsGenerator.generateInsights(metrics, user.id);
      data.insights = insights;
    }

    // Format data based on requested format
    if (format === 'csv') {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString()}.csv"`
        }
      });
    }

    // Default to JSON
    return NextResponse.json({
      success: true,
      data,
      exportedAt: new Date().toISOString(),
      format
    });
  } catch (error) {
    console.error('Analytics export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any): string {
  // Simple CSV conversion for metrics
  const lines: string[] = [];

  // Header
  lines.push('Metric,Value');

  // Cost metrics
  if (data.metrics?.costMetrics) {
    lines.push(`Total Cost,${data.metrics.costMetrics.totalCost}`);
    lines.push(`Cost Per Request,${data.metrics.costMetrics.costPerRequest}`);
    lines.push(`Total Savings,${data.metrics.costMetrics.totalSavings}`);
  }

  // Performance metrics
  if (data.metrics?.performanceMetrics) {
    lines.push(`Avg Response Time,${data.metrics.performanceMetrics.averageResponseTime}`);
    lines.push(`Success Rate,${data.metrics.performanceMetrics.successRate}`);
    lines.push(`Error Rate,${data.metrics.performanceMetrics.errorRate}`);
  }

  return lines.join('\n');
}
