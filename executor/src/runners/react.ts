import { logger } from '../utils/logger';
import { ResourceLimits } from '@nexiums/shared';

export class ReactRunner {
  async execute(code: string, input?: any, limits?: ResourceLimits): Promise<any> {
    try {
      // For React components, we validate and prepare for client-side rendering
      // Actual rendering happens in the browser

      // Basic validation
      if (!code.trim()) {
        throw new Error('Empty React component');
      }

      // Check for required patterns
      const hasImport = /import\s+React/i.test(code) || /import.*from\s+['"]react['"]/i.test(code);
      const hasExport = /export\s+(default|const|function)/i.test(code);

      const warnings: string[] = [];

      if (!hasImport) {
        warnings.push('Warning: React import not found. Component may not work properly.');
      }

      if (!hasExport) {
        warnings.push('Warning: No export statement found. Component may not be importable.');
      }

      // Check for dangerous patterns
      if (/dangerouslySetInnerHTML/.test(code)) {
        warnings.push('Warning: dangerouslySetInnerHTML detected. Use with caution.');
      }

      // Check for eval or Function
      if (/eval\s*\(|new\s+Function\s*\(/.test(code)) {
        throw new Error('eval() and Function() are not allowed in React components');
      }

      return {
        success: true,
        output: 'React component validated successfully',
        error: undefined,
        exitCode: 0,
        stdout: warnings.length > 0 ? warnings.join('\n') : 'Component is ready to render',
        stderr: '',
        code: code,
        warnings
      };
    } catch (error: any) {
      logger.error('React validation error:', error);

      return {
        success: false,
        output: '',
        error: error.message || 'React validation failed',
        exitCode: 1,
        stdout: '',
        stderr: error.message
      };
    }
  }
}
