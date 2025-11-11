import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ExecutionOrchestrator } from '../sandbox/orchestrator';

const orchestrator = new ExecutionOrchestrator();

export const executeArtifact = async (req: Request, res: Response) => {
  try {
    const { executionId, artifact, input } = req.body;

    logger.info(`Starting execution ${executionId} for artifact ${artifact.type}`);

    const result = await orchestrator.execute(executionId, artifact, input);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Execution failed:', error);

    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Execution failed',
        code: error.code
      }
    });
  }
};
