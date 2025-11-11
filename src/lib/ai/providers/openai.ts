/**
 * OpenAI Provider Implementation
 * Supports GPT-4o, GPT-4 Turbo, o1, DALL-E, Whisper, and TTS models
 */

import OpenAI from 'openai';
import {
  ModelProvider,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ModelConfig,
} from '../types';
import { getModelsByProvider } from '../models/registry';

export class OpenAIProvider implements ModelProvider {
  name: 'openai' = 'openai';
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  getModels(): ModelConfig[] {
    return getModelsByProvider('openai');
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI availability check failed:', error);
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

      const response = await this.client.chat.completions.create({
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
      });

      const responseTime = Date.now() - startTime;
      const choice = response.choices[0];

      return {
        id: response.id,
        model: response.model,
        content: choice.message.content || '',
        role: 'assistant',
        finishReason: this.mapFinishReason(choice.finish_reason),
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        responseTime,
        timestamp: new Date(),
        metadata: {
          finishReason: choice.finish_reason,
          model: response.model,
          systemFingerprint: response.system_fingerprint,
        },
      };
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async *streamCompletion(
    request: CompletionRequest
  ): AsyncGenerator<StreamChunk> {
    try {
      const stream = await this.client.chat.completions.create({
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
      });

      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        if (!choice) continue;

        if (choice.delta.content) {
          yield {
            id: chunk.id,
            delta: choice.delta.content,
          };
        }

        if (choice.finish_reason) {
          yield {
            id: chunk.id,
            delta: '',
            finishReason: this.mapFinishReason(choice.finish_reason),
          };
        }
      }
    } catch (error: any) {
      throw new Error(`OpenAI streaming error: ${error.message}`);
    }
  }

  async generateImage(
    prompt: string,
    options?: {
      model?: string;
      size?: '1024x1024' | '1792x1024' | '1024x1792';
      quality?: 'standard' | 'hd';
      n?: number;
    }
  ): Promise<{ url: string; revised_prompt?: string }[]> {
    try {
      const response = await this.client.images.generate({
        model: options?.model || 'dall-e-3',
        prompt,
        size: options?.size || '1024x1024',
        quality: options?.quality || 'standard',
        n: options?.n || 1,
      });

      return response.data.map((img) => ({
        url: img.url || '',
        revised_prompt: img.revised_prompt,
      }));
    } catch (error: any) {
      throw new Error(`DALL-E API error: ${error.message}`);
    }
  }

  async transcribeAudio(
    audioFile: File,
    options?: {
      model?: string;
      language?: string;
      prompt?: string;
      temperature?: number;
    }
  ): Promise<{ text: string }> {
    try {
      const response = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: options?.model || 'whisper-1',
        language: options?.language,
        prompt: options?.prompt,
        temperature: options?.temperature,
      });

      return { text: response.text };
    } catch (error: any) {
      throw new Error(`Whisper API error: ${error.message}`);
    }
  }

  async generateSpeech(
    text: string,
    options?: {
      model?: string;
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      speed?: number;
    }
  ): Promise<ArrayBuffer> {
    try {
      const response = await this.client.audio.speech.create({
        model: options?.model || 'tts-1',
        voice: options?.voice || 'alloy',
        input: text,
        speed: options?.speed,
      });

      return await response.arrayBuffer();
    } catch (error: any) {
      throw new Error(`TTS API error: ${error.message}`);
    }
  }

  private mapFinishReason(
    reason: string | null
  ): 'stop' | 'length' | 'content_filter' | 'function_call' {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
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
