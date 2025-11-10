import { Router } from 'express';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  useTemplate
} from '../controllers/templateController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getTemplates);
router.get('/:id', getTemplate);

// Protected routes
router.use(authenticate);
router.post('/', createTemplate);
router.post('/:id/use', useTemplate);

export default router;
