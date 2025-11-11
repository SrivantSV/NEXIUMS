// Core Project Types for Nexus AI
// Comprehensive project management and memory system

export type ProjectType =
  | 'web-development'
  | 'mobile-app'
  | 'data-science'
  | 'machine-learning'
  | 'design-system'
  | 'api-development'
  | 'documentation'
  | 'research'
  | 'content-creation'
  | 'business-analysis'
  | 'devops'
  | 'security'
  | 'custom';

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type ProjectVisibility = 'private' | 'team' | 'public';
export type DecisionStatus = 'proposed' | 'accepted' | 'deprecated' | 'superseded';

// Tech Stack Configuration
export interface TechStackConfig {
  languages?: string[];
  frontend?: string[];
  backend?: string[];
  database?: string[];
  deployment?: string[];
  libraries?: string[];
  tools?: string[];
  frameworks?: string[];
}

// Project Goals and Milestones
export interface ProjectGoal {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  status: 'upcoming' | 'in-progress' | 'completed' | 'missed';
  goals: string[]; // goal IDs
  completionPercentage: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ProjectTimeline {
  startDate: Date;
  targetEndDate?: Date;
  actualEndDate?: Date;
  milestones: Milestone[];
  phases: ProjectPhase[];
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: 'planned' | 'active' | 'completed';
}

export interface ProjectBudget {
  allocated?: number;
  spent?: number;
  currency: string;
  breakdown: BudgetItem[];
}

export interface BudgetItem {
  category: string;
  amount: number;
  description: string;
  date: Date;
}

// Team & Collaboration
export interface ProjectCollaborator {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  lastActiveAt?: Date;
  permissions: string[];
}

export interface ProjectPermissions {
  canEdit: string[]; // user IDs
  canView: string[]; // user IDs
  canDelete: string[]; // user IDs
  canInvite: string[]; // user IDs
  isPublic: boolean;
}

// Project Notes
export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

// Memory & Context
export interface ProjectMemory {
  // Structured Memory
  architecture: ArchitectureDecision[];
  codebase: CodebaseContext;
  designSystem: DesignDecision[];
  requirements: Requirement[];
  decisions: Decision[];

  // Contextual Memory
  conversationSummaries: ConversationSummary[];
  keyInsights: KeyInsight[];
  patterns: IdentifiedPattern[];
  learnings: ProjectLearning[];

  // Semantic Memory
  concepts: ConceptEmbedding[];
  relationships: ConceptRelationship[];
  embeddings: ProjectEmbedding[];
}

export interface ArchitectureDecision {
  id: string;
  title: string;
  description: string;
  context: string;
  decision: string;
  alternatives: Alternative[];
  consequences: Consequence[];
  status: DecisionStatus;
  date: Date;
  author: string;
  tags: string[];
  relatedDecisions?: string[]; // IDs of related decisions
}

export interface Alternative {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}

export interface Consequence {
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface CodebaseContext {
  structure: FileStructure[];
  mainTechnologies: string[];
  architecturalPatterns: string[];
  conventions: CodingConvention[];
  dependencies: DependencyInfo[];
  entryPoints: string[];
}

export interface FileStructure {
  path: string;
  type: 'file' | 'directory';
  description?: string;
  importance: 'low' | 'medium' | 'high';
}

export interface CodingConvention {
  category: string;
  rule: string;
  examples: string[];
}

export interface DependencyInfo {
  name: string;
  version: string;
  purpose: string;
  type: 'production' | 'development';
}

export interface DesignDecision {
  id: string;
  title: string;
  description: string;
  rationale: string;
  alternatives: string[];
  date: Date;
  author: string;
  tags: string[];
  visualReferences?: string[]; // URLs or file paths
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  type: 'functional' | 'non-functional' | 'business' | 'technical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'proposed' | 'approved' | 'implemented' | 'rejected';
  source: string; // who requested it
  date: Date;
  acceptanceCriteria: string[];
  relatedRequirements?: string[];
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  type: 'architecture' | 'design' | 'business' | 'technical' | 'process';
  status: DecisionStatus;
  madeBy: string;
  date: Date;
  impact: 'low' | 'medium' | 'high';
  rationale: string;
}

export interface ConversationSummary {
  conversationId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: string[];
  date: Date;
  participants: string[];
}

export interface KeyInsight {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'business' | 'user' | 'process';
  source: string; // where it came from
  date: Date;
  relevance: number; // 0-1 score
  relatedInsights?: string[];
}

export interface IdentifiedPattern {
  id: string;
  type: 'usage' | 'learning' | 'problem-solving' | 'collaboration' | 'workflow';
  title: string;
  description: string;
  frequency: number;
  confidence: number; // 0-1
  examples: PatternExample[];
  identifiedAt: Date;
  impact: 'low' | 'medium' | 'high';
}

export interface PatternExample {
  description: string;
  source: string;
  date: Date;
}

export interface ProjectLearning {
  id: string;
  title: string;
  description: string;
  category: 'success' | 'challenge' | 'mistake' | 'optimization';
  date: Date;
  context: string;
  lesson: string;
  actionable: string[];
}

export interface ConceptEmbedding {
  id: string;
  concept: string;
  embedding: number[];
  context: string;
  importance: number; // 0-1
  createdAt: Date;
}

export interface ConceptRelationship {
  id: string;
  conceptA: string;
  conceptB: string;
  relationshipType: 'depends-on' | 'related-to' | 'implements' | 'extends' | 'uses';
  strength: number; // 0-1
  description?: string;
}

export interface ProjectEmbedding {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: Date;
}

// Analytics & Insights
export interface ProjectUsage {
  totalConversations: number;
  totalArtifacts: number;
  totalFiles: number;
  activeCollaborators: number;
  lastWeekActivity: ActivityMetric[];
  popularTopics: TopicMetric[];
}

export interface ActivityMetric {
  date: Date;
  conversations: number;
  artifacts: number;
  edits: number;
}

export interface TopicMetric {
  topic: string;
  count: number;
  trending: boolean;
}

export interface ProjectPerformance {
  goalsCompleted: number;
  goalsTotal: number;
  milestonesCompleted: number;
  milestonesTotal: number;
  averageResponseTime?: number;
  collaborationScore: number; // 0-100
  productivityScore: number; // 0-100
}

export interface ProjectInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'achievement' | 'optimization';
  title: string;
  description: string;
  actionable?: string[];
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dismissedAt?: Date;
}

// Integration
export interface MCPConnectionConfig {
  serverId: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  connectedAt: Date;
}

export interface ExternalRepository {
  id: string;
  provider: 'github' | 'gitlab' | 'bitbucket';
  url: string;
  branch?: string;
  syncEnabled: boolean;
  lastSyncAt?: Date;
}

export interface DeploymentConfig {
  id: string;
  name: string;
  provider: 'vercel' | 'netlify' | 'aws' | 'gcp' | 'azure' | 'custom';
  url?: string;
  status: 'active' | 'inactive' | 'error';
  lastDeployedAt?: Date;
  config: Record<string, any>;
}

// Project Template
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: ProjectType;
  techStack: TechStackConfig;
  structure: {
    folders: string[];
    initialFiles: string[];
    conversations: string[];
  };
  goals?: string[];
  defaultPermissions?: Partial<ProjectPermissions>;
  icon?: string;
  createdBy?: string;
  isPublic: boolean;
}

// Main Project Interface
export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  visibility: ProjectVisibility;

  // Core Data
  techStack: TechStackConfig;
  goals: ProjectGoal[];
  milestones: Milestone[];
  timeline: ProjectTimeline;
  budget?: ProjectBudget;

  // Team & Collaboration
  owner: string;
  collaborators: ProjectCollaborator[];
  permissions: ProjectPermissions;

  // Content Organization
  conversations: string[]; // conversation IDs
  artifacts: string[]; // artifact IDs
  files: string[]; // file IDs
  notes: ProjectNote[];
  tags: string[];

  // Memory & Context
  memory: ProjectMemory;
  contextWindow?: ProjectContext;

  // Analytics & Insights
  usage: ProjectUsage;
  performance: ProjectPerformance;
  insights: ProjectInsight[];

  // Integration
  mcpConnections: MCPConnectionConfig[];
  externalRepos: ExternalRepository[];
  deployments: DeploymentConfig[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  archivedAt?: Date;
  template?: ProjectTemplate;
}

export interface ProjectContext {
  currentFocus?: string;
  recentTopics: string[];
  activeGoals: string[];
  nextMilestone?: Milestone;
  recentActivity: ActivityMetric[];
}

// Specific project types
export interface WebDevelopmentProject extends Project {
  type: 'web-development';
  techStack: TechStackConfig & {
    frontend: string[];
    backend?: string[];
  };
}

export interface MobileAppProject extends Project {
  type: 'mobile-app';
  platforms: ('ios' | 'android' | 'cross-platform')[];
}

export interface DataScienceProject extends Project {
  type: 'data-science';
  datasets: DatasetInfo[];
  models: ModelInfo[];
}

export interface DatasetInfo {
  id: string;
  name: string;
  source: string;
  size: string;
  format: string;
  description: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  type: string;
  accuracy?: number;
  trainedAt?: Date;
  version: string;
}

export interface MachineLearningProject extends Project {
  type: 'machine-learning';
  experiments: MLExperiment[];
  models: ModelInfo[];
}

export interface MLExperiment {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
}

export interface DesignSystemProject extends Project {
  type: 'design-system';
  components: DesignComponent[];
  tokens: DesignToken[];
}

export interface DesignComponent {
  id: string;
  name: string;
  category: string;
  variants: string[];
  documentation?: string;
}

export interface DesignToken {
  name: string;
  value: string;
  category: 'color' | 'spacing' | 'typography' | 'shadow' | 'other';
}

export interface APIProject extends Project {
  type: 'api-development';
  endpoints: APIEndpoint[];
  authentication: string[];
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: APIParameter[];
  response: Record<string, any>;
}

export interface APIParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface DocumentationProject extends Project {
  type: 'documentation';
  sections: DocSection[];
  format: 'markdown' | 'mdx' | 'html' | 'other';
}

export interface DocSection {
  id: string;
  title: string;
  order: number;
  content?: string;
  subsections: DocSection[];
}

export interface ResearchProject extends Project {
  type: 'research';
  hypothesis: string;
  methodology: string;
  findings: ResearchFinding[];
  references: Reference[];
}

export interface ResearchFinding {
  id: string;
  title: string;
  description: string;
  data: any;
  date: Date;
}

export interface Reference {
  id: string;
  title: string;
  authors: string[];
  url?: string;
  date?: Date;
}

export interface ContentProject extends Project {
  type: 'content-creation';
  contentPieces: ContentPiece[];
  publishingSchedule: PublishingSchedule[];
}

export interface ContentPiece {
  id: string;
  title: string;
  type: 'article' | 'video' | 'podcast' | 'social' | 'other';
  status: 'draft' | 'review' | 'published';
  publishedAt?: Date;
}

export interface PublishingSchedule {
  contentId: string;
  scheduledFor: Date;
  platform: string;
  status: 'scheduled' | 'published' | 'failed';
}

export interface BusinessProject extends Project {
  type: 'business-analysis';
  analyses: BusinessAnalysis[];
  metrics: BusinessMetric[];
}

export interface BusinessAnalysis {
  id: string;
  title: string;
  type: 'swot' | 'market' | 'competitor' | 'financial' | 'other';
  findings: string[];
  date: Date;
}

export interface BusinessMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  date: Date;
}

export interface DevOpsProject extends Project {
  type: 'devops';
  pipelines: Pipeline[];
  infrastructure: Infrastructure[];
}

export interface Pipeline {
  id: string;
  name: string;
  stages: string[];
  lastRun?: Date;
  status: 'success' | 'failed' | 'running';
}

export interface Infrastructure {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: 'active' | 'inactive';
}

export interface SecurityProject extends Project {
  type: 'security';
  vulnerabilities: Vulnerability[];
  audits: SecurityAudit[];
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  discoveredAt: Date;
  resolvedAt?: Date;
}

export interface SecurityAudit {
  id: string;
  type: string;
  findings: string[];
  date: Date;
  auditor: string;
}

export interface CustomProject extends Project {
  type: 'custom';
  customFields: Record<string, any>;
}

// Union type for all project types
export type ProjectTypes = {
  'web-development': WebDevelopmentProject;
  'mobile-app': MobileAppProject;
  'data-science': DataScienceProject;
  'machine-learning': MachineLearningProject;
  'design-system': DesignSystemProject;
  'api-development': APIProject;
  'documentation': DocumentationProject;
  'research': ResearchProject;
  'content-creation': ContentProject;
  'business-analysis': BusinessProject;
  'devops': DevOpsProject;
  'security': SecurityProject;
  'custom': CustomProject;
};
