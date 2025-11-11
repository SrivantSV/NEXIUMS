/**
 * Smart Router Engine
 * Advanced AI model selection with intent classification, complexity analysis,
 * and cost optimization
 */

import {
  ModelRequest,
  ModelSelection,
  Intent,
  IntentType,
  ComplexityScore,
  ModelConfig,
  UserPreferences,
  RequestConstraints,
} from '../types';
import { MODEL_REGISTRY, getAvailableModels } from '../models/registry';

export class SmartRouter {
  private performanceCache: Map<string, any> = new Map();

  /**
   * Main entry point for smart model selection
   */
  async selectModel(request: ModelRequest): Promise<ModelSelection> {
    // 1. Intent Classification
    const intent = await this.classifyIntent(request);

    // 2. Complexity Analysis
    const complexity = await this.analyzeComplexity(request);

    // 3. Get Candidate Models
    const candidates = await this.getCandidateModels(intent, complexity, request);

    // 4. Score and Rank Models
    const rankedModels = await this.rankModels(candidates, {
      intent,
      complexity,
      preferences: request.preferences,
      constraints: request.constraints,
    });

    // 5. Final Selection
    return this.finalSelection(rankedModels, request);
  }

  /**
   * Advanced intent classification using keyword analysis and pattern matching
   */
  private async classifyIntent(request: ModelRequest): Promise<Intent> {
    const lastMessage = request.messages[request.messages.length - 1];
    const prompt = lastMessage?.content || '';
    const lowerPrompt = prompt.toLowerCase();

    // Extract keywords
    const keywords = this.extractKeywords(prompt);

    // Pattern matching for different intents
    const codePatterns = [
      /write.*code/i,
      /function/i,
      /class/i,
      /implement/i,
      /refactor/i,
      /bug/i,
      /debug/i,
      /```/,
      /algorithm/i,
    ];

    const reasoningPatterns = [
      /analyze/i,
      /explain/i,
      /why/i,
      /how.*work/i,
      /reasoning/i,
      /logic/i,
      /think/i,
      /deduce/i,
    ];

    const mathPatterns = [
      /calculate/i,
      /solve.*equation/i,
      /math/i,
      /formula/i,
      /integral/i,
      /derivative/i,
      /probability/i,
    ];

    const creativePatterns = [
      /write.*story/i,
      /creative/i,
      /poem/i,
      /fictional/i,
      /imagine/i,
      /brainstorm/i,
    ];

    const researchPatterns = [
      /research/i,
      /find.*information/i,
      /latest/i,
      /current/i,
      /news/i,
      /what.*is/i,
    ];

    // Score each intent type
    const scores = {
      code_generation: this.scorePatterns(lowerPrompt, codePatterns),
      reasoning: this.scorePatterns(lowerPrompt, reasoningPatterns),
      math: this.scorePatterns(lowerPrompt, mathPatterns),
      creative_writing: this.scorePatterns(lowerPrompt, creativePatterns),
      research: this.scorePatterns(lowerPrompt, researchPatterns),
      conversation: 0.3, // Default baseline
    };

    // Adjust scores based on keywords
    if (keywords.some(k => ['code', 'function', 'class', 'debug'].includes(k))) {
      scores.code_generation += 0.3;
    }
    if (keywords.some(k => ['explain', 'analyze', 'why', 'how'].includes(k))) {
      scores.reasoning += 0.3;
    }
    if (keywords.some(k => ['math', 'calculate', 'solve'].includes(k))) {
      scores.math += 0.3;
    }

    // Find primary and secondary intents
    const sortedIntents = Object.entries(scores)
      .sort(([, a], [, b]) => b - a);

    const primary = sortedIntents[0][0] as IntentType;
    const secondary = sortedIntents[1][0] as IntentType;
    const confidence = sortedIntents[0][1] / (sortedIntents[0][1] + sortedIntents[1][1]);

    return {
      primary,
      secondary,
      confidence,
      keywords,
      patterns: [],
    };
  }

  /**
   * Analyze request complexity across multiple dimensions
   */
  private async analyzeComplexity(request: ModelRequest): Promise<ComplexityScore> {
    const lastMessage = request.messages[request.messages.length - 1];
    const prompt = lastMessage?.content || '';

    // Prompt length score (0-1)
    const promptLength = Math.min(prompt.length / 2000, 1);

    // Technical depth (count technical terms)
    const technicalTerms = [
      'algorithm', 'database', 'api', 'framework', 'architecture',
      'optimization', 'security', 'scalability', 'deployment', 'integration',
    ];
    const technicalDepth = Math.min(
      technicalTerms.filter(term => prompt.toLowerCase().includes(term)).length / 5,
      1
    );

    // Multi-step detection
    const multiStepIndicators = ['first', 'then', 'next', 'finally', 'step'];
    const multiStep = Math.min(
      multiStepIndicators.filter(ind => prompt.toLowerCase().includes(ind)).length / 3,
      1
    );

    // Context dependency
    const contextDependency = Math.min(request.messages.length / 10, 1);

    // Domain specificity
    const domainSpecificity = technicalDepth;

    // Output requirements (detect if structured output is needed)
    const outputIndicators = ['json', 'table', 'list', 'format', 'structure'];
    const outputRequirements = Math.min(
      outputIndicators.filter(ind => prompt.toLowerCase().includes(ind)).length / 3,
      1
    );

    // Calculate overall complexity
    const overall = (
      promptLength * 0.15 +
      technicalDepth * 0.25 +
      multiStep * 0.2 +
      contextDependency * 0.15 +
      domainSpecificity * 0.15 +
      outputRequirements * 0.1
    );

    return {
      promptLength,
      technicalDepth,
      multiStep,
      contextDependency,
      domainSpecificity,
      outputRequirements,
      overall,
    };
  }

  /**
   * Get candidate models based on intent and complexity
   */
  private async getCandidateModels(
    intent: Intent,
    complexity: ComplexityScore,
    request: ModelRequest
  ): Promise<ModelConfig[]> {
    let candidates = getAvailableModels();

    // Filter by user preferences
    if (request.preferences?.preferredModels?.length) {
      const preferred = candidates.filter(m =>
        request.preferences!.preferredModels!.includes(m.id)
      );
      if (preferred.length > 0) return preferred;
    }

    if (request.preferences?.avoidModels?.length) {
      candidates = candidates.filter(m =>
        !request.preferences!.avoidModels!.includes(m.id)
      );
    }

    // Filter by constraints
    if (request.constraints?.requireFunctionCalling) {
      candidates = candidates.filter(m => m.capabilities.functionCalling);
    }

    if (request.constraints?.requireStreaming) {
      candidates = candidates.filter(m => m.capabilities.streaming);
    }

    if (request.constraints?.requireVision) {
      candidates = candidates.filter(m => m.capabilities.visionCapable);
    }

    // Filter by intent capabilities
    switch (intent.primary) {
      case 'code_generation':
      case 'code_review':
      case 'debugging':
        candidates = candidates.filter(m => m.capabilities.codeGeneration);
        break;
      case 'math':
        candidates = candidates.filter(m => m.capabilities.math);
        break;
      case 'research':
        candidates = candidates.filter(m => m.capabilities.webSearch);
        if (candidates.length === 0) {
          // Fallback to high-quality general models
          candidates = getAvailableModels().filter(m =>
            m.performance.qualityScore >= 90
          );
        }
        break;
      case 'creative_writing':
        candidates = candidates.filter(m => m.capabilities.creative);
        break;
    }

    // Filter by complexity
    if (complexity.overall > 0.7) {
      // High complexity - use flagship models
      candidates = candidates.filter(m =>
        m.performance.qualityScore >= 90 || m.specializations.includes('reasoning')
      );
    } else if (complexity.overall < 0.3) {
      // Low complexity - use faster, cheaper models
      candidates = candidates.filter(m =>
        m.specializations.includes('speed') ||
        m.specializations.includes('cost efficiency') ||
        m.performance.averageLatency < 1000
      );
    }

    return candidates.length > 0 ? candidates : getAvailableModels();
  }

  /**
   * Rank models based on multiple criteria
   */
  private async rankModels(
    candidates: ModelConfig[],
    context: {
      intent: Intent;
      complexity: ComplexityScore;
      preferences?: UserPreferences;
      constraints?: RequestConstraints;
    }
  ): Promise<Array<{ model: ModelConfig; score: number }>> {
    const ranked = candidates.map(model => {
      let score = 0;

      // Quality score (0-40 points)
      score += (model.performance.qualityScore / 100) * 40;

      // Cost efficiency (0-20 points)
      if (context.preferences?.prioritizeCost) {
        score += (model.performance.costEfficiency / 100) * 30;
      } else {
        score += (model.performance.costEfficiency / 100) * 20;
      }

      // Speed (0-20 points)
      const speedScore = 1 - Math.min(model.performance.averageLatency / 5000, 1);
      if (context.preferences?.prioritizeSpeed) {
        score += speedScore * 30;
      } else {
        score += speedScore * 20;
      }

      // Intent match (0-10 points)
      const intentScore = this.scoreIntentMatch(model, context.intent);
      score += intentScore * 10;

      // Complexity match (0-10 points)
      const complexityScore = this.scoreComplexityMatch(model, context.complexity);
      score += complexityScore * 10;

      // Reliability (0-5 points)
      score += (model.performance.reliabilityScore / 100) * 5;

      // User satisfaction (0-5 points)
      score += (model.performance.userSatisfaction / 100) * 5;

      return { model, score };
    });

    return ranked.sort((a, b) => b.score - a.score);
  }

  /**
   * Final model selection with fallback logic
   */
  private finalSelection(
    rankedModels: Array<{ model: ModelConfig; score: number }>,
    request: ModelRequest
  ): ModelSelection {
    const top = rankedModels[0];
    const alternatives = rankedModels.slice(1, 4).map(r => r.model);

    // Estimate cost and latency
    const estimatedTokens = this.estimateTokens(request.messages);
    const estimatedCost = this.estimateCost(top.model, estimatedTokens);
    const estimatedLatency = top.model.performance.averageLatency;
    const estimatedQuality = top.model.performance.qualityScore;

    // Generate reasoning
    const reasoning = [
      `Selected ${top.model.name} based on:`,
      `- Quality score: ${top.model.performance.qualityScore}/100`,
      `- Cost efficiency: ${top.model.performance.costEfficiency}/100`,
      `- Average latency: ${top.model.performance.averageLatency}ms`,
      `- Specializations: ${top.model.specializations.join(', ')}`,
    ];

    return {
      model: top.model,
      confidence: top.score / 100,
      reasoning,
      alternatives,
      estimatedCost,
      estimatedLatency,
      estimatedQuality,
    };
  }

  // Helper methods

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    return words.filter(w => !stopWords.has(w) && w.length > 3).slice(0, 20);
  }

  private scorePatterns(text: string, patterns: RegExp[]): number {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(text)) score += 0.2;
    }
    return Math.min(score, 1);
  }

  private scoreIntentMatch(model: ModelConfig, intent: Intent): number {
    const specializations = model.specializations.join(' ').toLowerCase();
    const intentMap: Record<IntentType, string[]> = {
      code_generation: ['coding', 'code generation', 'programming'],
      code_review: ['code review', 'analysis'],
      debugging: ['debugging', 'code'],
      reasoning: ['reasoning', 'analysis', 'logic'],
      creative_writing: ['creative', 'writing'],
      math: ['math', 'mathematics'],
      research: ['research', 'web search'],
      analysis: ['analysis'],
      conversation: ['general purpose', 'conversation'],
      translation: ['multilingual'],
      summarization: ['summarization'],
      question_answering: ['question answering'],
    };

    const intentKeywords = intentMap[intent.primary] || [];
    let score = 0;
    for (const keyword of intentKeywords) {
      if (specializations.includes(keyword)) score += 0.3;
    }
    return Math.min(score, 1);
  }

  private scoreComplexityMatch(model: ModelConfig, complexity: ComplexityScore): number {
    if (complexity.overall > 0.7) {
      // High complexity needs high quality
      return model.performance.qualityScore / 100;
    } else if (complexity.overall < 0.3) {
      // Low complexity benefits from speed
      return 1 - Math.min(model.performance.averageLatency / 5000, 1);
    } else {
      // Medium complexity - balanced
      return (model.performance.qualityScore / 100 + model.performance.costEfficiency / 100) / 2;
    }
  }

  private estimateTokens(messages: any[]): number {
    // Rough estimation: 1 token ≈ 4 characters
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  private estimateCost(model: ModelConfig, tokens: number): number {
    const inputCost = (tokens / 1_000_000) * model.pricing.inputTokenCost;
    const outputCost = (tokens * 0.5 / 1_000_000) * model.pricing.outputTokenCost;
    return inputCost + outputCost;
  }
}

// Export singleton instance
export const smartRouter = new SmartRouter();
