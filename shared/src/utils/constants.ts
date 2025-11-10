export const CONSTANTS = {
  // Execution limits
  MAX_EXECUTION_TIME: 30000, // 30 seconds
  MAX_MEMORY: 512, // MB
  MAX_CPU: 1.0,
  MAX_OUTPUT_SIZE: 1024 * 1024, // 1MB

  // File limits
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_ARTIFACT: 10,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Rate limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,

  // Cache
  CACHE_TTL: 60 * 60, // 1 hour

  // JWT
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_EXPIRES_IN: '30d',

  // Artifact
  MAX_ARTIFACT_TITLE_LENGTH: 200,
  MAX_ARTIFACT_DESCRIPTION_LENGTH: 1000,
  MAX_ARTIFACT_CONTENT_SIZE: 1024 * 1024, // 1MB

  // Versioning
  MAX_VERSIONS_PER_ARTIFACT: 100
} as const;

export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'html',
  'css',
  'jsx',
  'tsx',
  'vue',
  'svelte',
  'sql',
  'shell',
  'dockerfile',
  'yaml',
  'markdown',
  'latex',
  'json'
] as const;

export const EXECUTABLE_ARTIFACT_TYPES = [
  'react-component',
  'vue-component',
  'svelte-component',
  'html-page',
  'javascript',
  'typescript',
  'python-script',
  'node-script',
  'shell-script',
  'sql-query',
  'web-app',
  'calculator',
  'form'
] as const;
