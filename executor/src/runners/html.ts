import { logger } from '../utils/logger';
import { ResourceLimits } from '@nexiums/shared';

export class HTMLRunner {
  async execute(code: string, input?: any, limits?: ResourceLimits): Promise<any> {
    try {
      // For HTML, we don't actually execute server-side
      // Instead, we validate and return the code for client-side rendering

      // Basic HTML validation
      if (!code.trim()) {
        throw new Error('Empty HTML content');
      }

      // Check for dangerous patterns
      const dangerousPatterns = [
        /<script[^>]*>.*?<\/script>/is,
        /javascript:/i,
        /on\w+\s*=/i // Event handlers
      ];

      const warnings: string[] = [];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
          warnings.push(`Warning: Potentially unsafe pattern detected`);
        }
      }

      return {
        success: true,
        output: 'HTML validated successfully',
        error: undefined,
        exitCode: 0,
        stdout: warnings.length > 0 ? warnings.join('\n') : 'HTML is safe to render',
        stderr: '',
        html: code,
        warnings
      };
    } catch (error: any) {
      logger.error('HTML validation error:', error);

      return {
        success: false,
        output: '',
        error: error.message || 'HTML validation failed',
        exitCode: 1,
        stdout: '',
        stderr: error.message
      };
    }
  }
}
