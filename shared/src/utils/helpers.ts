import { ArtifactType, Language } from '../types/artifacts';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitize code content for security
 */
export function sanitizeCode(code: string): string {
  // Remove potentially dangerous patterns
  return code
    .replace(/eval\s*\(/g, '// BLOCKED: eval(')
    .replace(/Function\s*\(/g, '// BLOCKED: Function(')
    .replace(/require\s*\(/g, '// BLOCKED: require(')
    .replace(/import\s*\(/g, '// BLOCKED: import(');
}

/**
 * Get file extension from language
 */
export function getFileExtension(language: Language): string {
  const extensionMap: Record<Language, string> = {
    [Language.JAVASCRIPT]: 'js',
    [Language.TYPESCRIPT]: 'ts',
    [Language.PYTHON]: 'py',
    [Language.HTML]: 'html',
    [Language.CSS]: 'css',
    [Language.JSX]: 'jsx',
    [Language.TSX]: 'tsx',
    [Language.VUE]: 'vue',
    [Language.SVELTE]: 'svelte',
    [Language.SQL]: 'sql',
    [Language.SHELL]: 'sh',
    [Language.DOCKER]: 'Dockerfile',
    [Language.YAML]: 'yaml',
    [Language.MARKDOWN]: 'md',
    [Language.LATEX]: 'tex',
    [Language.JSON]: 'json'
  };
  return extensionMap[language] || 'txt';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract imports from Python code
 */
export function extractPythonImports(code: string): string[] {
  const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
  const imports: string[] = [];
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    const importName = match[1] || match[2];
    if (importName) {
      // Get the base module name
      const baseName = importName.split('.')[0];
      imports.push(baseName);
    }
  }

  return [...new Set(imports)];
}

/**
 * Extract requires from JavaScript code
 */
export function extractJavaScriptRequires(code: string): string[] {
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const requires: string[] = [];
  let match;

  while ((match = requireRegex.exec(code)) !== null) {
    requires.push(match[1]);
  }

  return [...new Set(requires)];
}

/**
 * Check if code contains dangerous patterns
 */
export function hasDangerousPatterns(code: string, language: Language): boolean {
  const commonDangerous = [
    /eval\s*\(/,
    /Function\s*\(/,
    /exec\s*\(/,
    /child_process/,
    /fs\./,
    /process\./
  ];

  const pythonDangerous = [
    /__import__/,
    /exec\s*\(/,
    /compile\s*\(/,
    /os\./,
    /subprocess/,
    /sys\./
  ];

  const patterns = language === Language.PYTHON
    ? [...commonDangerous, ...pythonDangerous]
    : commonDangerous;

  return patterns.some(pattern => pattern.test(code));
}

/**
 * Generate share code
 */
export function generateShareCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Parse query parameters
 */
export function parseQueryParams(query: any): {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
} {
  return {
    page: parseInt(query.page as string) || 1,
    limit: Math.min(parseInt(query.limit as string) || 20, 100),
    sortBy: query.sortBy as string,
    sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc'
  };
}
