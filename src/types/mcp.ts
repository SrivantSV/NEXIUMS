/**
 * MCP (Model Context Protocol) Type Definitions
 * Comprehensive type system for all MCP server integrations
 */

// ============================================================================
// Core MCP Types
// ============================================================================

export type MCPCategory =
  | 'productivity'
  | 'communication'
  | 'development'
  | 'design'
  | 'storage'
  | 'analytics'
  | 'database'
  | 'ai-ml'
  | 'business'
  | 'social'
  | 'utilities';

export type MCPAuthType = 'oauth' | 'api_key' | 'basic' | 'custom';

export type MCPCapabilityType = 'read' | 'write' | 'execute' | 'subscribe';

export interface MCPParameter {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
}

export interface MCPCapability {
  id: string;
  name: string;
  description: string;
  type: MCPCapabilityType;
  parameters: MCPParameter[];
  returnType: string;
  rateLimit?: number;
  requiresScope?: string[];
}

export interface RateLimit {
  requests: number;
  period: 'second' | 'minute' | 'hour' | 'day';
  windowMs: number;
}

export interface MCPPricing {
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  monthlyCost?: number;
  requestLimit?: number;
  features?: string[];
}

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  category: MCPCategory;
  icon: string;
  color: string;
  authType: MCPAuthType;
  scopes?: string[];
  capabilities: MCPCapability[];
  pricing?: MCPPricing;
  rateLimit?: RateLimit;
  isEnterprise?: boolean;
  webhookSupport?: boolean;
  docsUrl?: string;
}

export interface MCPConnection {
  id: string;
  userId: string;
  serverId: string;
  serverName: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  credentials: MCPCredentials;
  metadata?: Record<string, any>;
  connectedAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  refreshToken?: string;
}

export interface MCPCredentials {
  type: MCPAuthType;
  accessToken?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  customData?: Record<string, any>;
}

// ============================================================================
// MCP Server Interfaces
// ============================================================================

export interface MCPServer {
  readonly config: MCPServerConfig;
  readonly userId: string;

  validateConnection(): Promise<boolean>;
  disconnect(): Promise<void>;
  refreshCredentials?(): Promise<void>;
  handleWebhook?(payload: any): Promise<void>;
}

// GitHub
export interface GitHubMCPServer extends MCPServer {
  listRepositories(params: GitHubListReposParams): Promise<Repository[]>;
  searchCode(params: GitHubSearchCodeParams): Promise<CodeSearchResult[]>;
  createIssue(params: GitHubCreateIssueParams): Promise<Issue>;
  createPullRequest(params: GitHubCreatePRParams): Promise<PullRequest>;
  getCommits(params: GitHubGetCommitsParams): Promise<Commit[]>;
  triggerDeployment(params: GitHubDeployParams): Promise<Deployment>;
  createBranch(params: GitHubCreateBranchParams): Promise<Branch>;
  mergePullRequest(params: GitHubMergePRParams): Promise<PullRequest>;
}

export interface GitHubListReposParams {
  org?: string;
  type?: 'all' | 'owner' | 'member';
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  per_page?: number;
}

export interface GitHubSearchCodeParams {
  query: string;
  repo?: string;
  language?: string;
  filename?: string;
  extension?: string;
}

export interface GitHubCreateIssueParams {
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export interface GitHubCreatePRParams {
  repo: string;
  title: string;
  body?: string;
  head: string;
  base: string;
  draft?: boolean;
}

export interface GitHubGetCommitsParams {
  repo: string;
  branch?: string;
  since?: Date;
  until?: Date;
  author?: string;
}

export interface GitHubDeployParams {
  repo: string;
  environment: string;
  ref?: string;
  payload?: any;
}

export interface GitHubCreateBranchParams {
  repo: string;
  branchName: string;
  fromBranch?: string;
}

export interface GitHubMergePRParams {
  repo: string;
  pullNumber: number;
  commitTitle?: string;
  commitMessage?: string;
  mergeMethod?: 'merge' | 'squash' | 'rebase';
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CodeSearchResult {
  name: string;
  path: string;
  sha: string;
  url: string;
  repository: {
    name: string;
    fullName: string;
  };
  score: number;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  url: string;
  head: string;
  base: string;
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
}

export interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: Date;
  };
  url: string;
}

export interface Deployment {
  id: number;
  sha: string;
  ref: string;
  environment: string;
  createdAt: Date;
}

export interface Branch {
  name: string;
  sha: string;
  protected: boolean;
}

// Slack
export interface SlackMCPServer extends MCPServer {
  sendMessage(params: SlackSendMessageParams): Promise<SlackMessage>;
  searchMessages(params: SlackSearchParams): Promise<SlackSearchResult[]>;
  getChannelInfo(channelId: string): Promise<SlackChannel>;
  listChannels(params?: SlackListChannelsParams): Promise<SlackChannel[]>;
  uploadFile(params: SlackUploadFileParams): Promise<SlackFile>;
  addReaction(params: SlackReactionParams): Promise<void>;
}

export interface SlackSendMessageParams {
  channel: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  threadTs?: string;
}

export interface SlackSearchParams {
  query: string;
  sort?: 'score' | 'timestamp';
  sort_dir?: 'asc' | 'desc';
  count?: number;
}

export interface SlackListChannelsParams {
  types?: string;
  limit?: number;
  excludeArchived?: boolean;
}

export interface SlackUploadFileParams {
  channels: string;
  file: Buffer | string;
  filename: string;
  title?: string;
  initialComment?: string;
}

export interface SlackReactionParams {
  channel: string;
  timestamp: string;
  name: string;
}

export interface SlackMessage {
  ts: string;
  channel: string;
  text?: string;
  permalink?: string;
}

export interface SlackSearchResult {
  text: string;
  user: string;
  channel: string;
  ts: string;
  permalink: string;
  score: number;
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  topic: string;
  purpose: string;
}

export interface SlackFile {
  id: string;
  name: string;
  url: string;
  permalink: string;
}

// Notion
export interface NotionMCPServer extends MCPServer {
  searchPages(params: NotionSearchParams): Promise<NotionPage[]>;
  createPage(params: NotionCreatePageParams): Promise<NotionPage>;
  updatePage(params: NotionUpdatePageParams): Promise<NotionPage>;
  queryDatabase(params: NotionQueryDatabaseParams): Promise<NotionDatabaseResult>;
  createDatabase(params: NotionCreateDatabaseParams): Promise<NotionDatabase>;
}

export interface NotionSearchParams {
  query?: string;
  filter?: any;
  sorts?: any[];
}

export interface NotionCreatePageParams {
  parent: { database_id: string } | { page_id: string };
  properties: any;
  children?: any[];
}

export interface NotionUpdatePageParams {
  pageId: string;
  properties: any;
}

export interface NotionQueryDatabaseParams {
  databaseId: string;
  filter?: any;
  sorts?: any[];
  startCursor?: string;
  pageSize?: number;
}

export interface NotionCreateDatabaseParams {
  parent: { page_id: string };
  title: any[];
  properties: any;
}

export interface NotionPage {
  id: string;
  url: string;
  title: string;
  properties: any;
  createdTime: Date;
  lastEditedTime: Date;
}

export interface NotionDatabase {
  id: string;
  url: string;
  title: string;
  properties: any;
  createdTime: Date;
  lastEditedTime: Date;
}

export interface NotionDatabaseResult {
  results: NotionPage[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Linear
export interface LinearMCPServer extends MCPServer {
  createIssue(params: LinearCreateIssueParams): Promise<LinearIssue>;
  updateIssue(params: LinearUpdateIssueParams): Promise<LinearIssue>;
  searchIssues(params: LinearSearchParams): Promise<LinearIssue[]>;
  getTeams(): Promise<LinearTeam[]>;
  getProjects(teamId: string): Promise<LinearProject[]>;
}

export interface LinearCreateIssueParams {
  title: string;
  description?: string;
  teamId: string;
  projectId?: string;
  assigneeId?: string;
  priority?: number;
  labels?: string[];
}

export interface LinearUpdateIssueParams {
  issueId: string;
  title?: string;
  description?: string;
  status?: string;
  assigneeId?: string;
  priority?: number;
}

export interface LinearSearchParams {
  query: string;
  teamId?: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearProject {
  id: string;
  name: string;
  description: string;
}

// Additional server types (abbreviated for space)
export interface AsanaMCPServer extends MCPServer {}
export interface JiraMCPServer extends MCPServer {}
export interface TrelloMCPServer extends MCPServer {}
export interface MondayMCPServer extends MCPServer {}
export interface AirtableMCPServer extends MCPServer {}
export interface ClickUpMCPServer extends MCPServer {}
export interface TodoistMCPServer extends MCPServer {}
export interface DiscordMCPServer extends MCPServer {}
export interface TeamsMCPServer extends MCPServer {}
export interface ZoomMCPServer extends MCPServer {}
export interface GmailMCPServer extends MCPServer {}
export interface GoogleDriveMCPServer extends MCPServer {}
export interface FigmaMCPServer extends MCPServer {}
export interface AWSMCPServer extends MCPServer {}

// ============================================================================
// MCP Orchestration Types
// ============================================================================

export interface ClassifiedIntent {
  primary: string;
  secondary?: string[];
  confidence: number;
  entities: Entity[];
  keywords: string[];
  isMultiStep: boolean;
  requiredServers: string[];
  parameters: Record<string, any>;
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
}

export interface PatternMatch {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  match: string;
}

export interface IntentPattern {
  pattern: RegExp;
  intent: string;
  confidence: number;
  parameters: string[];
}

export interface ConversationContext {
  userId: string;
  conversationId: string;
  history: ConversationMessage[];
  metadata?: Record<string, any>;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface MCPResponse {
  success: boolean;
  workflowId?: string;
  results?: WorkflowStepResult[];
  data?: any;
  error?: string;
  summary?: string;
  timestamp: Date;
}

export interface MCPWorkflow {
  id: string;
  name: string;
  intent: ClassifiedIntent;
  steps: WorkflowStep[];
  createdAt: Date;
}

export interface WorkflowStep {
  id: string;
  serverId: string;
  action: string;
  parameters: Record<string, any>;
  required: boolean;
  dependsOn?: string[];
  timeout?: number;
}

export interface WorkflowStepResult {
  stepId: string;
  success: boolean;
  output?: any;
  error?: string;
  timestamp: Date;
  shouldTerminate?: boolean;
  duration?: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  intent: string;
  description?: string;
  steps: WorkflowStep[];
}

// ============================================================================
// Error Types
// ============================================================================

export class MCPError extends Error {
  constructor(
    message: string,
    public code?: string,
    public serverId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class MCPAuthError extends MCPError {
  constructor(message: string, serverId?: string) {
    super(message, 'AUTH_ERROR', serverId);
    this.name = 'MCPAuthError';
  }
}

export class MCPRateLimitError extends MCPError {
  constructor(
    message: string,
    serverId?: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', serverId);
    this.name = 'MCPRateLimitError';
  }
}

// ============================================================================
// MCP Server Registry
// ============================================================================

export interface MCPServerTypes {
  // Productivity Tools
  asana: AsanaMCPServer;
  linear: LinearMCPServer;
  jira: JiraMCPServer;
  notion: NotionMCPServer;
  trello: TrelloMCPServer;
  monday: MondayMCPServer;
  airtable: AirtableMCPServer;
  clickup: ClickUpMCPServer;
  todoist: TodoistMCPServer;

  // Communication
  slack: SlackMCPServer;
  discord: DiscordMCPServer;
  teams: TeamsMCPServer;
  zoom: ZoomMCPServer;
  gmail: GmailMCPServer;

  // Development
  github: GitHubMCPServer;
  gitlab: MCPServer;
  bitbucket: MCPServer;
  docker: MCPServer;
  vercel: MCPServer;
  netlify: MCPServer;
  aws: AWSMCPServer;

  // Design
  figma: FigmaMCPServer;
  canva: MCPServer;

  // Storage
  'google-drive': GoogleDriveMCPServer;
  dropbox: MCPServer;
  onedrive: MCPServer;
}
