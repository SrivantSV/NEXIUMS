// Shared Memory Manager for Nexus AI
// Multi-layered memory architecture with cross-model support

import {
  MemoryContext,
  MemoryContextRequest,
  MemoryUpdate,
  MemoryUpdateMetadata,
  ProjectMemoryContext,
  UserMemoryContext,
  CompanyMemoryContext,
  SemanticMemoryContext,
  ConversationMemoryContext,
  ImmediateContext,
  IdentifiedPattern,
  TimeFrame,
  PatternExample,
  SemanticMemory,
  ConsolidationResult,
} from '@/types/memory';
import { Project } from '@/types/projects';
import { VectorStore } from './vector-store';
import { MemoryLayerManager } from './memory-layers';
import { SemanticProcessor } from './semantic-processor';
import { CrossModelMemoryBridge } from './cross-model-bridge';

export class SharedMemoryManager {
  private vectorStore: VectorStore;
  private memoryLayers: MemoryLayerManager;
  private semanticProcessor: SemanticProcessor;
  private crossModelBridge: CrossModelMemoryBridge;
  private consolidationQueue: Map<string, NodeJS.Timeout>;

  constructor() {
    this.vectorStore = new VectorStore();
    this.memoryLayers = new MemoryLayerManager();
    this.semanticProcessor = new SemanticProcessor(this.vectorStore);
    this.crossModelBridge = new CrossModelMemoryBridge();
    this.consolidationQueue = new Map();
  }

  /**
   * Create a comprehensive memory context from all layers
   */
  async createMemoryContext(
    request: MemoryContextRequest
  ): Promise<MemoryContext> {
    const startTime = Date.now();

    try {
      // Run all memory layer retrievals in parallel for efficiency
      const [
        immediateContext,
        projectMemory,
        userMemory,
        companyMemory,
        semanticMemory,
        conversationMemory,
      ] = await Promise.all([
        // 1. Immediate Context (Current Chat)
        this.getImmediateContext(request.conversationId),

        // 2. Project Memory (Project-specific)
        request.projectId
          ? this.getProjectMemory(request.projectId, request.userId)
          : Promise.resolve(null),

        // 3. User Profile Memory (Global preferences)
        this.getUserMemory(request.userId),

        // 4. Company Memory (Team context)
        request.companyId
          ? this.getCompanyMemory(request.companyId, request.userId)
          : Promise.resolve(null),

        // 5. Semantic Memory (Related concepts)
        this.getSemanticMemory(
          request.query || '',
          request.userId,
          request.projectId
        ),

        // 6. Cross-conversation Memory (Historical insights)
        this.getCrossConversationMemory(
          request.userId,
          request.intent,
          request.timeFrame || 'month'
        ),
      ]);

      // Combine and calculate relevance scores
      const relevanceScores = await this.calculateRelevanceScores({
        immediate: immediateContext,
        project: projectMemory,
        user: userMemory,
        company: companyMemory,
        semantic: semanticMemory,
        conversation: conversationMemory,
      });

      const combinedRelevance = this.calculateCombinedRelevance(relevanceScores);

      const context: MemoryContext = {
        immediate: immediateContext,
        project: projectMemory,
        user: userMemory,
        company: companyMemory,
        semantic: semanticMemory,
        conversation: conversationMemory,
        relevanceScores,
        combinedRelevance,
      };

      console.log(
        `Memory context created in ${Date.now() - startTime}ms with relevance ${combinedRelevance.toFixed(2)}`
      );

      return context;
    } catch (error) {
      console.error('Error creating memory context:', error);
      throw error;
    }
  }

  /**
   * Update memory with new information
   */
  async updateMemory(
    update: MemoryUpdate,
    userId: string
  ): Promise<void> {
    const { type, content, metadata } = update;

    try {
      switch (type) {
        case 'conversation':
          await this.updateConversationMemory(content, metadata, userId);
          break;
        case 'project':
          await this.updateProjectMemory(content, metadata, userId);
          break;
        case 'user':
          await this.updateUserMemory(content, metadata, userId);
          break;
        case 'learning':
          await this.updateLearningMemory(content, metadata, userId);
          break;
      }

      // Update semantic embeddings asynchronously
      this.updateSemanticEmbeddings(update).catch(console.error);

      // Schedule memory consolidation (debounced)
      await this.scheduleMemoryConsolidation(userId);
    } catch (error) {
      console.error('Error updating memory:', error);
      throw error;
    }
  }

  /**
   * Get immediate context from current conversation
   */
  private async getImmediateContext(
    conversationId: string
  ): Promise<ImmediateContext> {
    // In a real implementation, this would fetch from database
    return this.memoryLayers.getImmediateContext(conversationId);
  }

  /**
   * Get project-specific memory context
   */
  private async getProjectMemory(
    projectId: string,
    userId: string
  ): Promise<ProjectMemoryContext> {
    const project = await this.getProject(projectId, userId);

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Calculate project relevance based on activity and context
    const relevanceScore = await this.calculateProjectRelevance(project, userId);

    const recentConversations = await this.getRecentProjectConversations(
      projectId,
      5
    );
    const recentArtifacts = await this.getRecentProjectArtifacts(projectId, 5);

    return {
      projectId,
      projectName: project.name,
      projectType: project.type,
      techStack: project.techStack,
      architecture: project.memory.architecture,
      codebaseContext: project.memory.codebase,
      requirements: project.memory.requirements,
      decisions: project.memory.decisions,
      recentConversations,
      recentArtifacts,
      keyInsights: project.memory.keyInsights,
      patterns: project.memory.patterns,
      learnings: project.memory.learnings,
      relevanceScore,
    };
  }

  /**
   * Get user profile and preferences
   */
  private async getUserMemory(userId: string): Promise<UserMemoryContext> {
    return this.memoryLayers.getUserMemory(userId);
  }

  /**
   * Get company/team shared memory
   */
  private async getCompanyMemory(
    companyId: string,
    userId: string
  ): Promise<CompanyMemoryContext | null> {
    return this.memoryLayers.getCompanyMemory(companyId, userId);
  }

  /**
   * Get semantic memory through vector search
   */
  private async getSemanticMemory(
    query: string,
    userId: string,
    projectId?: string
  ): Promise<SemanticMemoryContext> {
    return this.semanticProcessor.getSemanticContext(query, userId, projectId);
  }

  /**
   * Get cross-conversation historical memory
   */
  private async getCrossConversationMemory(
    userId: string,
    intent?: string,
    timeFrame: TimeFrame = 'month'
  ): Promise<ConversationMemoryContext> {
    return this.memoryLayers.getCrossConversationMemory(
      userId,
      intent,
      timeFrame
    );
  }

  /**
   * Identify patterns across conversations and projects
   */
  async identifyPatterns(
    userId: string,
    projectId?: string,
    timeFrame: TimeFrame = 'month'
  ): Promise<IdentifiedPattern[]> {
    const conversations = await this.getConversations(
      userId,
      projectId,
      timeFrame
    );

    const patterns: IdentifiedPattern[] = [];

    // Run pattern analysis in parallel
    const [
      usagePatterns,
      learningPatterns,
      problemPatterns,
      collabPatterns,
    ] = await Promise.all([
      this.analyzeUsagePatterns(conversations),
      this.analyzeLearningPatterns(conversations),
      this.analyzeProblemPatterns(conversations),
      projectId
        ? this.analyzeCollaborationPatterns(conversations, projectId)
        : Promise.resolve([]),
    ]);

    patterns.push(
      ...usagePatterns,
      ...learningPatterns,
      ...problemPatterns,
      ...collabPatterns
    );

    // Store patterns for future reference
    await this.storePatterns(patterns, userId, projectId);

    return patterns;
  }

  /**
   * Update conversation memory
   */
  private async updateConversationMemory(
    content: any,
    metadata: MemoryUpdateMetadata,
    userId: string
  ): Promise<void> {
    await this.memoryLayers.updateConversationMemory(content, metadata, userId);
  }

  /**
   * Update project memory
   */
  private async updateProjectMemory(
    content: any,
    metadata: MemoryUpdateMetadata,
    userId: string
  ): Promise<void> {
    if (!metadata.projectId) {
      throw new Error('Project ID required for project memory update');
    }

    await this.memoryLayers.updateProjectMemory(
      content,
      metadata,
      userId,
      metadata.projectId
    );
  }

  /**
   * Update user memory
   */
  private async updateUserMemory(
    content: any,
    metadata: MemoryUpdateMetadata,
    userId: string
  ): Promise<void> {
    await this.memoryLayers.updateUserMemory(content, metadata, userId);
  }

  /**
   * Update learning memory
   */
  private async updateLearningMemory(
    content: any,
    metadata: MemoryUpdateMetadata,
    userId: string
  ): Promise<void> {
    await this.memoryLayers.updateLearningMemory(content, metadata, userId);
  }

  /**
   * Update semantic embeddings
   */
  private async updateSemanticEmbeddings(update: MemoryUpdate): Promise<void> {
    await this.semanticProcessor.processUpdate(update);
  }

  /**
   * Schedule memory consolidation (debounced)
   */
  private async scheduleMemoryConsolidation(userId: string): Promise<void> {
    // Clear existing timeout
    if (this.consolidationQueue.has(userId)) {
      clearTimeout(this.consolidationQueue.get(userId)!);
    }

    // Schedule consolidation in 5 minutes
    const timeout = setTimeout(async () => {
      await this.consolidateMemory(userId);
      this.consolidationQueue.delete(userId);
    }, 5 * 60 * 1000);

    this.consolidationQueue.set(userId, timeout);
  }

  /**
   * Consolidate memory and extract insights
   */
  private async consolidateMemory(userId: string): Promise<ConsolidationResult> {
    console.log(`Starting memory consolidation for user ${userId}`);
    return this.memoryLayers.consolidateMemory(userId);
  }

  /**
   * Calculate relevance scores for each memory layer
   */
  private async calculateRelevanceScores(layers: {
    immediate: ImmediateContext;
    project: ProjectMemoryContext | null;
    user: UserMemoryContext;
    company: CompanyMemoryContext | null;
    semantic: SemanticMemoryContext;
    conversation: ConversationMemoryContext;
  }): Promise<Record<string, number>> {
    return {
      immediate: 1.0, // Always fully relevant
      project: layers.project?.relevanceScore || 0,
      user: 0.8, // User preferences are generally relevant
      company: layers.company ? 0.6 : 0,
      semantic: this.calculateSemanticRelevance(layers.semantic),
      conversation: this.calculateConversationRelevance(layers.conversation),
    };
  }

  /**
   * Calculate combined relevance score
   */
  private calculateCombinedRelevance(scores: Record<string, number>): number {
    const weights = {
      immediate: 0.3,
      project: 0.25,
      user: 0.15,
      company: 0.1,
      semantic: 0.15,
      conversation: 0.05,
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [layer, score] of Object.entries(scores)) {
      const weight = weights[layer as keyof typeof weights] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate semantic relevance
   */
  private calculateSemanticRelevance(semantic: SemanticMemoryContext): number {
    if (!semantic.relatedConcepts.length) return 0;

    const avgSimilarity =
      semantic.relatedConcepts.reduce((sum, c) => sum + c.similarity, 0) /
      semantic.relatedConcepts.length;

    return avgSimilarity;
  }

  /**
   * Calculate conversation relevance
   */
  private calculateConversationRelevance(
    conversation: ConversationMemoryContext
  ): number {
    const hasInsights = conversation.historicalInsights.length > 0;
    const hasPatterns = conversation.problemPatterns.length > 0;
    const hasTopics = conversation.recurringTopics.length > 0;

    return (
      (hasInsights ? 0.4 : 0) + (hasPatterns ? 0.3 : 0) + (hasTopics ? 0.3 : 0)
    );
  }

  /**
   * Helper methods for data retrieval
   */
  private async getProject(projectId: string, userId: string): Promise<Project | null> {
    // In real implementation, fetch from database
    return this.memoryLayers.getProject(projectId, userId);
  }

  private async calculateProjectRelevance(
    project: Project,
    userId: string
  ): Promise<number> {
    // Calculate relevance based on recent activity, user involvement, etc.
    const daysSinceActivity = Math.floor(
      (Date.now() - project.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    const activityScore = Math.max(0, 1 - daysSinceActivity / 30);
    const ownershipScore = project.owner === userId ? 1 : 0.7;

    return (activityScore + ownershipScore) / 2;
  }

  private async getRecentProjectConversations(
    projectId: string,
    limit: number
  ): Promise<any[]> {
    return this.memoryLayers.getRecentProjectConversations(projectId, limit);
  }

  private async getRecentProjectArtifacts(
    projectId: string,
    limit: number
  ): Promise<any[]> {
    return this.memoryLayers.getRecentProjectArtifacts(projectId, limit);
  }

  private async getConversations(
    userId: string,
    projectId?: string,
    timeFrame?: TimeFrame
  ): Promise<any[]> {
    return this.memoryLayers.getConversations(userId, projectId, timeFrame);
  }

  /**
   * Pattern analysis methods
   */
  private async analyzeUsagePatterns(conversations: any[]): Promise<IdentifiedPattern[]> {
    // Analyze usage patterns from conversation data
    const patterns: IdentifiedPattern[] = [];

    // Example: Identify frequently used features
    const featureUsage = new Map<string, number>();

    for (const conv of conversations) {
      // Extract features used (simplified)
      const features = this.extractFeatures(conv);
      for (const feature of features) {
        featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1);
      }
    }

    // Create patterns for frequently used features
    for (const [feature, count] of featureUsage.entries()) {
      if (count >= 3) {
        patterns.push({
          id: `usage-${feature}-${Date.now()}`,
          type: 'usage',
          title: `Frequent use of ${feature}`,
          description: `User frequently uses ${feature} functionality`,
          frequency: count,
          confidence: Math.min(count / 10, 1),
          examples: [],
          identifiedAt: new Date(),
          impact: count > 10 ? 'high' : count > 5 ? 'medium' : 'low',
        });
      }
    }

    return patterns;
  }

  private async analyzeLearningPatterns(conversations: any[]): Promise<IdentifiedPattern[]> {
    // Analyze learning progression patterns
    return [];
  }

  private async analyzeProblemPatterns(conversations: any[]): Promise<IdentifiedPattern[]> {
    // Analyze problem-solving patterns
    return [];
  }

  private async analyzeCollaborationPatterns(
    conversations: any[],
    projectId: string
  ): Promise<IdentifiedPattern[]> {
    // Analyze collaboration patterns in project context
    return [];
  }

  private extractFeatures(conversation: any): string[] {
    // Extract features from conversation (simplified)
    return [];
  }

  private async storePatterns(
    patterns: IdentifiedPattern[],
    userId: string,
    projectId?: string
  ): Promise<void> {
    // Store identified patterns for future reference
    await this.memoryLayers.storePatterns(patterns, userId, projectId);
  }

  /**
   * Export memory for backup or analysis
   */
  async exportMemory(userId: string, projectId?: string): Promise<any> {
    return this.memoryLayers.exportMemory(userId, projectId);
  }

  /**
   * Import memory from backup
   */
  async importMemory(userId: string, data: any): Promise<void> {
    return this.memoryLayers.importMemory(userId, data);
  }

  /**
   * Clear memory for a user or project
   */
  async clearMemory(userId: string, projectId?: string): Promise<void> {
    return this.memoryLayers.clearMemory(userId, projectId);
  }
}

// Export singleton instance
export const sharedMemoryManager = new SharedMemoryManager();
