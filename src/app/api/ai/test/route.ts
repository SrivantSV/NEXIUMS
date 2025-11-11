/**
 * AI A/B Testing API Endpoint
 * Create and manage A/B tests for model comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import { abTester } from '@/lib/ai/testing/ab-tester';
import { ABTestConfig } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create':
        const config: ABTestConfig = {
          id: crypto.randomUUID(),
          name: data.name,
          modelA: data.modelA,
          modelB: data.modelB,
          trafficSplit: data.trafficSplit || 50,
          metrics: data.metrics || ['latency', 'cost', 'quality'],
          startDate: new Date(),
          status: 'active',
        };

        const testId = await abTester.createTest(config);
        return NextResponse.json({ testId, config });

      case 'record':
        await abTester.recordTestResult(
          data.testId,
          data.modelId,
          data.response,
          data.cost,
          data.userRating
        );
        return NextResponse.json({ success: true });

      case 'stop':
        const result = await abTester.stopTest(data.testId);
        return NextResponse.json({ result });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, record, stop' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('A/B Test API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testId = searchParams.get('testId');

    if (testId) {
      const result = await abTester.getTestResults(testId);
      return NextResponse.json({ result });
    }

    const activeTests = abTester.getActiveTests();
    return NextResponse.json({ activeTests });
  } catch (error: any) {
    console.error('A/B Test API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
