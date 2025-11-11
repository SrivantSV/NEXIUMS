/**
 * Intent Classifier
 * Analyzes user requests to determine which MCP servers to use
 */

import {
  ClassifiedIntent,
  ConversationContext,
  Entity,
  PatternMatch,
  IntentPattern,
} from '@/types/mcp';

export class IntentClassifier {
  private patterns: IntentPattern[];

  constructor() {
    this.patterns = this.initializePatterns();
  }

  /**
   * Analyze user request and classify intent
   */
  async analyze(
    request: string,
    context: ConversationContext
  ): Promise<ClassifiedIntent> {
    const normalizedRequest = request.toLowerCase();

    // 1. Extract keywords and entities
    const keywords = await this.extractKeywords(normalizedRequest);
    const entities = await this.extractEntities(normalizedRequest);

    // 2. Pattern matching for common requests
    const patterns = await this.matchPatterns(normalizedRequest);

    // 3. Context analysis
    const contextualClues = await this.analyzeContext(context);

    // 4. Combine all signals
    const intent = this.combineClassificationSignals({
      keywords,
      entities,
      patterns,
      contextualClues,
      request: normalizedRequest,
    });

    return intent;
  }

  /**
   * Extract keywords from request
   */
  private async extractKeywords(request: string): Promise<string[]> {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'please', 'can', 'you', 'i', 'me', 'my', 'we', 'us', 'our'
    ]);

    const words = request
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    return [...new Set(words)];
  }

  /**
   * Extract entities (services, actions, etc.)
   */
  private async extractEntities(request: string): Promise<Entity[]> {
    const entities: Entity[] = [];

    // Service entities
    const services = {
      github: ['github', 'git', 'repository', 'repo', 'pr', 'pull request', 'issue'],
      slack: ['slack', 'message', 'channel', 'dm', 'direct message'],
      notion: ['notion', 'page', 'database', 'workspace'],
      linear: ['linear', 'ticket', 'task'],
      gmail: ['email', 'gmail', 'mail', 'inbox'],
      'google-drive': ['drive', 'google drive', 'document', 'doc', 'sheet', 'spreadsheet'],
      figma: ['figma', 'design', 'prototype', 'frame'],
      jira: ['jira', 'story', 'epic', 'sprint'],
      vercel: ['vercel', 'deploy', 'deployment', 'production'],
    };

    for (const [service, keywords] of Object.entries(services)) {
      for (const keyword of keywords) {
        if (request.includes(keyword)) {
          entities.push({
            type: 'service',
            value: service,
            confidence: 0.8,
          });
          break;
        }
      }
    }

    // Action entities
    const actions = {
      search: ['search', 'find', 'look for', 'query'],
      create: ['create', 'make', 'new', 'add'],
      update: ['update', 'edit', 'modify', 'change'],
      delete: ['delete', 'remove', 'drop'],
      send: ['send', 'post', 'publish', 'share'],
      list: ['list', 'show', 'get', 'fetch'],
      deploy: ['deploy', 'push', 'release'],
    };

    for (const [action, keywords] of Object.entries(actions)) {
      for (const keyword of keywords) {
        if (request.includes(keyword)) {
          entities.push({
            type: 'action',
            value: action,
            confidence: 0.7,
          });
          break;
        }
      }
    }

    return entities;
  }

  /**
   * Match request against known patterns
   */
  private async matchPatterns(request: string): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];

    for (const pattern of this.patterns) {
      const match = request.match(pattern.pattern);
      if (match) {
        matches.push({
          intent: pattern.intent,
          confidence: pattern.confidence,
          parameters: this.extractParameters(request, pattern.parameters),
          match: match[0],
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze conversation context
   */
  private async analyzeContext(context: ConversationContext): Promise<string[]> {
    const clues: string[] = [];

    // Check recent messages for context
    const recentMessages = context.history.slice(-5);

    for (const message of recentMessages) {
      if (message.content.includes('github')) clues.push('github-context');
      if (message.content.includes('slack')) clues.push('slack-context');
      if (message.content.includes('deploy')) clues.push('deployment-context');
    }

    return clues;
  }

  /**
   * Combine all classification signals
   */
  private combineClassificationSignals(signals: {
    keywords: string[];
    entities: Entity[];
    patterns: PatternMatch[];
    contextualClues: string[];
    request: string;
  }): ClassifiedIntent {
    const { keywords, entities, patterns, request } = signals;

    // Get primary intent from best pattern match
    let primaryIntent = 'general-query';
    let confidence = 0.5;
    let requiredServers: string[] = [];
    let parameters: Record<string, any> = {};

    if (patterns.length > 0) {
      primaryIntent = patterns[0].intent;
      confidence = patterns[0].confidence;
      parameters = patterns[0].parameters;
    }

    // Determine required servers from entities
    const serviceEntities = entities.filter(e => e.type === 'service');
    requiredServers = serviceEntities.map(e => e.value);

    // Check if multi-step workflow
    const isMultiStep = this.isMultiStepIntent(primaryIntent, request);

    return {
      primary: primaryIntent,
      secondary: patterns.slice(1, 3).map(p => p.intent),
      confidence,
      entities,
      keywords,
      isMultiStep,
      requiredServers: requiredServers.length > 0 ? requiredServers : this.getDefaultServers(primaryIntent),
      parameters,
    };
  }

  /**
   * Extract parameters from request
   */
  private extractParameters(request: string, paramNames: string[]): Record<string, any> {
    const params: Record<string, any> = {};

    // Extract quoted strings
    const quotedStrings = request.match(/"([^"]*)"/g) || request.match(/'([^']*)'/g);
    if (quotedStrings && quotedStrings.length > 0) {
      params.query = quotedStrings[0].replace(/["']/g, '');
    }

    // Extract common patterns
    const repoMatch = request.match(/(?:repo|repository)[:=\s]+([a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_]+)/);
    if (repoMatch) params.repo = repoMatch[1];

    const channelMatch = request.match(/(?:channel|to)[:=\s]+#?([a-zA-Z0-9\-_]+)/);
    if (channelMatch) params.channel = channelMatch[1];

    return params;
  }

  /**
   * Determine if intent requires multi-step workflow
   */
  private isMultiStepIntent(intent: string, request: string): boolean {
    const multiStepKeywords = [
      'then', 'and then', 'after that', 'also', 'notify', 'update',
      'both', 'all', 'multiple'
    ];

    return multiStepKeywords.some(keyword => request.includes(keyword)) ||
           intent.includes('and') ||
           intent.includes('workflow');
  }

  /**
   * Get default servers for an intent
   */
  private getDefaultServers(intent: string): string[] {
    const mapping: Record<string, string[]> = {
      'github-search': ['github'],
      'github-create-issue': ['github'],
      'github-create-pr': ['github'],
      'slack-send-message': ['slack'],
      'slack-search': ['slack'],
      'notion-search': ['notion'],
      'notion-create': ['notion'],
      'linear-create-issue': ['linear'],
      'deploy-and-notify': ['vercel', 'slack'],
      'start-new-feature': ['linear', 'github', 'slack'],
    };

    return mapping[intent] || [];
  }

  /**
   * Initialize intent patterns
   */
  private initializePatterns(): IntentPattern[] {
    return [
      // GitHub patterns
      {
        pattern: /(?:search|find|look for).+(?:code|repository|repo|github)/i,
        intent: 'github-search',
        confidence: 0.8,
        parameters: ['query'],
      },
      {
        pattern: /(?:create|make|open).+(?:issue|ticket|bug)/i,
        intent: 'github-create-issue',
        confidence: 0.9,
        parameters: ['title', 'description', 'repo'],
      },
      {
        pattern: /(?:create|make|open).+(?:pr|pull request)/i,
        intent: 'github-create-pr',
        confidence: 0.9,
        parameters: ['title', 'branch', 'repo'],
      },
      {
        pattern: /(?:list|show|get).+(?:repos|repositories)/i,
        intent: 'github-list-repos',
        confidence: 0.85,
        parameters: [],
      },

      // Slack patterns
      {
        pattern: /(?:send|post|message).+(?:slack|channel)/i,
        intent: 'slack-send-message',
        confidence: 0.85,
        parameters: ['channel', 'message'],
      },
      {
        pattern: /(?:search|find).+(?:slack|messages?)/i,
        intent: 'slack-search',
        confidence: 0.8,
        parameters: ['query'],
      },

      // Notion patterns
      {
        pattern: /(?:search|find).+(?:notion|pages?)/i,
        intent: 'notion-search',
        confidence: 0.8,
        parameters: ['query'],
      },
      {
        pattern: /(?:create|make).+(?:notion|page|document)/i,
        intent: 'notion-create',
        confidence: 0.85,
        parameters: ['title', 'content'],
      },

      // Linear patterns
      {
        pattern: /(?:create|make|open).+(?:linear|issue|task)/i,
        intent: 'linear-create-issue',
        confidence: 0.85,
        parameters: ['title', 'description', 'team'],
      },

      // Google Drive patterns
      {
        pattern: /(?:search|find).+(?:drive|google drive|document|doc)/i,
        intent: 'gdrive-search',
        confidence: 0.8,
        parameters: ['query'],
      },

      // Multi-tool workflows
      {
        pattern: /(?:deploy|push).+(?:notify|tell|inform|message)/i,
        intent: 'deploy-and-notify',
        confidence: 0.75,
        parameters: ['service', 'channel'],
      },
      {
        pattern: /(?:start|begin|create).+(?:feature|task).+(?:branch|issue)/i,
        intent: 'start-new-feature',
        confidence: 0.75,
        parameters: ['title', 'team'],
      },

      // General patterns
      {
        pattern: /(?:what|show|tell|get).+(?:is|are|about)/i,
        intent: 'general-query',
        confidence: 0.5,
        parameters: ['query'],
      },
    ];
  }
}
