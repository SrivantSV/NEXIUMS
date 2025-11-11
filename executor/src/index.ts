import express from 'express';
import { logger } from './utils/logger';
import { config } from './config';
import { executeArtifact } from './controllers/executionController';

const app = express();

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Execute endpoint
app.post('/execute', executeArtifact);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Execution error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: err.message || 'Execution failed'
    }
  });
});

const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Executor service running on port ${PORT}`);
});

export default app;
