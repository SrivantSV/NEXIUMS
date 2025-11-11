// Cross-Model Memory Bridge
// Enables memory sharing across different AI models (Claude, GPT, Gemini, etc.)

import {
  MemoryContext,
  AdaptedMemoryContext,
  CrossModelMapping,
  ModelMemoryAdapter,
  ExtractedMemory,
  Fact,
} from '@/types/memory';

export class CrossModelMemoryBridge {
  private memoryStore: Map<string, CrossModelMapping>;
  private modelAdapters: Map<string, ModelMemoryAdapter>;

  constructor() {
    this.memoryStore = new Map();
    this.modelAdapters = new Map();
    this.initializeAdapters();
  }

  /**
   * Initialize model-specific adapters
   */
  private initializeAdapters(): void {
    this.modelAdapters.set('claude', new ClaudeMemoryAdapter());
    this.modelAdapters.set('gpt', new OpenAIMemoryAdapter());
    this.modelAdapters.set('gemini', new GeminiMemoryAdapter());
    this.modelAdapters.set('generic', new GenericMemoryAdapter());
  }

  /**
   * Share memory across different AI models
   */
  async shareMemoryAcrossModels(
    sourceModel: string,
    targetModel: string,
    memoryContext: MemoryContext,
    userId: string
  ): Promise<AdaptedMemoryContext> {
    // Get model-specific adapters
    const sourceAdapter = this.getModelAdapter(sourceModel);
    const targetAdapter = this.getModelAdapter(targetModel);

    // Extract memory from source model format
    const extractedMemory = await sourceAdapter.extractMemory(memoryContext);

    // Transform memory for target model
    const adaptedMemory = await targetAdapter.adaptMemory(extractedMemory);

    // Store cross-model memory mapping
    await this.storeCrossModelMapping({
      sourceModel,
      targetModel,
      originalContext: memoryContext,
      adaptedContext: adaptedMemory,
      userId,
      timestamp: new Date(),
    });

    return adaptedMemory;
  }

  /**
   * Get model adapter
   */
  private getModelAdapter(modelId: string): ModelMemoryAdapter {
    // Determine adapter based on model ID prefix
    if (modelId.startsWith('claude')) {
      return this.modelAdapters.get('claude')!;
    } else if (modelId.startsWith('gpt')) {
      return this.modelAdapters.get('gpt')!;
    } else if (modelId.startsWith('gemini')) {
      return this.modelAdapters.get('gemini')!;
    } else {
      return this.modelAdapters.get('generic')!;
    }
  }

  /**
   * Store cross-model mapping
   */
  private async storeCrossModelMapping(mapping: CrossModelMapping): Promise<void> {
    const key = `${mapping.userId}-${mapping.sourceModel}-${mapping.targetModel}`;
    this.memoryStore.set(key, mapping);
  }

  /**
   * Get cross-model mapping
   */
  async getCrossModelMapping(
    userId: string,
    sourceModel: string,
    targetModel: string
  ): Promise<CrossModelMapping | null> {
    const key = `${userId}-${sourceModel}-${targetModel}`;
    return this.memoryStore.get(key) || null;
  }

  /**
   * Format context for specific model
   */
  async formatContextForModel(
    modelId: string,
    context: MemoryContext
  ): Promise<string> {
    const adapter = this.getModelAdapter(modelId);
    return adapter.formatContext(context);
  }
}

/**
 * Claude Memory Adapter
 * Optimized for Anthropic's Claude models
 */
class ClaudeMemoryAdapter implements ModelMemoryAdapter {
  modelId = 'claude';

  async extractMemory(context: MemoryContext): Promise<ExtractedMemory> {
    const facts: Fact[] = [];

    // Extract facts from immediate context
    if (context.immediate.currentTopic) {
      facts.push({
        statement: `Current topic: ${context.immediate.currentTopic}`,
        confidence: 1.0,
        source: 'immediate',
        timestamp: new Date(),
      });
    }

    // Extract from project context
    if (context.project) {
      facts.push({
        statement: `Working on project: ${context.project.projectName}`,
        confidence: 1.0,
        source: 'project',
        timestamp: new Date(),
      });

      for (const decision of context.project.decisions) {
        facts.push({
          statement: `Decision: ${decision.title}`,
          confidence: 0.9,
          source: 'project',
          timestamp: new Date(),
        });
      }
    }

    // Extract user preferences
    const preferences: Record<string, any> = {
      explanationDepth: context.user.preferences.explanationDepth,
      communicationStyle: context.user.communicationStyle,
    };

    return {
      facts,
      preferences,
      context: this.buildContextString(context),
      metadata: {
        extractedAt: new Date(),
        modelId: this.modelId,
      },
    };
  }

  async adaptMemory(memory: ExtractedMemory): Promise<AdaptedMemoryContext> {
    // Claude works well with structured context
    const adaptations = [];

    return {
      originalModel: 'unknown',
      targetModel: this.modelId,
      context: {
        facts: memory.facts,
        preferences: memory.preferences,
        structuredContext: memory.context,
      },
      adaptations,
      confidence: 0.95,
      timestamp: new Date(),
    };
  }

  async formatContext(context: MemoryContext): Promise<string> {
    let formatted = '';

    // Add immediate context
    if (context.immediate.currentTopic) {
      formatted += `Current Topic: ${context.immediate.currentTopic}\n\n`;
    }

    // Add project context
    if (context.project) {
      formatted += `## Project Context\n`;
      formatted += `Project: ${context.project.projectName}\n`;
      formatted += `Type: ${context.project.projectType}\n\n`;

      if (context.project.keyInsights.length > 0) {
        formatted += `Key Insights:\n`;
        for (const insight of context.project.keyInsights) {
          formatted += `- ${insight.title}: ${insight.description}\n`;
        }
        formatted += '\n';
      }
    }

    // Add user preferences
    formatted += `## User Preferences\n`;
    formatted += `Explanation Depth: ${context.user.preferences.explanationDepth}\n`;
    formatted += `Communication Style: ${context.user.communicationStyle?.formality}\n\n`;

    return formatted;
  }

  private buildContextString(context: MemoryContext): string {
    return this.formatContext(context).then(str => str).catch(() => '');
  }
}

/**
 * OpenAI Memory Adapter
 * Optimized for OpenAI's GPT models
 */
class OpenAIMemoryAdapter implements ModelMemoryAdapter {
  modelId = 'gpt';

  async extractMemory(context: MemoryContext): Promise<ExtractedMemory> {
    const facts: Fact[] = [];

    // GPT models prefer conversational context
    if (context.immediate.messages.length > 0) {
      facts.push({
        statement: `Recent conversation with ${context.immediate.messages.length} messages`,
        confidence: 1.0,
        source: 'immediate',
        timestamp: new Date(),
      });
    }

    return {
      facts,
      preferences: context.user.preferences,
      context: JSON.stringify(context.immediate),
      metadata: {
        extractedAt: new Date(),
        modelId: this.modelId,
      },
    };
  }

  async adaptMemory(memory: ExtractedMemory): Promise<AdaptedMemoryContext> {
    // GPT works well with JSON-structured data
    return {
      originalModel: 'unknown',
      targetModel: this.modelId,
      context: {
        conversationalContext: memory.context,
        preferences: memory.preferences,
        facts: memory.facts.map(f => f.statement),
      },
      adaptations: [],
      confidence: 0.9,
      timestamp: new Date(),
    };
  }

  async formatContext(context: MemoryContext): Promise<string> {
    // GPT prefers JSON format
    return JSON.stringify({
      currentTopic: context.immediate.currentTopic,
      project: context.project ? {
        name: context.project.projectName,
        type: context.project.projectType,
      } : null,
      userPreferences: context.user.preferences,
      recentMessages: context.immediate.messages.slice(-5),
    }, null, 2);
  }
}

/**
 * Gemini Memory Adapter
 * Optimized for Google's Gemini models
 */
class GeminiMemoryAdapter implements ModelMemoryAdapter {
  modelId = 'gemini';

  async extractMemory(context: MemoryContext): Promise<ExtractedMemory> {
    const facts: Fact[] = [];

    // Gemini handles multimodal context well
    if (context.semantic.relatedConcepts.length > 0) {
      facts.push({
        statement: `Found ${context.semantic.relatedConcepts.length} related concepts`,
        confidence: 0.9,
        source: 'semantic',
        timestamp: new Date(),
      });
    }

    return {
      facts,
      preferences: context.user.preferences,
      context: this.buildSemanticContext(context),
      metadata: {
        extractedAt: new Date(),
        modelId: this.modelId,
      },
    };
  }

  async adaptMemory(memory: ExtractedMemory): Promise<AdaptedMemoryContext> {
    return {
      originalModel: 'unknown',
      targetModel: this.modelId,
      context: {
        semanticContext: memory.context,
        preferences: memory.preferences,
        keyFacts: memory.facts,
      },
      adaptations: [],
      confidence: 0.85,
      timestamp: new Date(),
    };
  }

  async formatContext(context: MemoryContext): Promise<string> {
    let formatted = 'Context Summary:\n\n';

    // Add semantic context
    if (context.semantic.relatedConcepts.length > 0) {
      formatted += 'Related Concepts:\n';
      for (const concept of context.semantic.relatedConcepts.slice(0, 5)) {
        formatted += `- ${concept.concept} (similarity: ${concept.similarity.toFixed(2)})\n`;
      }
      formatted += '\n';
    }

    // Add knowledge graph
    if (context.semantic.knowledgeGraph.length > 0) {
      formatted += 'Knowledge Graph:\n';
      for (const node of context.semantic.knowledgeGraph.slice(0, 5)) {
        formatted += `- ${node.label} (${node.type})\n`;
      }
    }

    return formatted;
  }

  private buildSemanticContext(context: MemoryContext): string {
    return JSON.stringify({
      concepts: context.semantic.relatedConcepts,
      connections: context.semantic.suggestedConnections,
    });
  }
}

/**
 * Generic Memory Adapter
 * Fallback for unknown or custom models
 */
class GenericMemoryAdapter implements ModelMemoryAdapter {
  modelId = 'generic';

  async extractMemory(context: MemoryContext): Promise<ExtractedMemory> {
    const facts: Fact[] = [];

    // Extract basic facts
    facts.push({
      statement: 'Generic memory extraction',
      confidence: 0.7,
      source: 'generic',
      timestamp: new Date(),
    });

    return {
      facts,
      preferences: context.user.preferences,
      context: JSON.stringify(context),
      metadata: {
        extractedAt: new Date(),
        modelId: this.modelId,
      },
    };
  }

  async adaptMemory(memory: ExtractedMemory): Promise<AdaptedMemoryContext> {
    return {
      originalModel: 'unknown',
      targetModel: this.modelId,
      context: memory,
      adaptations: [],
      confidence: 0.5,
      timestamp: new Date(),
    };
  }

  async formatContext(context: MemoryContext): Promise<string> {
    // Generic plain text format
    return `Context: ${JSON.stringify(context, null, 2)}`;
  }
}
