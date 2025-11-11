/**
 * Core type definitions for AI model integration and smart routing
 */

export type ProviderType =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'deepseek'
  | 'mistral'
  | 'perplexity'
  | 'meta'
  | 'cohere'
  | 'xai';

export type ModelType =
  | 'text'
  | 'code'
  | 'image'
  | 'audio'
  | 'multimodal';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

export interface ModelCapabilities {
  textGeneration: boolean;
  codeGeneration: boolean;
  reasoning: boolean;
  math: boolean;
  analysis: boolean;
  creative: boolean;
  multimodal: boolean;
  webSearch: boolean;
  functionCalling: boolean;
  streaming: boolean;
  contextWindow: number;
  maxOutputTokens: number;
  supportedLanguages?: string[];
  visionCapable?: boolean;
  audioCapable?: boolean;
}

export interface ModelPricing {
  inputTokenCost: number; // Cost per 1M tokens
  outputTokenCost: number; // Cost per 1M tokens
  minimumCharge?: number;
  batchDiscount?: number;
  currency: string;
}

export interface ModelLimits {
  maxRequestsPerMinute: number;
  maxTokensPerRequest: number;
  maxConcurrentRequests: number;
  quotaLimits?: {
    daily?: number;
    monthly?: number;
  };
}

export interface ModelPerformance {
  averageLatency: number; // milliseconds
  tokensPerSecond: number;
  qualityScore: number; // 1-100
  reliabilityScore: number; // 1-100
  costEfficiency: number; // quality/cost ratio
  userSatisfaction: number; // from feedback
  successRate: number; // percentage
  lastUpdated: Date;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderType;
  type: ModelType;
  version: string;
  capabilities: ModelCapabilities;
  pricing: ModelPricing;
  limits: ModelLimits;
  performance: ModelPerformance;
  specializations: string[];
  description: string;
  releaseDate?: Date;
  deprecationDate?: Date;
  isAvailable: boolean;
  requiresApproval?: boolean;
}

export interface CompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  userId: string;
  projectId?: string;
  metadata?: Record<string, any>;
}

export interface CompletionResponse {
  id: string;
  model: string;
  content: string;
  role: 'assistant';
  finishReason: 'stop' | 'length' | 'content_filter' | 'function_call';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  responseTime: number; // milliseconds
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface StreamChunk {
  id: string;
  delta: string;
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface ModelRequest {
  messages: Message[];
  userId: string;
  projectId?: string;
  preferences?: UserPreferences;
  constraints?: RequestConstraints;
  context?: RequestContext;
}

export interface UserPreferences {
  preferredModels?: string[];
  avoidModels?: string[];
  maxCostPerRequest?: number;
  minQualityScore?: number;
  prioritizeCost?: boolean;
  prioritizeSpeed?: boolean;
  prioritizeQuality?: boolean;
}

export interface RequestConstraints {
  maxLatency?: number;
  maxCost?: number;
  requireStreaming?: boolean;
  requireFunctionCalling?: boolean;
  requireVision?: boolean;
}

export interface RequestContext {
  conversationHistory?: Message[];
  projectType?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  domain?: string;
}

export interface Intent {
  primary: IntentType;
  secondary?: IntentType;
  confidence: number;
  keywords: string[];
  patterns: string[];
}

export type IntentType =
  | 'code_generation'
  | 'code_review'
  | 'debugging'
  | 'reasoning'
  | 'creative_writing'
  | 'analysis'
  | 'research'
  | 'math'
  | 'conversation'
  | 'translation'
  | 'summarization'
  | 'question_answering';

export interface ComplexityScore {
  promptLength: number;
  technicalDepth: number;
  multiStep: number;
  contextDependency: number;
  domainSpecificity: number;
  outputRequirements: number;
  overall: number;
}

export interface ModelSelection {
  model: ModelConfig;
  confidence: number;
  reasoning: string[];
  alternatives: ModelConfig[];
  estimatedCost: number;
  estimatedLatency: number;
  estimatedQuality: number;
}

export interface UsageMetrics {
  modelId: string;
  userId: string;
  requestCount: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  successRate: number;
  errorRate: number;
  timestamp: Date;
}

export interface UserFeedback {
  modelId: string;
  userId: string;
  requestId: string;
  rating: number; // 1-5
  qualityScore?: number;
  speedScore?: number;
  valueScore?: number;
  comments?: string;
  timestamp: Date;
}

export interface ABTestConfig {
  id: string;
  name: string;
  modelA: string;
  modelB: string;
  trafficSplit: number; // 0-100
  metrics: string[];
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'completed';
}

export interface ABTestResult {
  testId: string;
  modelA: {
    model: string;
    metrics: Record<string, number>;
  };
  modelB: {
    model: string;
    metrics: Record<string, number>;
  };
  winner?: string;
  significance: number;
  sampleSize: number;
}

export interface EnsembleRequest {
  models: string[];
  strategy: 'voting' | 'weighted' | 'best_of' | 'consensus';
  weights?: Record<string, number>;
  threshold?: number;
}

export interface EnsembleResponse {
  result: string;
  contributors: Array<{
    model: string;
    response: string;
    weight: number;
  }>;
  confidence: number;
  agreementScore: number;
}

export interface FineTuneConfig {
  baseModel: string;
  trainingData: TrainingData[];
  validationData?: TrainingData[];
  epochs: number;
  batchSize: number;
  learningRate: number;
  name: string;
  description?: string;
}

export interface TrainingData {
  prompt: string;
  completion: string;
  metadata?: Record<string, any>;
}

export interface ModelProvider {
  name: ProviderType;
  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;
  streamCompletion(request: CompletionRequest): AsyncGenerator<StreamChunk>;
  checkAvailability(): Promise<boolean>;
  getModels(): ModelConfig[];
}

export interface RouterMetrics {
  totalRequests: number;
  modelDistribution: Record<string, number>;
  averageSelectionTime: number;
  accuracyScore: number;
  costSavings: number;
  lastUpdated: Date;
}
