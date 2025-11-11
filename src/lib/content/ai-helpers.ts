/**
 * AI Helper Functions
 * Utilities for content analysis and artifact generation
 */

import type { ArtifactType } from '@/types/content';

/**
 * Infer artifact type from content
 */
export function inferArtifactType(content: string): ArtifactType {
  const lowerContent = content.toLowerCase();

  // React detection
  if (
    /import\s+react/i.test(content) ||
    /from\s+['"]react['"]/i.test(content) ||
    /<\w+.*>.*<\/\w+>/s.test(content)
  ) {
    return 'react-component';
  }

  // Python detection
  if (/^(import|from|def|class)\s/m.test(content)) {
    return 'python-script';
  }

  // Vue detection
  if (/<template>|<script.*setup>/i.test(content)) {
    return 'vue-component';
  }

  // HTML detection
  if (/<html|<!DOCTYPE/i.test(content)) {
    return 'html-page';
  }

  // SQL detection
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\s/im.test(content)) {
    return 'sql-query';
  }

  // JavaScript/TypeScript detection
  if (
    /function\s+\w+|const\s+\w+\s*=|class\s+\w+/i.test(content) &&
    !lowerContent.includes('import react')
  ) {
    if (content.includes(': ') || content.includes('interface ')) {
      return 'typescript';
    }
    return 'javascript';
  }

  // Markdown detection
  if (/^#{1,6}\s/m.test(content) || /\[.*\]\(.*\)/m.test(content)) {
    return 'markdown-document';
  }

  // JSON detection
  if (/^\s*\{[\s\S]*\}\s*$/.test(content) && isValidJSON(content)) {
    return 'json-data';
  }

  // Mermaid diagram detection
  if (/^(graph|sequenceDiagram|classDiagram|flowchart)/im.test(content)) {
    return 'mermaid-diagram';
  }

  // Default to markdown for text content
  return 'markdown-document';
}

/**
 * Extract code from markdown code blocks or plain text
 */
export function extractCodeFromText(text: string): string {
  // Try to extract from markdown code blocks
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const matches = Array.from(text.matchAll(codeBlockRegex));

  if (matches.length > 0) {
    // Return the first (or largest) code block
    return matches
      .map((m) => m[1])
      .sort((a, b) => b.length - a.length)[0]
      .trim();
  }

  // If no code blocks, check if entire content looks like code
  if (looksLikeCode(text)) {
    return text.trim();
  }

  return text;
}

/**
 * Generate a title for an artifact based on content
 */
export function generateArtifactTitle(content: string, type: ArtifactType): string {
  const lines = content.split('\n').filter((line) => line.trim());

  // Try to extract from common patterns
  const patterns = [
    // Function definition
    /^function\s+(\w+)/,
    /^const\s+(\w+)\s*=/,
    /^class\s+(\w+)/,
    /^def\s+(\w+)/,
    // Component names
    /^export\s+(?:default\s+)?(?:function|const)\s+(\w+)/,
    // HTML title
    /<title>(.*?)<\/title>/i,
    // Markdown heading
    /^#\s+(.+)$/,
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }

  // Generate based on type
  const typeNames: Record<string, string> = {
    'react-component': 'React Component',
    'vue-component': 'Vue Component',
    'python-script': 'Python Script',
    'javascript': 'JavaScript Code',
    'typescript': 'TypeScript Code',
    'html-page': 'HTML Page',
    'sql-query': 'SQL Query',
    'markdown-document': 'Document',
  };

  return typeNames[type] || 'New Artifact';
}

/**
 * Check if text looks like code
 */
function looksLikeCode(text: string): boolean {
  const codeIndicators = [
    /^import\s/m,
    /^from\s.*import/m,
    /function\s+\w+\s*\(/,
    /^class\s+\w+/m,
    /^def\s+\w+\s*\(/m,
    /^const\s+\w+\s*=/m,
    /^let\s+\w+\s*=/m,
    /^var\s+\w+\s*=/m,
    /=>\s*{/,
    /\w+\s*\(.*\)\s*{/,
  ];

  return codeIndicators.some((pattern) => pattern.test(text));
}

/**
 * Validate JSON
 */
function isValidJSON(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract metadata from content
 */
export function extractMetadata(content: string, type: ArtifactType): Record<string, any> {
  const metadata: Record<string, any> = {
    lineCount: content.split('\n').length,
    charCount: content.length,
  };

  // Extract dependencies
  if (type === 'react-component' || type === 'javascript' || type === 'typescript') {
    const imports = content.match(/^import\s+.*?from\s+['"](.+?)['"]/gm);
    if (imports) {
      metadata.dependencies = imports
        .map((imp) => {
          const match = imp.match(/from\s+['"](.+?)['"]/);
          return match ? match[1] : null;
        })
        .filter(Boolean);
    }
  }

  // Extract Python imports
  if (type === 'python-script') {
    const imports = content.match(/^(?:import|from)\s+(\w+)/gm);
    if (imports) {
      metadata.dependencies = imports
        .map((imp) => {
          const match = imp.match(/^(?:import|from)\s+(\w+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean);
    }
  }

  return metadata;
}

/**
 * Generate code summary
 */
export function generateCodeSummary(content: string): string {
  const lines = content.split('\n').filter((l) => l.trim());

  // Count different elements
  const functions = (content.match(/function\s+\w+|const\s+\w+\s*=.*=>/g) || []).length;
  const classes = (content.match(/class\s+\w+/g) || []).length;
  const imports = (content.match(/^import\s/gm) || []).length;

  const parts = [];

  if (imports > 0) parts.push(`${imports} import${imports > 1 ? 's' : ''}`);
  if (classes > 0) parts.push(`${classes} class${classes > 1 ? 'es' : ''}`);
  if (functions > 0) parts.push(`${functions} function${functions > 1 ? 's' : ''}`);

  return parts.length > 0 ? parts.join(', ') : `${lines.length} lines of code`;
}

/**
 * Detect file type from content and filename
 */
export function detectFileType(fileName: string, content?: string): {
  category: string;
  type: ArtifactType;
} {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Document types
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) {
    return { category: 'document', type: 'markdown-document' };
  }

  // Spreadsheet types
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return { category: 'spreadsheet', type: 'data-table' };
  }

  // Code types
  if (['js', 'jsx'].includes(ext)) {
    return { category: 'code', type: 'javascript' };
  }
  if (['ts', 'tsx'].includes(ext)) {
    if (content?.includes('import React')) {
      return { category: 'code', type: 'react-component' };
    }
    return { category: 'code', type: 'typescript' };
  }
  if (ext === 'py') {
    return { category: 'code', type: 'python-script' };
  }
  if (ext === 'sql') {
    return { category: 'code', type: 'sql-query' };
  }
  if (ext === 'vue') {
    return { category: 'code', type: 'vue-component' };
  }

  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    return { category: 'image', type: 'svg-graphic' };
  }

  // Default
  return { category: 'other', type: 'markdown-document' };
}
