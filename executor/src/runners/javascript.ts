import { VM } from 'vm2';
import { logger } from '../utils/logger';
import { config } from '../config';
import { ResourceLimits } from '@nexiums/shared';

export class JavaScriptRunner {
  async execute(code: string, input?: any, limits?: ResourceLimits): Promise<any> {
    const startTime = Date.now();
    let output: string[] = [];
    let errors: string[] = [];

    try {
      // Create sandbox
      const vm = new VM({
        timeout: limits?.maxExecutionTime ? limits.maxExecutionTime * 1000 : config.maxExecutionTime,
        sandbox: {
          console: {
            log: (...args: any[]) => {
              const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' ');
              output.push(message);
            },
            error: (...args: any[]) => {
              const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' ');
              errors.push(message);
            },
            warn: (...args: any[]) => {
              const message = '[WARN] ' + args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' ');
              output.push(message);
            },
            info: (...args: any[]) => {
              const message = '[INFO] ' + args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
              ).join(' ');
              output.push(message);
            }
          },
          require: (module: string) => {
            if (config.allowedNodeModules.includes(module)) {
              return require(module);
            }
            throw new Error(`Module '${module}' is not allowed`);
          },
          input: input || {},
          process: {
            env: {},
            version: process.version,
            platform: 'sandbox'
          },
          setTimeout: setTimeout,
          setInterval: setInterval,
          clearTimeout: clearTimeout,
          clearInterval: clearInterval,
          Math: Math,
          Date: Date,
          JSON: JSON
        }
      });

      // Execute code
      const result = vm.run(code);

      const duration = Date.now() - startTime;

      // If code returns a value, add it to output
      if (result !== undefined) {
        output.push(typeof result === 'object' ? JSON.stringify(result) : String(result));
      }

      return {
        success: errors.length === 0,
        output: output.join('\n'),
        error: errors.length > 0 ? errors.join('\n') : undefined,
        exitCode: errors.length > 0 ? 1 : 0,
        stdout: output.join('\n'),
        stderr: errors.join('\n'),
        resourceUsage: {
          cpuTime: duration,
          memory: 0
        }
      };
    } catch (error: any) {
      logger.error('JavaScript execution error:', error);

      return {
        success: false,
        output: output.join('\n'),
        error: error.message || 'Execution failed',
        exitCode: 1,
        stdout: output.join('\n'),
        stderr: error.message,
        resourceUsage: {
          cpuTime: Date.now() - startTime,
          memory: 0
        }
      };
    }
  }
}
