/**
 * Universal Provider for DeepSeek, Mistral, Perplexity, Meta, Cohere, and XAI
 * Uses OpenAI-compatible API endpoints
 */

import axios, { AxiosInstance } from 'axios';
import {
  ModelProvider,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ModelConfig,
  ProviderType,
} from '../types';
import { getModelsByProvider } from '../models/registry';

const PROVIDER_ENDPOINTS: Record<string, string> = {
  deepseek: 'https://api.deepseek.com/v1',
  mistral: 'https://api.mistral.ai/v1',
  perplexity: 'https://api.perplexity.ai',
  cohere: 'https://api.cohere.ai/v1',
  xai: 'https://api.x.ai/v1',
  meta: 'https://api.together.xyz/v1', // Meta Llama via Together AI
};

const API_KEY_ENV_MAP: Record<string, string> = {
  deepseek: 'DEEPSEEK_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
  cohere: 'COHERE_API_KEY',
  xai: 'XAI_API_KEY',
  meta: 'TOGETHER_API_KEY',
};

export class UniversalProvider implements ModelProvider {
  name: ProviderType;
  private client: AxiosInstance;
  private providerType: string;

  constructor(provider: ProviderType, apiKey?: string) {
    this.name = provider;
    this.providerType = provider;

    const baseURL = PROVIDER_ENDPOINTS[provider];
    const envKey = API_KEY_ENV_MAP[provider];
    const key = apiKey || process.env[envKey];

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
  }

  getModels(): ModelConfig[] {
    return getModelsByProvider(this.providerType);
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.client.get('/models');
      return true;
    } catch (error) {
      console.error(`${this.providerType} availability check failed:`, error);
      return false;
    }
  }

  async generateCompletion(
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    const startTime = Date.now();

    try {
      if (request.stream) {
        throw new Error('Use streamCompletion for streaming requests');
      }

      const response = await this.client.post('/chat/completions', {
        model: request.model,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stop: request.stop,
        stream: false,
      });

      const responseTime = Date.now() - startTime;
      const data = response.data;
      const choice = data.choices[0];

      return {
        id: data.id,
        model: data.model,
        content: choice.message.content || '',
        role: 'assistant',
        finishReason: this.mapFinishReason(choice.finish_reason),
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        responseTime,
        timestamp: new Date(),
        metadata: {
          finishReason: choice.finish_reason,
          model: data.model,
        },
      };
    } catch (error: any) {
      throw new Error(
        `${this.providerType} API error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async *streamCompletion(
    request: CompletionRequest
  ): AsyncGenerator<StreamChunk> {
    try {
      const response = await this.client.post(
        '/chat/completions',
        {
          model: request.model,
          messages: request.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          temperature: request.temperature,
          max_tokens: request.maxTokens,
          top_p: request.topP,
          frequency_penalty: request.frequencyPenalty,
          presence_penalty: request.presencePenalty,
          stop: request.stop,
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      let buffer = '';
      let messageId = '';

      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
            messageId = data.id;
            const choice = data.choices?.[0];

            if (choice?.delta?.content) {
              yield {
                id: messageId,
                delta: choice.delta.content,
              };
            }

            if (choice?.finish_reason) {
              yield {
                id: messageId,
                delta: '',
                finishReason: this.mapFinishReason(choice.finish_reason),
              };
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error: any) {
      throw new Error(
        `${this.providerType} streaming error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  private mapFinishReason(
    reason: string | null
  ): 'stop' | 'length' | 'content_filter' | 'function_call' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
      case 'max_tokens':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      case 'function_call':
      case 'tool_calls':
        return 'function_call';
      default:
        return 'stop';
    }
  }
}
