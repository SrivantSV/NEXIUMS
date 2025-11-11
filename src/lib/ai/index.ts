/**
 * Nexus AI - Main Export File
 * Provides clean exports for all AI functionality
 */

// Types
export * from './types';

// Model Registry
export {
  MODEL_REGISTRY,
  getModelById,
  getModelsByProvider,
  getAvailableModels,
  getModelsByCapability,
  getModelsByType,
} from './models/registry';

// Providers
export { AnthropicProvider } from './providers/anthropic';
export { OpenAIProvider } from './providers/openai';
export { GoogleProvider } from './providers/google';
export { UniversalProvider } from './providers/universal';
export { ModelProviderFactory, providerFactory } from './providers/factory';

// Smart Router
export { SmartRouter, smartRouter } from './router/smart-router';

// Analytics
export { PerformanceTracker, performanceTracker } from './analytics/performance-tracker';
export { CostOptimizer, costOptimizer } from './analytics/cost-optimizer';

// Testing
export { ABTester, abTester } from './testing/ab-tester';

// Ensemble
export { ModelEnsemble, modelEnsemble } from './ensemble/model-ensemble';
