import { Router } from 'express';
import { therapyTypesController } from './therapy-types.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantScope } from '../../middleware/tenantScope';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createTherapyTypeSchema, updateTherapyTypeSchema } from './therapy-types.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.get(
  '/',
  authenticate,
  tenantScope,
  therapyTypesController.listTherapyTypes
);

router.post(
  '/',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.DOCTOR]),
  tenantScope,
  validate({ body: createTherapyTypeSchema }),
  therapyTypesController.createTherapyType
);

router.put(
  '/:id',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.DOCTOR]),
  tenantScope,
  validate({ body: updateTherapyTypeSchema }),
  therapyTypesController.updateTherapyType
);

export const therapyTypesRouter = router;
