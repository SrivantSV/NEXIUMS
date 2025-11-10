/**
 * Anthropic Provider Implementation
 * Supports all 7 Claude models with streaming and error handling
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  ModelProvider,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ModelConfig,
} from '../types';
import { getModelsByProvider } from '../models/registry';

export class AnthropicProvider implements ModelProvider {
  name: 'anthropic' = 'anthropic';
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  getModels(): ModelConfig[] {
    return getModelsByProvider('anthropic');
  }

  async checkAvailability(): Promise<boolean> {
    try {
      // Simple ping test
      await this.client.messages.create({
        model: 'claude-haiku-3',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return true;
    } catch (error) {
      console.error('Anthropic availability check failed:', error);
      return false;
    }
  }

  async generateCompletion(
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    const startTime = Date.now();

    try {
      if (request.stream) {
        throw new Error(
          'Use streamCompletion for streaming requests'
        );
      }

      const response = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        messages: request.messages.filter((m) => m.role !== 'system'),
        system: request.messages.find((m) => m.role === 'system')?.content,
        temperature: request.temperature ?? 1.0,
        top_p: request.topP,
        stop_sequences: request.stop,
      });

      const responseTime = Date.now() - startTime;

      return {
        id: response.id,
        model: request.model,
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        role: 'assistant',
        finishReason: this.mapStopReason(response.stop_reason),
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        responseTime,
        timestamp: new Date(),
        metadata: {
          stopReason: response.stop_reason,
          model: response.model,
        },
      };
    } catch (error: any) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  async *streamCompletion(
    request: CompletionRequest
  ): AsyncGenerator<StreamChunk> {
    try {
      const stream = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        messages: request.messages.filter((m) => m.role !== 'system'),
        system: request.messages.find((m) => m.role === 'system')?.content,
        temperature: request.temperature ?? 1.0,
        top_p: request.topP,
        stop_sequences: request.stop,
        stream: true,
      });

      let messageId = '';

      for await (const event of stream) {
        if (event.type === 'message_start') {
          messageId = event.message.id;
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            yield {
              id: messageId,
              delta: event.delta.text,
            };
          }
        } else if (event.type === 'message_delta') {
          if (event.delta.stop_reason) {
            yield {
              id: messageId,
              delta: '',
              finishReason: this.mapStopReason(event.delta.stop_reason),
            };
          }
        }
      }
    } catch (error: any) {
      throw new Error(`Anthropic streaming error: ${error.message}`);
    }
  }

  private mapStopReason(
    reason: string | null
  ): 'stop' | 'length' | 'content_filter' | 'function_call' {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }
}
