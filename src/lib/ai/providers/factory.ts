/**
 * Model Provider Factory
 * Creates and manages provider instances
 */

import { ModelProvider, ProviderType } from '../types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GoogleProvider } from './google';
import { UniversalProvider } from './universal';
import { getModelById } from '../models/registry';

export class ModelProviderFactory {
  private providers: Map<string, ModelProvider> = new Map();

  /**
   * Get provider for a specific model
   */
  getProvider(modelId: string): ModelProvider {
    const model = getModelById(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    return this.getProviderByType(model.provider);
  }

  /**
   * Get provider by provider type
   */
  getProviderByType(providerType: ProviderType): ModelProvider {
    // Check cache
    if (this.providers.has(providerType)) {
      return this.providers.get(providerType)!;
    }

    // Create new provider instance
    let provider: ModelProvider;

    switch (providerType) {
      case 'anthropic':
        provider = new AnthropicProvider();
        break;

      case 'openai':
        provider = new OpenAIProvider();
        break;

      case 'google':
        provider = new GoogleProvider();
        break;

      case 'deepseek':
      case 'mistral':
      case 'perplexity':
      case 'meta':
      case 'cohere':
      case 'xai':
        provider = new UniversalProvider(providerType);
        break;

      default:
        throw new Error(`Unknown provider: ${providerType}`);
    }

    // Cache provider
    this.providers.set(providerType, provider);

    return provider;
  }

  /**
   * Check availability of all providers
   */
  async checkAllProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    const providers: ProviderType[] = [
      'anthropic',
      'openai',
      'google',
      'deepseek',
      'mistral',
      'perplexity',
      'cohere',
    ];

    await Promise.all(
      providers.map(async (type) => {
        try {
          const provider = this.getProviderByType(type);
          results[type] = await provider.checkAvailability();
        } catch (error) {
          results[type] = false;
        }
      })
    );

    return results;
  }

  /**
   * Clear provider cache
   */
  clearCache(): void {
    this.providers.clear();
  }
}

// Export singleton instance
export const providerFactory = new ModelProviderFactory();
