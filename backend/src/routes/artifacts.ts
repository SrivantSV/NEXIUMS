import { Router } from 'express';
import {
  createArtifact,
  getArtifacts,
  getArtifact,
  updateArtifact,
  deleteArtifact,
  executeArtifact,
  getArtifactVersions,
  revertArtifactVersion
} from '../controllers/artifactController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { executionRateLimiter } from '../middleware/rateLimiter';
import { z } from 'zod';
import { createArtifactSchema, updateArtifactSchema, executeArtifactSchema } from '@nexiums/shared';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  validate(z.object({ body: createArtifactSchema })),
  createArtifact
);

router.get('/', getArtifacts);
router.get('/:id', getArtifact);

router.put(
  '/:id',
  validate(z.object({
    body: updateArtifactSchema,
    params: z.object({ id: z.string() })
  })),
  updateArtifact
);

router.delete('/:id', deleteArtifact);

router.post(
  '/:id/execute',
  executionRateLimiter,
  validate(z.object({
    body: executeArtifactSchema,
    params: z.object({ id: z.string() })
  })),
  executeArtifact
);

router.get('/:id/versions', getArtifactVersions);
router.post('/:id/versions/:versionId/revert', revertArtifactVersion);

export default router;
