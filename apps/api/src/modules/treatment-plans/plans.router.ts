import { Router } from 'express';
import { plansController } from './plans.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantScope } from '../../middleware/tenantScope';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createPlanSchema, updatePlanSchema } from './plans.schema';
import { UserRole } from '@prisma/client';

const router = Router({ mergeParams: true }); // Merge parameters from parent router (patientId)

router.get(
  '/',
  authenticate,
  tenantScope,
  plansController.listPlans
);

router.post(
  '/',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.DOCTOR]),
  tenantScope,
  validate({ body: createPlanSchema }),
  plansController.createPlan
);

router.get(
  '/:id',
  authenticate,
  tenantScope,
  plansController.getPlanById
);

router.put(
  '/:id',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.DOCTOR]),
  tenantScope,
  validate({ body: updatePlanSchema }),
  plansController.updatePlan
);

router.post(
  '/:id/activate',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.DOCTOR]),
  tenantScope,
  plansController.activatePlan
);

export const plansRouter = router;
