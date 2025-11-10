import { redis } from '../utils/redis';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import axios from 'axios';
import { config } from '../config';

class ExecutionService {
  private readonly QUEUE_KEY = 'execution:queue';
  private readonly PROCESSING_KEY = 'execution:processing';
  private isProcessing = false;

  async queueExecution(
    executionId: string,
    artifact: any,
    input?: any
  ): Promise<void> {
    try {
      // Add to queue
      await redis.lpush(
        this.QUEUE_KEY,
        JSON.stringify({
          executionId,
          artifact,
          input,
          queuedAt: new Date().toISOString()
        })
      );

      logger.info(`Execution ${executionId} queued`);

      // Start processing if not already
      if (!this.isProcessing) {
        this.processQueue();
      }
    } catch (error) {
      logger.error('Failed to queue execution:', error);
      throw error;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (true) {
      try {
        // Get next execution from queue
        const item = await redis.rpop(this.QUEUE_KEY);
        if (!item) {
          // Queue is empty
          break;
        }

        const { executionId, artifact, input } = JSON.parse(item);

        // Mark as processing
        await redis.sadd(this.PROCESSING_KEY, executionId);

        // Update status
        await prisma.execution.update({
          where: { id: executionId },
          data: { status: 'RUNNING' }
        });

        // Execute
        await this.executeArtifact(executionId, artifact, input);

        // Remove from processing
        await redis.srem(this.PROCESSING_KEY, executionId);
      } catch (error) {
        logger.error('Error processing queue:', error);
        // Continue processing other items
      }
    }

    this.isProcessing = false;
  }

  private async executeArtifact(
    executionId: string,
    artifact: any,
    input?: any
  ): Promise<void> {
    try {
      logger.info(`Executing artifact ${artifact.id} (execution ${executionId})`);

      // Call executor service
      const response = await axios.post(
        `${config.executorUrl}/execute`,
        {
          executionId,
          artifact: {
            type: artifact.type,
            language: artifact.language,
            content: artifact.content,
            metadata: artifact.metadata
          },
          input
        },
        {
          timeout: (artifact.metadata?.resourceLimits?.maxExecutionTime || 30) * 1000
        }
      );

      const result = response.data.data;

      // Update execution with result
      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: result.status === 'success' ? 'COMPLETED' : 'FAILED',
          output: result.output,
          error: result.error,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          duration: result.duration,
          resourceUsage: result.resourceUsage,
          completedAt: new Date()
        }
      });

      logger.info(`Execution ${executionId} completed`);
    } catch (error: any) {
      logger.error(`Execution ${executionId} failed:`, error);

      let errorMessage = 'Execution failed';
      let status = 'FAILED';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Execution timeout';
        status = 'TIMEOUT';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error.message || errorMessage;
      }

      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status,
          error: errorMessage,
          completedAt: new Date()
        }
      });
    }
  }

  async getQueueLength(): Promise<number> {
    return await redis.llen(this.QUEUE_KEY);
  }

  async getProcessingCount(): Promise<number> {
    return await redis.scard(this.PROCESSING_KEY);
  }
}

export const executionService = new ExecutionService();
