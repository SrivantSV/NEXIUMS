/**
 * Code Processor
 * Processes code files with AST parsing and analysis
 */

import { FileProcessor, ProcessedFileData, ProcessingOptions, CodeAnalysis } from '@/types/files';

export class CodeProcessor implements FileProcessor {
  private languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sql': 'sql',
  };

  getSupportedTypes(): string[] {
    return Object.keys(this.languageMap);
  }

  async validate(file: File): Promise<boolean> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return !!extension && extension in this.languageMap;
  }

  async process(file: File, options: ProcessingOptions): Promise<ProcessedFileData> {
    try {
      const textContent = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const language = this.languageMap[extension] || 'plaintext';

      // Perform code analysis
      const codeAnalysis = options.enableCodeAnalysis !== false
        ? await this.analyzeCode(textContent, language, file.name)
        : undefined;

      return {
        textContent,
        codeAnalysis,
        metadata: {
          language,
          extension,
          fileName: file.name,
          size: file.size,
        },
      };
    } catch (error) {
      console.error('[CodeProcessor] Processing failed:', error);
      throw new Error(`Code processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeCode(code: string, language: string, fileName: string): Promise<CodeAnalysis> {
    const lines = code.split('\n');
    const analysis: CodeAnalysis = {
      language,
      metrics: {
        linesOfCode: lines.length,
        linesOfComments: this.countCommentLines(code, language),
        blankLines: lines.filter(line => line.trim() === '').length,
        cyclomaticComplexity: this.calculateComplexity(code, language),
        maintainabilityIndex: 0,
      },
    };

    // Extract imports/exports
    analysis.imports = this.extractImports(code, language);
    analysis.exports = this.extractExports(code, language);

    // Extract functions
    analysis.functions = this.extractFunctions(code, language);

    // Extract classes
    analysis.classes = this.extractClasses(code, language);

    // Extract dependencies
    analysis.dependencies = this.extractDependencies(code, language);

    // Find issues
    analysis.issues = this.findIssues(code, language);

    // Calculate maintainability index
    if (analysis.metrics) {
      analysis.metrics.maintainabilityIndex = this.calculateMaintainabilityIndex(analysis.metrics);
    }

    return analysis;
  }

  private countCommentLines(code: string, language: string): number {
    const lines = code.split('\n');
    let commentCount = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Handle different comment styles
      if (language === 'python') {
        if (trimmed.startsWith('#') || trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
          commentCount++;
        }
      } else {
        // C-style comments
        if (inBlockComment) {
          commentCount++;
          if (trimmed.includes('*/')) {
            inBlockComment = false;
          }
        } else if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
          commentCount++;
        } else if (trimmed.startsWith('/*')) {
          commentCount++;
          if (!trimmed.includes('*/')) {
            inBlockComment = true;
          }
        }
      }
    }

    return commentCount;
  }

  private calculateComplexity(code: string, language: string): number {
    // Simple cyclomatic complexity calculation
    // Count decision points: if, else, while, for, case, catch, &&, ||
    const complexityKeywords = [
      /\bif\b/g,
      /\belse\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\&\&/g,
      /\|\|/g,
      /\?/g, // Ternary operator
    ];

    let complexity = 1; // Base complexity

    for (const pattern of complexityKeywords) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private extractImports(code: string, language: string): string[] {
    const imports: string[] = [];

    if (language === 'javascript' || language === 'typescript') {
      // ES6 imports
      const importMatches = code.matchAll(/import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g);
      for (const match of importMatches) {
        imports.push(match[1]);
      }

      // CommonJS requires
      const requireMatches = code.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
      for (const match of requireMatches) {
        imports.push(match[1]);
      }
    } else if (language === 'python') {
      // Python imports
      const importMatches = code.matchAll(/(?:from\s+(\S+)\s+)?import\s+([^#\n]+)/g);
      for (const match of importMatches) {
        if (match[1]) {
          imports.push(match[1]);
        }
        const modules = match[2].split(',').map(m => m.trim());
        imports.push(...modules);
      }
    } else if (language === 'java') {
      // Java imports
      const importMatches = code.matchAll(/import\s+([^;]+);/g);
      for (const match of importMatches) {
        imports.push(match[1].trim());
      }
    }

    return imports;
  }

  private extractExports(code: string, language: string): string[] {
    const exports: string[] = [];

    if (language === 'javascript' || language === 'typescript') {
      // Named exports
      const namedExports = code.matchAll(/export\s+(?:const|let|var|function|class)\s+(\w+)/g);
      for (const match of namedExports) {
        exports.push(match[1]);
      }

      // Export statements
      const exportStatements = code.matchAll(/export\s+\{([^}]+)\}/g);
      for (const match of exportStatements) {
        const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
        exports.push(...names);
      }

      // Default export
      if (code.includes('export default')) {
        exports.push('default');
      }
    }

    return exports;
  }

  private extractFunctions(code: string, language: string): Array<{
    name: string;
    lineStart: number;
    lineEnd: number;
    parameters: string[];
    complexity: number;
  }> {
    const functions: Array<any> = [];
    const lines = code.split('\n');

    if (language === 'javascript' || language === 'typescript') {
      // Function declarations and arrow functions
      const functionPatterns = [
        /function\s+(\w+)\s*\(([^)]*)\)/g,
        /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/g,
        /(\w+)\s*:\s*\(([^)]*)\)\s*=>/g,
      ];

      for (const pattern of functionPatterns) {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          const name = match[1];
          const params = match[2].split(',').map(p => p.trim()).filter(p => p);
          const lineStart = code.substring(0, match.index).split('\n').length;

          functions.push({
            name,
            lineStart,
            lineEnd: lineStart + 1, // Simplified
            parameters: params,
            complexity: 1,
          });
        }
      }
    } else if (language === 'python') {
      // Python functions
      const functionPattern = /def\s+(\w+)\s*\(([^)]*)\)/g;
      let match;
      while ((match = functionPattern.exec(code)) !== null) {
        const name = match[1];
        const params = match[2].split(',').map(p => p.trim().split(':')[0]).filter(p => p);
        const lineStart = code.substring(0, match.index).split('\n').length;

        functions.push({
          name,
          lineStart,
          lineEnd: lineStart + 1,
          parameters: params,
          complexity: 1,
        });
      }
    }

    return functions;
  }

  private extractClasses(code: string, language: string): Array<{
    name: string;
    lineStart: number;
    lineEnd: number;
    methods: string[];
  }> {
    const classes: Array<any> = [];

    if (language === 'javascript' || language === 'typescript') {
      const classPattern = /class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g;
      let match;
      while ((match = classPattern.exec(code)) !== null) {
        const name = match[1];
        const lineStart = code.substring(0, match.index).split('\n').length;

        // Extract methods (simplified)
        const methods: string[] = [];
        const methodPattern = /(\w+)\s*\([^)]*\)\s*\{/g;
        let methodMatch;
        while ((methodMatch = methodPattern.exec(code)) !== null) {
          if (methodMatch.index > match.index) {
            methods.push(methodMatch[1]);
          }
        }

        classes.push({
          name,
          lineStart,
          lineEnd: lineStart + 1,
          methods,
        });
      }
    } else if (language === 'python') {
      const classPattern = /class\s+(\w+)(?:\([^)]*\))?:/g;
      let match;
      while ((match = classPattern.exec(code)) !== null) {
        const name = match[1];
        const lineStart = code.substring(0, match.index).split('\n').length;

        classes.push({
          name,
          lineStart,
          lineEnd: lineStart + 1,
          methods: [],
        });
      }
    }

    return classes;
  }

  private extractDependencies(code: string, language: string): Array<{
    name: string;
    version?: string;
    type: 'production' | 'development' | 'peer';
  }> {
    const dependencies: Array<any> = [];
    const imports = this.extractImports(code, language);

    for (const imp of imports) {
      // Remove relative paths
      if (!imp.startsWith('.') && !imp.startsWith('/')) {
        dependencies.push({
          name: imp,
          type: 'production' as const,
        });
      }
    }

    return dependencies;
  }

  private findIssues(code: string, language: string): Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    column?: number;
    rule?: string;
  }> {
    const issues: Array<any> = [];
    const lines = code.split('\n');

    // Check for common issues
    lines.forEach((line, index) => {
      // Check for console.log
      if (line.includes('console.log')) {
        issues.push({
          type: 'warning' as const,
          message: 'console.log statement found',
          line: index + 1,
          rule: 'no-console',
        });
      }

      // Check for debugger
      if (line.includes('debugger')) {
        issues.push({
          type: 'warning' as const,
          message: 'debugger statement found',
          line: index + 1,
          rule: 'no-debugger',
        });
      }

      // Check for TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          type: 'info' as const,
          message: 'TODO/FIXME comment found',
          line: index + 1,
          rule: 'no-todo',
        });
      }

      // Check for long lines (>120 characters)
      if (line.length > 120) {
        issues.push({
          type: 'info' as const,
          message: 'Line exceeds 120 characters',
          line: index + 1,
          rule: 'max-line-length',
        });
      }
    });

    return issues;
  }

  private calculateMaintainabilityIndex(metrics: CodeAnalysis['metrics']): number {
    if (!metrics) return 0;

    // Simplified maintainability index calculation
    // MI = 171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(L)
    // Where: V = Halstead Volume, G = Cyclomatic Complexity, L = Lines of Code

    const loc = metrics.linesOfCode;
    const complexity = metrics.cyclomaticComplexity;

    // Simplified formula (0-100 scale)
    const mi = Math.max(0, Math.min(100,
      100 - (complexity / 10) * 10 - (loc / 1000) * 20
    ));

    return Math.round(mi);
  }
}
