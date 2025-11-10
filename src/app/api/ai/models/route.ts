/**
 * AI Models API Endpoint
 * List and query available AI models
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAvailableModels,
  getModelById,
  getModelsByProvider,
  getModelsByCapability,
} from '@/lib/ai/models/registry';
import { performanceTracker } from '@/lib/ai/analytics/performance-tracker';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider');
    const capability = searchParams.get('capability');
    const modelId = searchParams.get('id');
    const includePerformance = searchParams.get('performance') === 'true';

    // Get specific model
    if (modelId) {
      const model = getModelById(modelId);
      if (!model) {
        return NextResponse.json(
          { error: 'Model not found' },
          { status: 404 }
        );
      }

      const performance = includePerformance
        ? await performanceTracker.getModelPerformance(modelId)
        : undefined;

      return NextResponse.json({
        ...model,
        performance: performance || model.performance,
      });
    }

    // Get models by provider
    if (provider) {
      const models = getModelsByProvider(provider);
      return NextResponse.json({ models });
    }

    // Get models by capability
    if (capability) {
      const models = getModelsByCapability(capability as any);
      return NextResponse.json({ models });
    }

    // Get all available models
    const models = getAvailableModels();

    // Optionally include real-time performance data
    if (includePerformance) {
      const modelsWithPerformance = await Promise.all(
        models.map(async (model) => {
          const performance = await performanceTracker.getModelPerformance(model.id);
          return {
            ...model,
            performance: performance || model.performance,
          };
        })
      );

      return NextResponse.json({ models: modelsWithPerformance });
    }

    return NextResponse.json({ models });
  } catch (error: any) {
    console.error('Models API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
