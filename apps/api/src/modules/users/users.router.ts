import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { tenantScope } from '../../middleware/tenantScope';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema, updateMeSchema } from './users.schema';
import { UserRole } from '@prisma/client';

const router = Router();

// Profile routes (Any authenticated staff)
router.get('/me', authenticate, tenantScope, usersController.getMe);
router.put('/me', authenticate, tenantScope, validate({ body: updateMeSchema }), usersController.updateMe);

// Admin-only staff management routes
router.get(
  '/',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  usersController.listUsers
);

router.post(
  '/',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  validate({ body: createUserSchema }),
  usersController.createUser
);

router.get(
  '/:id',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  usersController.getUserById
);

router.put(
  '/:id',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  validate({ body: updateUserSchema }),
  usersController.updateUser
);

router.delete(
  '/:id',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  usersController.deleteUser
);

export const usersRouter = router;
