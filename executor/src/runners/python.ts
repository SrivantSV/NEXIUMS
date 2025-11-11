import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { config } from '../config';
import { ResourceLimits } from '@nexiums/shared';

export class PythonRunner {
  private tempDir = path.join(__dirname, '../../temp');

  async execute(code: string, input?: any, limits?: ResourceLimits): Promise<any> {
    const startTime = Date.now();
    const executionId = uuidv4();
    const fileName = `script_${executionId}.py`;
    const filePath = path.join(this.tempDir, fileName);

    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      // Validate imports
      const imports = this.extractImports(code);
      const unauthorizedImports = imports.filter(
        imp => !config.allowedPythonLibraries.includes(imp)
      );

      if (unauthorizedImports.length > 0) {
        throw new Error(`Unauthorized imports: ${unauthorizedImports.join(', ')}`);
      }

      // Write code to file
      await fs.writeFile(filePath, code, 'utf-8');

      // Execute Python script
      const result = await this.executePythonScript(
        filePath,
        input,
        limits?.maxExecutionTime || 30
      );

      const duration = Date.now() - startTime;

      return {
        ...result,
        resourceUsage: {
          cpuTime: duration,
          memory: 0
        }
      };
    } catch (error: any) {
      logger.error('Python execution error:', error);

      return {
        success: false,
        output: '',
        error: error.message || 'Execution failed',
        exitCode: 1,
        stdout: '',
        stderr: error.message,
        resourceUsage: {
          cpuTime: Date.now() - startTime,
          memory: 0
        }
      };
    } finally {
      // Cleanup
      try {
        await fs.unlink(filePath);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  }

  private executePythonScript(
    filePath: string,
    input?: any,
    timeout: number = 30
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const process = spawn('python3', [filePath], {
        timeout: timeout * 1000
      });

      // Send input if provided
      if (input && input.stdin) {
        process.stdin.write(input.stdin);
        process.stdin.end();
      }

      process.stdout.on('data', (data) => {
        stdout += data.toString();

        // Prevent excessive output
        if (stdout.length > config.maxOutputSize) {
          process.kill();
          reject(new Error('Output size limit exceeded'));
        }
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          output: stdout,
          error: stderr || undefined,
          exitCode: code,
          stdout,
          stderr
        });
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  private extractImports(code: string): string[] {
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
}
