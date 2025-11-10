/**
 * AI Analytics API Endpoint
 * Performance metrics and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { performanceTracker } from '@/lib/ai/analytics/performance-tracker';
import { costOptimizer } from '@/lib/ai/analytics/cost-optimizer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const modelId = searchParams.get('modelId');
    const category = searchParams.get('category');

    switch (type) {
      case 'performance':
        if (!modelId) {
          return NextResponse.json(
            { error: 'modelId is required for performance metrics' },
            { status: 400 }
          );
        }
        const performance = await performanceTracker.getModelPerformance(modelId);
        return NextResponse.json({ performance });

      case 'top-models':
        const topCategory = (category as any) || 'quality';
        const topModels = await performanceTracker.getTopModels(topCategory, 10);
        return NextResponse.json({ topModels });

      case 'cost-analysis':
        if (!modelId) {
          return NextResponse.json(
            { error: 'modelId is required for cost analysis' },
            { status: 400 }
          );
        }
        // Return cost analysis for a model
        return NextResponse.json({
          message: 'Cost analysis endpoint - implement based on requirements',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type. Use: performance, top-models, cost-analysis' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    switch (type) {
      case 'feedback':
        // Process user feedback
        await performanceTracker.processUserFeedback(data);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
