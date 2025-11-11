/**
 * Integrated Chat API
 * Combines Authentication + AI Models + Chat with full integration
 *
 * Features:
 * - Authenticated requests with user context
 * - AI model selection (smart router or manual)
 * - Cost tracking and billing
 * - Streaming responses
 * - Rate limiting based on subscription
 * - Quota enforcement
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedHandler, trackUsage, type UserContext } from '@/lib/integration/api-middleware';
import { aiService } from '@/lib/ai';
import type { Message } from '@/lib/ai/types';

export const runtime = 'edge';

interface ChatRequest {
  messages: Message[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  conversationId?: string;
}

/**
 * POST /api/integrated/chat
 * Send a chat message and get AI response
 */
export const POST = createAuthenticatedHandler(
  async (request: NextRequest, userContext: UserContext) => {
    const startTime = Date.now();
    const body: ChatRequest = await request.json();

    const { messages, model, stream = false, temperature, maxTokens, conversationId } = body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Messages array is required' },
        { status: 400 }
      );
    }

    try {
      // Determine which model to use
      const selectedModel = model || (userContext.preferences.default_smart_router ? null : undefined);

      // Prepare AI request
      const aiRequest = {
        messages,
        userId: userContext.userId,
        conversationId,
        preferences: {
          preferredModels: userContext.preferences.preferredModels,
          prioritizeQuality: userContext.subscription.tier !== 'free',
          prioritizeCost: userContext.subscription.tier === 'free',
          maxCostPerRequest:
            userContext.subscription.tier === 'free' ? 0.01 :
            userContext.subscription.tier === 'pro' ? 0.1 : 1.0,
        },
        temperature,
        maxTokens,
      };

      // Handle streaming response
      if (stream) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              let totalCost = 0;
              let responseModel = '';

              // Generate completion with streaming
              for await (const chunk of aiService.streamCompletion({
                ...aiRequest,
                model: selectedModel || 'smart-router',
              })) {
                // Send chunk to client
                const data = JSON.stringify({
                  delta: chunk.delta,
                  model: chunk.model || responseModel,
                  finishReason: chunk.finishReason,
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));

                // Track model and cost
                if (chunk.model) responseModel = chunk.model;
                if (chunk.cost) totalCost = chunk.cost;
              }

              // Track usage
              await trackUsage(userContext.userId, {
                endpoint: '/api/integrated/chat',
                model: responseModel,
                tokens: { input: 0, output: 0 }, // Will be populated by streaming
                cost: totalCost,
                responseTime: Date.now() - startTime,
                success: true,
              });

              // Send final cost
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ cost: totalCost, model: responseModel })}\n\n`)
              );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (error: any) {
              console.error('Streaming error:', error);
              const errorData = JSON.stringify({ error: error.message });
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
              controller.close();

              // Track failed usage
              await trackUsage(userContext.userId, {
                endpoint: '/api/integrated/chat',
                responseTime: Date.now() - startTime,
                success: false,
              });
            }
          },
        });

        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      // Handle non-streaming response
      const response = await aiService.generateCompletion({
        ...aiRequest,
        model: selectedModel,
      });

      // Calculate cost
      const cost =
        (response.usage.promptTokens / 1_000_000) * 0.003 +
        (response.usage.completionTokens / 1_000_000) * 0.015;

      // Track usage
      await trackUsage(userContext.userId, {
        endpoint: '/api/integrated/chat',
        model: response.model,
        tokens: {
          input: response.usage.promptTokens,
          output: response.usage.completionTokens,
        },
        cost,
        responseTime: Date.now() - startTime,
        success: true,
      });

      // Return response with cost and model info
      return NextResponse.json({
        id: response.id,
        content: response.content,
        model: response.model,
        role: 'assistant',
        usage: response.usage,
        cost,
        responseTime: Date.now() - startTime,
        routing: selectedModel
          ? undefined
          : {
              selectedModel: response.model,
              wasRouted: true,
            },
      });
    } catch (error: any) {
      console.error('AI chat error:', error);

      // Track failed usage
      await trackUsage(userContext.userId, {
        endpoint: '/api/integrated/chat',
        responseTime: Date.now() - startTime,
        success: false,
      });

      return NextResponse.json(
        {
          error: 'AI request failed',
          message: error.message || 'Failed to generate response',
        },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
    skipQuotaCheck: false, // Enforce quota limits
  }
);
