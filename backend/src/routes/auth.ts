import { Router } from 'express';
import { register, login, me, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';
import { registerSchema, loginSchema } from '@nexiums/shared';

const router = Router();

router.post(
  '/register',
  validate(z.object({ body: registerSchema })),
  register
);

router.post(
  '/login',
  validate(z.object({ body: loginSchema })),
  login
);

router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;
