// Memory System Types for Nexus AI
// Multi-layered shared memory architecture

export type MemoryLayerType =
  | 'immediate' // Current conversation
  | 'project' // Project-specific
  | 'user' // Global user preferences
  | 'company' // Team context
  | 'semantic' // Related concepts
  | 'conversation'; // Cross-conversation historical

export type MemoryUpdateType = 'conversation' | 'project' | 'user' | 'learning';

export interface MemoryContextRequest {
  userId: string;
  conversationId: string;
  projectId?: string;
  companyId?: string;
  query?: string;
  intent?: string;
  timeFrame?: TimeFrame;
}

export type TimeFrame = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface MemoryContext {
  immediate: ImmediateContext;
  project: ProjectMemoryContext | null;
  user: UserMemoryContext;
  company: CompanyMemoryContext | null;
  semantic: SemanticMemoryContext;
  conversation: ConversationMemoryContext;
  relevanceScores: Record<MemoryLayerType, number>;
  combinedRelevance: number;
}

// Immediate Context (Current Chat)
export interface ImmediateContext {
  conversationId: string;
  messages: Message[];
  currentTopic?: string;
  userIntent?: string;
  recentContext: string;
  artifacts: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Project Memory Context
export interface ProjectMemoryContext {
  projectId: string;
  projectName: string;
  projectType: string;

  // Architecture & Tech Stack
  techStack: any;
  architecture: any[];
  codebaseContext: any;

  // Requirements & Decisions
  requirements: any[];
  decisions: any[];

  // Recent Activity
  recentConversations: ConversationSummary[];
  recentArtifacts: ArtifactSummary[];

  // Key Insights
  keyInsights: any[];
  patterns: any[];
  learnings: any[];

  // Context Relevance
  relevanceScore: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  date: Date;
  keyTopics: string[];
}

export interface ArtifactSummary {
  id: string;
  title: string;
  type: string;
  date: Date;
  description?: string;
}

// User Memory Context
export interface UserMemoryContext {
  userId: string;
  preferences: UserPreferences;
  learningStyle?: LearningStyle;
  expertiseAreas: ExpertiseArea[];
  commonPatterns: UserPattern[];
  recentInterests: Interest[];
  communicationStyle?: CommunicationStyle;
}

export interface UserPreferences {
  language: string;
  codeStyle?: CodeStylePreference;
  explanationDepth: 'brief' | 'moderate' | 'detailed';
  preferredModels: string[];
  theme?: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
}

export interface CodeStylePreference {
  language: string;
  style: string;
  conventions: string[];
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
}

export interface LearningStyle {
  type: 'visual' | 'verbal' | 'hands-on' | 'mixed';
  preferredFormats: ('text' | 'diagrams' | 'code' | 'examples')[];
}

export interface ExpertiseArea {
  domain: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  topics: string[];
  lastUpdated: Date;
}

export interface UserPattern {
  type: string;
  description: string;
  frequency: number;
  lastOccurred: Date;
}

export interface Interest {
  topic: string;
  strength: number; // 0-1
  firstSeen: Date;
  lastSeen: Date;
  relatedTopics: string[];
}

export interface CommunicationStyle {
  formality: 'casual' | 'professional' | 'technical';
  verbosity: 'concise' | 'balanced' | 'detailed';
  preferredTone: string[];
}

// Company Memory Context
export interface CompanyMemoryContext {
  companyId: string;
  companyName: string;
  sharedKnowledge: SharedKnowledge[];
  teamPatterns: TeamPattern[];
  commonPractices: Practice[];
  sharedResources: Resource[];
  collaborationInsights: CollaborationInsight[];
}

export interface SharedKnowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  createdBy: string;
  createdAt: Date;
  accessCount: number;
  relevance: number;
}

export interface TeamPattern {
  id: string;
  type: string;
  description: string;
  participants: string[];
  frequency: number;
  impact: 'low' | 'medium' | 'high';
}

export interface Practice {
  id: string;
  name: string;
  description: string;
  category: string;
  adoptionRate: number;
  effectiveness: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'document' | 'code' | 'template' | 'guide';
  url?: string;
  content?: string;
  tags: string[];
  sharedBy: string;
  sharedAt: Date;
}

export interface CollaborationInsight {
  id: string;
  type: string;
  description: string;
  participants: string[];
  date: Date;
  impact: string;
}

// Semantic Memory Context
export interface SemanticMemoryContext {
  relatedConcepts: ConceptMatch[];
  similarConversations: ConversationMatch[];
  relatedProjects: ProjectMatch[];
  knowledgeGraph: KnowledgeGraphNode[];
  suggestedConnections: Connection[];
}

export interface ConceptMatch {
  concept: string;
  similarity: number;
  context: string;
  source: string;
  timestamp: Date;
}

export interface ConversationMatch {
  conversationId: string;
  title: string;
  similarity: number;
  relevantExcerpt: string;
  date: Date;
}

export interface ProjectMatch {
  projectId: string;
  projectName: string;
  similarity: number;
  relevantContext: string;
  date: Date;
}

export interface KnowledgeGraphNode {
  id: string;
  type: 'concept' | 'project' | 'conversation' | 'user' | 'resource';
  label: string;
  connections: string[]; // IDs of connected nodes
  properties: Record<string, any>;
}

export interface Connection {
  fromId: string;
  toId: string;
  type: string;
  strength: number;
  reasoning: string;
}

// Cross-conversation Memory Context
export interface ConversationMemoryContext {
  historicalInsights: HistoricalInsight[];
  recurringTopics: RecurringTopic[];
  learningTrajectory: LearningProgress[];
  problemPatterns: ProblemPattern[];
  solutionPatterns: SolutionPattern[];
}

export interface HistoricalInsight {
  id: string;
  title: string;
  description: string;
  source: string;
  confidence: number;
  firstSeen: Date;
  lastReinforced: Date;
  reinforcementCount: number;
}

export interface RecurringTopic {
  topic: string;
  frequency: number;
  contexts: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
  lastDiscussed: Date;
}

export interface LearningProgress {
  domain: string;
  startLevel: string;
  currentLevel: string;
  progression: ProgressionPoint[];
  achievements: Achievement[];
}

export interface ProgressionPoint {
  date: Date;
  level: string;
  evidence: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: Date;
  category: string;
}

export interface ProblemPattern {
  id: string;
  problemType: string;
  description: string;
  occurrences: number;
  lastOccurred: Date;
  commonContext: string[];
  resolutionRate: number;
}

export interface SolutionPattern {
  id: string;
  problemType: string;
  solution: string;
  successRate: number;
  timesUsed: number;
  lastUsed: Date;
  context: string;
}

// Memory Update
export interface MemoryUpdate {
  type: MemoryUpdateType;
  content: any;
  metadata: MemoryUpdateMetadata;
}

export interface MemoryUpdateMetadata {
  userId: string;
  conversationId?: string;
  projectId?: string;
  timestamp: Date;
  importance: number; // 0-1
  tags?: string[];
  category?: string;
}

// Semantic Memory
export interface SemanticMemory {
  concepts: ConceptExtraction[];
  relationships: ConceptRelationship[];
  embeddings: Embedding[];
  insights: ExtractedInsight[];
  timestamp: Date;
}

export interface ConceptExtraction {
  id: string;
  concept: string;
  type: 'technical' | 'business' | 'problem' | 'solution' | 'decision';
  context: string;
  importance: number;
  confidence: number;
  relatedConcepts: string[];
}

export interface ConceptRelationship {
  id: string;
  conceptA: string;
  conceptB: string;
  relationshipType: 'depends-on' | 'related-to' | 'implements' | 'extends' | 'uses' | 'solves';
  strength: number;
  description?: string;
  bidirectional: boolean;
}

export interface Embedding {
  id: string;
  content: string;
  vector: number[];
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface ExtractedInsight {
  id: string;
  title: string;
  description: string;
  type: string;
  confidence: number;
  evidence: string[];
  actionable: boolean;
}

// Semantic Search
export interface SemanticSearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  projectIds?: string[];
  conversationIds?: string[];
  types?: string[];
  minRelevance?: number;
  maxResults?: number;
}

export interface SemanticSearchResult {
  id: string;
  content: string;
  type: 'conversation' | 'project' | 'concept' | 'insight';
  relevance: number;
  context: string;
  metadata: Record<string, any>;
  highlights: string[];
}

// Cross-model Memory
export interface AdaptedMemoryContext {
  originalModel: string;
  targetModel: string;
  context: any;
  adaptations: MemoryAdaptation[];
  confidence: number;
  timestamp: Date;
}

export interface MemoryAdaptation {
  field: string;
  originalValue: any;
  adaptedValue: any;
  reasoning: string;
}

export interface CrossModelMapping {
  sourceModel: string;
  targetModel: string;
  originalContext: MemoryContext;
  adaptedContext: AdaptedMemoryContext;
  userId: string;
  timestamp: Date;
}

// Vector Store
export interface VectorSearchRequest {
  vector: number[];
  topK: number;
  filter?: VectorFilter;
}

export interface VectorFilter {
  userId?: string;
  projectId?: string;
  conversationId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, any>;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
}

// Concept Graph
export interface ConceptGraphSearchRequest {
  query: string;
  userId: string;
  projectId?: string;
  maxHops: number;
  minRelevance?: number;
}

export interface ConceptGraphSearchResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  relevance: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
  weight: number;
}

// Memory Consolidation
export interface MemoryConsolidationTask {
  userId: string;
  projectId?: string;
  timeRange: TimeFrame;
  priority: 'low' | 'medium' | 'high';
  scheduledFor: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ConsolidationResult {
  taskId: string;
  newInsights: ExtractedInsight[];
  newPatterns: any[];
  updatedConcepts: ConceptExtraction[];
  consolidatedAt: Date;
}

// Model Memory Adapters
export interface ModelMemoryAdapter {
  modelId: string;
  extractMemory(context: MemoryContext): Promise<ExtractedMemory>;
  adaptMemory(memory: ExtractedMemory): Promise<AdaptedMemoryContext>;
  formatContext(context: MemoryContext): Promise<string>;
}

export interface ExtractedMemory {
  facts: Fact[];
  preferences: Record<string, any>;
  context: string;
  metadata: Record<string, any>;
}

export interface Fact {
  statement: string;
  confidence: number;
  source: string;
  timestamp: Date;
}

// Memory Store
export interface MemoryStore {
  save(memory: any, metadata: MemoryUpdateMetadata): Promise<string>;
  retrieve(id: string): Promise<any>;
  search(query: string, filters?: any): Promise<any[]>;
  delete(id: string): Promise<boolean>;
  update(id: string, memory: any): Promise<boolean>;
}

// Pattern Analysis
export interface UsagePattern {
  id: string;
  type: 'frequency' | 'timing' | 'sequence' | 'preference';
  description: string;
  data: Record<string, any>;
  confidence: number;
}

export interface LearningPattern {
  id: string;
  domain: string;
  progression: string;
  milestones: string[];
  currentStage: string;
  nextSuggestions: string[];
}

export interface ProblemSolvingPattern {
  id: string;
  problemCategory: string;
  approach: string;
  successRate: number;
  commonSteps: string[];
  variations: string[];
}

export interface CollaborationPattern {
  id: string;
  participants: string[];
  interactionType: string;
  frequency: number;
  effectiveness: number;
  insights: string[];
}
