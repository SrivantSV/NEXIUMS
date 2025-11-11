/**
 * Unified Content Types for Nexus AI
 * Integrates Artifacts, Files, and MCP systems
 */

// ============================================================================
// ARTIFACT TYPES
// ============================================================================

export enum ArtifactType {
  // CODE ARTIFACTS (Executable)
  REACT_COMPONENT = 'react-component',
  VUE_COMPONENT = 'vue-component',
  SVELTE_COMPONENT = 'svelte-component',
  ANGULAR_COMPONENT = 'angular-component',
  HTML_PAGE = 'html-page',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON_SCRIPT = 'python-script',
  NODE_SCRIPT = 'node-script',
  SHELL_SCRIPT = 'shell-script',
  SQL_QUERY = 'sql-query',

  // DOCUMENT ARTIFACTS (Non-executable)
  MARKDOWN_DOCUMENT = 'markdown-document',
  LATEX_DOCUMENT = 'latex-document',
  JSON_SCHEMA = 'json-schema',
  API_SPEC = 'api-spec',
  README = 'readme',

  // DATA ARTIFACTS (Renderable)
  DATA_TABLE = 'data-table',
  CHART = 'chart',
  DASHBOARD = 'dashboard',
  SQL_RESULTS = 'sql-results',
  CSV_DATA = 'csv-data',
  JSON_DATA = 'json-data',

  // DESIGN ARTIFACTS (Visual)
  SVG_GRAPHIC = 'svg-graphic',
  MERMAID_DIAGRAM = 'mermaid-diagram',
  FLOWCHART = 'flowchart',
  SEQUENCE_DIAGRAM = 'sequence-diagram',

  // INTERACTIVE ARTIFACTS (Client-side execution)
  WEB_APP = 'web-app',
  CALCULATOR = 'calculator',
  FORM = 'form',
}

export enum Language {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  HTML = 'html',
  CSS = 'css',
  JSX = 'jsx',
  TSX = 'tsx',
  VUE = 'vue',
  SVELTE = 'svelte',
  SQL = 'sql',
  SHELL = 'shell',
  MARKDOWN = 'markdown',
  JSON = 'json',
}

export enum ExecutionStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

export interface ResourceLimits {
  maxCPU?: number; // CPU cores
  maxMemory?: number; // MB
  maxExecutionTime?: number; // seconds
  allowNetwork?: boolean;
}

export interface ArtifactMetadata {
  framework?: string;
  runtime?: string;
  environment?: string;
  permissions?: string[];
  resourceLimits?: ResourceLimits;
  customConfig?: Record<string, any>;
}

export interface Artifact {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: ArtifactType;
  language: Language;
  content: string;
  dependencies?: string[];
  metadata?: ArtifactMetadata;
  version: number;
  tags?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionInput {
  stdin?: string;
  args?: string[];
  env?: Record<string, string>;
  files?: Record<string, string>;
}

export interface ResourceUsage {
  cpuTime?: number; // milliseconds
  memory?: number; // bytes
  diskIO?: number; // bytes
  networkIO?: number; // bytes
}

export interface ExecutionResult {
  id: string;
  artifactId: string;
  userId: string;
  status: ExecutionStatus;
  output?: string;
  error?: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  duration?: number;
  resourceUsage?: ResourceUsage;
  startedAt: Date;
  completedAt?: Date;
}

export interface ArtifactVersion {
  id: string;
  artifactId: string;
  version: number;
  content: string;
  diff?: string;
  message?: string;
  createdBy: string;
  createdAt: Date;
}

// ============================================================================
// FILE TYPES
// ============================================================================

export enum FileCategory {
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  CODE = 'code',
  DATA = 'data',
  DESIGN = 'design',
  ARCHIVE = 'archive',
  OTHER = 'other',
}

export enum FileStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface FileMetadata {
  title?: string;
  author?: string;
  createdDate?: Date;
  modifiedDate?: Date;
  pages?: number;
  words?: number;
  duration?: number; // for audio/video
  dimensions?: { width: number; height: number };
  codec?: string;
  [key: string]: any;
}

export interface ProcessedFileData {
  textContent?: string;
  structuredData?: any;
  images?: string[];
  metadata?: FileMetadata;
  codeAnalysis?: CodeAnalysis;
  dataSchema?: DataSchema;
}

export interface TextAnalysis {
  keywords?: string[];
  sentiment?: string;
  summary?: string;
  language?: string;
}

export interface ImageAnalysis {
  labels?: string[];
  objects?: string[];
  text?: string;
  faces?: number;
}

export interface CodeAnalysis {
  language?: string;
  functions?: number;
  classes?: number;
  complexity?: number;
  dependencies?: string[];
  issues?: string[];
}

export interface DataAnalysis {
  rowCount?: number;
  columnCount?: number;
  schema?: DataSchema;
  summary?: Record<string, any>;
}

export interface DataSchema {
  columns: Array<{
    name: string;
    type: string;
    nullable?: boolean;
  }>;
}

export interface AudioAnalysis {
  transcript?: string;
  language?: string;
  duration?: number;
  speakers?: number;
}

export interface VideoAnalysis {
  duration?: number;
  resolution?: string;
  keyframes?: string[];
  transcript?: string;
}

export interface FileAnalysis {
  textAnalysis?: TextAnalysis;
  imageAnalysis?: ImageAnalysis;
  codeAnalysis?: CodeAnalysis;
  dataAnalysis?: DataAnalysis;
  audioAnalysis?: AudioAnalysis;
  videoAnalysis?: VideoAnalysis;
}

export interface SecurityScanResult {
  hasThreat: boolean;
  threats: string[];
  details?: string;
}

export interface FilePreview {
  type: 'pages' | 'image' | 'audio' | 'video' | 'text' | 'error';
  content: any;
}

export interface FileProcessingResult {
  id: string;
  fileId: string;
  processedData: ProcessedFileData;
  analysis: FileAnalysis;
  preview?: FilePreview;
  securityScan: SecurityScanResult;
  embeddings?: number[];
  processingTime: number;
  status: FileStatus;
  error?: string;
  createdAt: Date;
}

export interface File {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: FileCategory;
  extension: string;
  storageUrl: string;
  thumbnailUrl?: string;
  checksum: string;
  textContent?: string;
  status: FileStatus;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// MCP TYPES
// ============================================================================

export enum MCPServerCategory {
  PRODUCTIVITY = 'productivity',
  COMMUNICATION = 'communication',
  DEVELOPMENT = 'development',
  DESIGN = 'design',
  STORAGE = 'storage',
  ANALYTICS = 'analytics',
  DATABASE = 'database',
  AI_ML = 'ai-ml',
  BUSINESS = 'business',
  SOCIAL = 'social',
  UTILITIES = 'utilities',
}

export enum MCPCapability {
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
  SUBSCRIBE = 'subscribe',
}

export enum MCPAuthType {
  OAUTH = 'oauth',
  API_KEY = 'api-key',
  BASIC = 'basic',
  CUSTOM = 'custom',
  NONE = 'none',
}

export interface MCPRateLimit {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  concurrent?: number;
}

export interface MCPPricing {
  tier: 'free' | 'hobby' | 'pro' | 'enterprise';
  cost?: string;
  quotas?: {
    requests?: number;
    storage?: string;
    [key: string]: any;
  };
}

export interface MCPActionParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
  enum?: string[];
}

export interface MCPAction {
  id: string;
  name: string;
  description: string;
  parameters: MCPActionParameter[];
  returns: string;
  examples?: string[];
}

export interface MCPServerConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: MCPServerCategory;
  icon?: string;
  website?: string;
  documentation?: string;
  capabilities: MCPCapability[];
  authType: MCPAuthType;
  rateLimit?: MCPRateLimit;
  pricing?: MCPPricing;
  isEnterprise?: boolean;
  actions: MCPAction[];
}

export interface MCPConnection {
  id: string;
  userId: string;
  serverId: string;
  serverName: string;
  status: 'connected' | 'disconnected' | 'error';
  credentials: {
    type: MCPAuthType;
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    expiresAt?: Date;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MCPExecutionRequest {
  serverId: string;
  action: string;
  parameters: Record<string, any>;
  userId: string;
}

export interface MCPExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface WorkflowStep {
  id: string;
  serverId: string;
  action: string;
  parameters: Record<string, any>;
  dependsOn?: string[]; // IDs of steps that must complete first
  required: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  userId: string;
  createdAt: Date;
}

// ============================================================================
// CHAT INTEGRATION TYPES
// ============================================================================

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum MessageContentType {
  TEXT = 'text',
  ARTIFACT = 'artifact',
  FILE = 'file',
  MCP_RESULT = 'mcp-result',
  EXECUTION_RESULT = 'execution-result',
}

export interface MessageContent {
  type: MessageContentType;
  text?: string;
  artifactId?: string;
  fileId?: string;
  mcpResult?: MCPExecutionResult;
  executionResult?: ExecutionResult;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: MessageContent[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model?: string;
  artifacts: string[]; // artifact IDs
  files: string[]; // file IDs
  mcpConnections: string[]; // MCP connection IDs
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// UNIFIED CONTENT PIPELINE TYPES
// ============================================================================

export interface ContentPipelineInput {
  type: 'file' | 'text' | 'url' | 'mcp-result';
  source: File | string | MCPExecutionResult;
  userId: string;
  conversationId?: string;
  options?: {
    generateArtifact?: boolean;
    enableOCR?: boolean;
    enableTranscription?: boolean;
    generateEmbeddings?: boolean;
    triggerMCP?: string[]; // MCP server IDs to trigger
  };
}

export interface ContentPipelineResult {
  success: boolean;
  file?: File;
  fileProcessing?: FileProcessingResult;
  artifact?: Artifact;
  mcpResults?: MCPExecutionResult[];
  error?: string;
  processingTime: number;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface SearchFilters {
  fileType?: string;
  artifactType?: ArtifactType;
  category?: FileCategory | MCPServerCategory;
  dateFrom?: Date;
  dateTo?: Date;
  hasPreview?: boolean;
  hasOCR?: boolean;
  hasTranscript?: boolean;
}

export interface SearchResult {
  id: string;
  type: 'artifact' | 'file' | 'mcp-connection';
  title: string;
  description?: string;
  snippet?: string;
  score: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// AI INTEGRATION TYPES
// ============================================================================

export enum AIModel {
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  CLAUDE_3_OPUS = 'claude-3-opus',
  CLAUDE_3_SONNET = 'claude-3-sonnet',
  CLAUDE_3_HAIKU = 'claude-3-haiku',
}

export interface AIRequest {
  model: AIModel;
  messages: ChatMessage[];
  context?: {
    files?: File[];
    artifacts?: Artifact[];
    mcpData?: any[];
  };
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
}

export interface AIResponse {
  message: ChatMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  artifacts?: Artifact[];
  mcpTriggers?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function isExecutableArtifact(type: ArtifactType): boolean {
  const executableTypes = [
    ArtifactType.REACT_COMPONENT,
    ArtifactType.VUE_COMPONENT,
    ArtifactType.JAVASCRIPT,
    ArtifactType.TYPESCRIPT,
    ArtifactType.PYTHON_SCRIPT,
    ArtifactType.NODE_SCRIPT,
    ArtifactType.SQL_QUERY,
    ArtifactType.WEB_APP,
    ArtifactType.CALCULATOR,
  ];
  return executableTypes.includes(type);
}

export function requiresPreview(type: ArtifactType): boolean {
  const previewTypes = [
    ArtifactType.REACT_COMPONENT,
    ArtifactType.VUE_COMPONENT,
    ArtifactType.HTML_PAGE,
    ArtifactType.SVG_GRAPHIC,
    ArtifactType.MERMAID_DIAGRAM,
    ArtifactType.WEB_APP,
    ArtifactType.CHART,
  ];
  return previewTypes.includes(type);
}

export function getLanguageForType(type: ArtifactType): Language {
  const typeLanguageMap: Partial<Record<ArtifactType, Language>> = {
    [ArtifactType.REACT_COMPONENT]: Language.TSX,
    [ArtifactType.VUE_COMPONENT]: Language.VUE,
    [ArtifactType.JAVASCRIPT]: Language.JAVASCRIPT,
    [ArtifactType.TYPESCRIPT]: Language.TYPESCRIPT,
    [ArtifactType.PYTHON_SCRIPT]: Language.PYTHON,
    [ArtifactType.HTML_PAGE]: Language.HTML,
    [ArtifactType.SQL_QUERY]: Language.SQL,
    [ArtifactType.MARKDOWN_DOCUMENT]: Language.MARKDOWN,
  };
  return typeLanguageMap[type] || Language.JAVASCRIPT;
}
