/**
 * Google AI Provider Implementation
 * Supports Gemini 1.0 Pro, 1.5 Pro, 1.5 Flash, 2.0 Flash, and Imagen models
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ModelProvider,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ModelConfig,
} from '../types';
import { getModelsByProvider } from '../models/registry';

export class GoogleProvider implements ModelProvider {
  name: 'google' = 'google';
  private client: GoogleGenerativeAI;

  constructor(apiKey?: string) {
    this.client = new GoogleGenerativeAI(
      apiKey || process.env.GOOGLE_AI_API_KEY || ''
    );
  }

  getModels(): ModelConfig[] {
    return getModelsByProvider('google');
  }

  async checkAvailability(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-1.0-pro' });
      await model.generateContent('ping');
      return true;
    } catch (error) {
      console.error('Google AI availability check failed:', error);
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

      const model = this.client.getGenerativeModel({
        model: request.model,
      });

      // Convert messages to Gemini format
      const contents = this.convertMessages(request.messages);

      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
          topP: request.topP,
          stopSequences: request.stop,
        },
      });

      const response = result.response;
      const responseTime = Date.now() - startTime;

      return {
        id: crypto.randomUUID(),
        model: request.model,
        content: response.text(),
        role: 'assistant',
        finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        responseTime,
        timestamp: new Date(),
        metadata: {
          finishReason: response.candidates?.[0]?.finishReason,
          model: request.model,
        },
      };
    } catch (error: any) {
      throw new Error(`Google AI API error: ${error.message}`);
    }
  }

  async *streamCompletion(
    request: CompletionRequest
  ): AsyncGenerator<StreamChunk> {
    try {
      const model = this.client.getGenerativeModel({
        model: request.model,
      });

      const contents = this.convertMessages(request.messages);

      const result = await model.generateContentStream({
        contents,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
          topP: request.topP,
          stopSequences: request.stop,
        },
      });

      const id = crypto.randomUUID();

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield {
            id,
            delta: text,
          };
        }
      }

      const response = await result.response;
      yield {
        id,
        delta: '',
        finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
      };
    } catch (error: any) {
      throw new Error(`Google AI streaming error: ${error.message}`);
    }
  }

  private convertMessages(messages: any[]) {
    // Convert OpenAI-style messages to Gemini format
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    return conversationMessages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: msg.role === 'user' && systemMessage
            ? `${systemMessage.content}\n\n${msg.content}`
            : msg.content,
        },
      ],
    }));
  }

  private mapFinishReason(
    reason?: string
  ): 'stop' | 'length' | 'content_filter' | 'function_call' {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
      case 'RECITATION':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
