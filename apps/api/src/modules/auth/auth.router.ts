import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginSchema, registerClinicSchema, refreshSchema } from './auth.schema';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  authController.login
);

router.post(
  '/refresh',
  authRateLimiter,
  authController.refresh
);

router.post(
  '/logout',
  authController.logout
);

router.post(
  '/register-clinic',
  authRateLimiter,
  validate({ body: registerClinicSchema }),
  authController.registerClinic
);

export const authRouter = router;
