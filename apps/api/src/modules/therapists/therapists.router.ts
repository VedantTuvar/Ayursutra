import { Router } from 'express';
import { therapistsController } from './therapists.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantScope } from '../../middleware/tenantScope';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { addSkillSchema } from './therapists.schema';
import { UserRole } from '@prisma/client';

const router = Router();

router.get(
  '/',
  authenticate,
  tenantScope,
  therapistsController.listTherapists
);

router.get(
  '/available',
  authenticate,
  tenantScope,
  therapistsController.getAvailableTherapists
);

router.get(
  '/:id/schedule',
  authenticate,
  tenantScope,
  therapistsController.getTherapistSchedule
);

router.post(
  '/:id/skills',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.DOCTOR]),
  tenantScope,
  validate({ body: addSkillSchema }),
  therapistsController.addSkill
);

router.delete(
  '/:id/skills/:therapyTypeId',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.DOCTOR]),
  tenantScope,
  therapistsController.removeSkill
);

export const therapistsRouter = router;
