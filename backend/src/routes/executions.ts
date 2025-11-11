import { Router } from 'express';
import {
  getExecutions,
  getExecution,
  cancelExecution
} from '../controllers/executionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getExecutions);
router.get('/:id', getExecution);
router.post('/:id/cancel', cancelExecution);

export default router;
