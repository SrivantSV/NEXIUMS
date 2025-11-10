import { logger } from '../utils/logger';
import { JavaScriptRunner } from '../runners/javascript';
import { PythonRunner } from '../runners/python';
import { HTMLRunner } from '../runners/html';
import { ReactRunner } from '../runners/react';
import { defaultResourceLimits } from '@nexiums/shared';

export class ExecutionOrchestrator {
  private runners: Map<string, any> = new Map();

  constructor() {
    // Initialize runners
    this.runners.set('javascript', new JavaScriptRunner());
    this.runners.set('typescript', new JavaScriptRunner());
    this.runners.set('python', new PythonRunner());
    this.runners.set('html', new HTMLRunner());
    this.runners.set('react-component', new ReactRunner());
    this.runners.set('node-script', new JavaScriptRunner());
    this.runners.set('python-script', new PythonRunner());
  }

  async execute(executionId: string, artifact: any, input?: any): Promise<any> {
    const startTime = Date.now();

    try {
      // Get appropriate runner
      const runner = this.getRunner(artifact.type, artifact.language);

      if (!runner) {
        throw new Error(`No runner available for type: ${artifact.type}, language: ${artifact.language}`);
      }

      // Get resource limits
      const limits = artifact.metadata?.resourceLimits || defaultResourceLimits;

      logger.info(`Executing with runner ${artifact.type}/${artifact.language}`);

      // Execute
      const result = await runner.execute(artifact.content, input, limits);

      const duration = Date.now() - startTime;

      return {
        executionId,
        status: result.success ? 'success' : 'error',
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        duration,
        resourceUsage: result.resourceUsage || {}
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error(`Execution ${executionId} failed:`, error);

      return {
        executionId,
        status: 'error',
        error: error.message,
        duration
      };
    }
  }

  private getRunner(type: string, language: string): any {
    // Try type-specific runner first
    if (this.runners.has(type)) {
      return this.runners.get(type);
    }

    // Fall back to language runner
    if (this.runners.has(language)) {
      return this.runners.get(language);
    }

    return null;
  }
}
