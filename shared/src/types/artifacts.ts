import { z } from 'zod';

// ============================================================================
// ARTIFACT TYPES
// ============================================================================

export enum ArtifactType {
  // Code Artifacts
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
  DOCKERFILE = 'dockerfile',
  KUBERNETES_YAML = 'kubernetes-yaml',

  // Document Artifacts
  MARKDOWN_DOCUMENT = 'markdown-document',
  LATEX_DOCUMENT = 'latex-document',
  JSON_SCHEMA = 'json-schema',
  API_SPEC = 'api-spec',
  README = 'readme',

  // Data Artifacts
  DATA_TABLE = 'data-table',
  CHART = 'chart',
  DASHBOARD = 'dashboard',
  SQL_RESULTS = 'sql-results',
  CSV_DATA = 'csv-data',
  JSON_DATA = 'json-data',

  // Design Artifacts
  SVG_GRAPHIC = 'svg-graphic',
  MERMAID_DIAGRAM = 'mermaid-diagram',
  FLOWCHART = 'flowchart',
  SEQUENCE_DIAGRAM = 'sequence-diagram',
  MIND_MAP = 'mind-map',
  WIREFRAME = 'wireframe',
  UI_MOCKUP = 'ui-mockup',

  // Interactive Artifacts
  WEB_APP = 'web-app',
  GAME = 'game',
  SIMULATION = 'simulation',
  CALCULATOR = 'calculator',
  FORM = 'form',

  // AI/ML Artifacts
  JUPYTER_NOTEBOOK = 'jupyter-notebook',
  ML_MODEL = 'ml-model',
  DATASET = 'dataset',
  TRAINING_SCRIPT = 'training-script'
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
  DOCKER = 'dockerfile',
  YAML = 'yaml',
  MARKDOWN = 'markdown',
  LATEX = 'latex',
  JSON = 'json'
}

export enum ExecutionStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED'
}

// ============================================================================
// RESOURCE LIMITS
// ============================================================================

export interface ResourceLimits {
  maxCPU?: number;          // CPU cores (e.g., 1.0)
  maxMemory?: number;       // MB (e.g., 512)
  maxDisk?: number;         // MB (e.g., 1024)
  maxExecutionTime?: number; // seconds (e.g., 30)
  maxNetworkRequests?: number;
  allowNetwork?: boolean;
}

export const defaultResourceLimits: ResourceLimits = {
  maxCPU: 1.0,
  maxMemory: 512,
  maxDisk: 100,
  maxExecutionTime: 30,
  maxNetworkRequests: 0,
  allowNetwork: false
};

// ============================================================================
// ARTIFACT METADATA
// ============================================================================

export interface ArtifactMetadata {
  framework?: string;
  runtime?: string;
  environment?: string;
  permissions?: string[];
  resourceLimits?: ResourceLimits;
  customConfig?: Record<string, any>;
  tags?: string[];
}

// ============================================================================
// BASE ARTIFACT INTERFACE
// ============================================================================

export interface BaseArtifact {
  id: string;
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
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ARTIFACT VERSION
// ============================================================================

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
// EXECUTION INTERFACES
// ============================================================================

export interface ExecutionInput {
  stdin?: string;
  args?: string[];
  env?: Record<string, string>;
  files?: Record<string, string>;
}

export interface ExecutionResult {
  id: string;
  artifactId: string;
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

export interface ResourceUsage {
  cpuTime?: number;      // milliseconds
  memory?: number;       // bytes
  diskIO?: number;       // bytes
  networkIO?: number;    // bytes
}

// ============================================================================
// SHARING INTERFACES
// ============================================================================

export enum SharePermission {
  READ = 'READ',
  WRITE = 'WRITE',
  EXECUTE = 'EXECUTE'
}

export interface ShareLink {
  id: string;
  artifactId: string;
  url: string;
  permissions: SharePermission[];
  expiresAt?: Date;
  password?: string;
  allowComments: boolean;
  allowDownload: boolean;
  createdBy: string;
  createdAt: Date;
}

// ============================================================================
// TEMPLATE INTERFACES
// ============================================================================

export interface ArtifactTemplate {
  id: string;
  name: string;
  description: string;
  type: ArtifactType;
  language: Language;
  category: string;
  tags: string[];
  content: string;
  dependencies?: string[];
  metadata?: ArtifactMetadata;
  previewImage?: string;
  isOfficial: boolean;
  downloads: number;
  rating: number;
  createdBy: string;
  createdAt: Date;
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const createArtifactSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.nativeEnum(ArtifactType),
  language: z.nativeEnum(Language),
  content: z.string(),
  dependencies: z.array(z.string()).optional(),
  metadata: z.object({
    framework: z.string().optional(),
    runtime: z.string().optional(),
    environment: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    resourceLimits: z.object({
      maxCPU: z.number().optional(),
      maxMemory: z.number().optional(),
      maxDisk: z.number().optional(),
      maxExecutionTime: z.number().optional(),
      maxNetworkRequests: z.number().optional(),
      allowNetwork: z.boolean().optional()
    }).optional(),
    customConfig: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional()
  }).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false)
});

export const updateArtifactSchema = createArtifactSchema.partial();

export const executeArtifactSchema = z.object({
  input: z.object({
    stdin: z.string().optional(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
    files: z.record(z.string()).optional()
  }).optional()
});

export const createShareLinkSchema = z.object({
  permissions: z.array(z.nativeEnum(SharePermission)),
  expiresAt: z.date().optional(),
  password: z.string().optional(),
  allowComments: z.boolean().default(false),
  allowDownload: z.boolean().default(true)
});

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isExecutableArtifact(type: ArtifactType): boolean {
  const executableTypes = [
    ArtifactType.REACT_COMPONENT,
    ArtifactType.VUE_COMPONENT,
    ArtifactType.SVELTE_COMPONENT,
    ArtifactType.HTML_PAGE,
    ArtifactType.JAVASCRIPT,
    ArtifactType.TYPESCRIPT,
    ArtifactType.PYTHON_SCRIPT,
    ArtifactType.NODE_SCRIPT,
    ArtifactType.SHELL_SCRIPT,
    ArtifactType.SQL_QUERY,
    ArtifactType.WEB_APP,
    ArtifactType.CALCULATOR,
    ArtifactType.FORM
  ];
  return executableTypes.includes(type);
}

export function requiresPreview(type: ArtifactType): boolean {
  const previewTypes = [
    ArtifactType.REACT_COMPONENT,
    ArtifactType.VUE_COMPONENT,
    ArtifactType.SVELTE_COMPONENT,
    ArtifactType.HTML_PAGE,
    ArtifactType.SVG_GRAPHIC,
    ArtifactType.MERMAID_DIAGRAM,
    ArtifactType.WEB_APP,
    ArtifactType.CHART,
    ArtifactType.DASHBOARD
  ];
  return previewTypes.includes(type);
}

export function getLanguageForType(type: ArtifactType): Language {
  const typeLanguageMap: Record<ArtifactType, Language> = {
    [ArtifactType.REACT_COMPONENT]: Language.TSX,
    [ArtifactType.VUE_COMPONENT]: Language.VUE,
    [ArtifactType.SVELTE_COMPONENT]: Language.SVELTE,
    [ArtifactType.ANGULAR_COMPONENT]: Language.TYPESCRIPT,
    [ArtifactType.HTML_PAGE]: Language.HTML,
    [ArtifactType.JAVASCRIPT]: Language.JAVASCRIPT,
    [ArtifactType.TYPESCRIPT]: Language.TYPESCRIPT,
    [ArtifactType.PYTHON_SCRIPT]: Language.PYTHON,
    [ArtifactType.NODE_SCRIPT]: Language.JAVASCRIPT,
    [ArtifactType.SHELL_SCRIPT]: Language.SHELL,
    [ArtifactType.SQL_QUERY]: Language.SQL,
    [ArtifactType.DOCKERFILE]: Language.DOCKER,
    [ArtifactType.KUBERNETES_YAML]: Language.YAML,
    [ArtifactType.MARKDOWN_DOCUMENT]: Language.MARKDOWN,
    [ArtifactType.LATEX_DOCUMENT]: Language.LATEX,
    [ArtifactType.JSON_SCHEMA]: Language.JSON,
    [ArtifactType.API_SPEC]: Language.YAML,
    [ArtifactType.README]: Language.MARKDOWN,
    [ArtifactType.DATA_TABLE]: Language.JSON,
    [ArtifactType.CHART]: Language.JSON,
    [ArtifactType.DASHBOARD]: Language.JSON,
    [ArtifactType.SQL_RESULTS]: Language.JSON,
    [ArtifactType.CSV_DATA]: Language.JSON,
    [ArtifactType.JSON_DATA]: Language.JSON,
    [ArtifactType.SVG_GRAPHIC]: Language.HTML,
    [ArtifactType.MERMAID_DIAGRAM]: Language.MARKDOWN,
    [ArtifactType.FLOWCHART]: Language.JSON,
    [ArtifactType.SEQUENCE_DIAGRAM]: Language.MARKDOWN,
    [ArtifactType.MIND_MAP]: Language.JSON,
    [ArtifactType.WIREFRAME]: Language.JSON,
    [ArtifactType.UI_MOCKUP]: Language.JSON,
    [ArtifactType.WEB_APP]: Language.HTML,
    [ArtifactType.GAME]: Language.JAVASCRIPT,
    [ArtifactType.SIMULATION]: Language.JAVASCRIPT,
    [ArtifactType.CALCULATOR]: Language.JAVASCRIPT,
    [ArtifactType.FORM]: Language.HTML,
    [ArtifactType.JUPYTER_NOTEBOOK]: Language.PYTHON,
    [ArtifactType.ML_MODEL]: Language.PYTHON,
    [ArtifactType.DATASET]: Language.JSON,
    [ArtifactType.TRAINING_SCRIPT]: Language.PYTHON
  };
  return typeLanguageMap[type];
}
