import { Router } from 'express';
import {
  createShareLink,
  getSharedArtifact,
  deleteShareLink
} from '../controllers/shareController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';
import { createShareLinkSchema } from '@nexiums/shared';

const router = Router();

// Public route
router.get('/:shareCode', getSharedArtifact);

// Protected routes
router.use(authenticate);

router.post(
  '/',
  validate(z.object({ body: createShareLinkSchema })),
  createShareLink
);

router.delete('/:id', deleteShareLink);

export default router;
