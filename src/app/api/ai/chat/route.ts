/**
 * AI Chat API Endpoint
 * Main endpoint for AI model interactions with smart routing
 */

import { NextRequest, NextResponse } from 'next/server';
import { smartRouter } from '@/lib/ai/router/smart-router';
import { providerFactory } from '@/lib/ai/providers/factory';
import { performanceTracker } from '@/lib/ai/analytics/performance-tracker';
import { CompletionRequest } from '@/lib/ai/types';
import { getModelById } from '@/lib/ai/models/registry';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages,
      model,
      stream = false,
      temperature,
      maxTokens,
      userId = 'anonymous',
      projectId,
      preferences,
      constraints,
    } = body;

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Select model (use smart router if no model specified)
    let selectedModelId = model;
    let routingReasoning: string[] = [];

    if (!selectedModelId) {
      const selection = await smartRouter.selectModel({
        messages,
        userId,
        projectId,
        preferences,
        constraints,
      });

      selectedModelId = selection.model.id;
      routingReasoning = selection.reasoning;
    }

    // Validate model exists
    const modelConfig = getModelById(selectedModelId);
    if (!modelConfig) {
      return NextResponse.json(
        { error: `Model not found: ${selectedModelId}` },
        { status: 404 }
      );
    }

    // Check if model is available
    if (!modelConfig.isAvailable) {
      return NextResponse.json(
        { error: `Model is not available: ${selectedModelId}` },
        { status: 503 }
      );
    }

    // Get provider
    const provider = providerFactory.getProvider(selectedModelId);

    // Prepare request
    const completionRequest: CompletionRequest = {
      model: selectedModelId,
      messages,
      temperature,
      maxTokens,
      stream,
      userId,
      projectId,
    };

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of provider.streamCompletion(completionRequest)) {
              const data = JSON.stringify(chunk);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error: any) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming response
    const response = await provider.generateCompletion(completionRequest);

    // Track performance
    await performanceTracker.trackModelPerformance(
      selectedModelId,
      completionRequest,
      response
    );

    // Calculate cost
    const cost = calculateCost(modelConfig, response.usage);

    return NextResponse.json({
      id: response.id,
      model: selectedModelId,
      content: response.content,
      usage: response.usage,
      cost,
      responseTime: response.responseTime,
      finishReason: response.finishReason,
      routing: model ? undefined : {
        selectedModel: selectedModelId,
        reasoning: routingReasoning,
      },
    });
  } catch (error: any) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateCost(model: any, usage: any): number {
  const inputCost = (usage.promptTokens / 1_000_000) * model.pricing.inputTokenCost;
  const outputCost = (usage.completionTokens / 1_000_000) * model.pricing.outputTokenCost;
  return inputCost + outputCost;
}
