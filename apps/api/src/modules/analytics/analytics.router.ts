import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantScope } from '../../middleware/tenantScope';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '@prisma/client';

const router = Router();

// Only clinic administrators or managers have routing permissions to view overview analytics
router.get(
  '/overview',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  analyticsController.getOverview
);

router.get(
  '/revenue',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  analyticsController.getRevenueTrend
);

router.get(
  '/therapy-breakdown',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  analyticsController.getTherapyBreakdown
);

router.get(
  '/therapist-utilization',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  analyticsController.getTherapistUtilization
);

router.get(
  '/patient-stats',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  analyticsController.getPatientStats
);

router.get(
  '/inventory-usage',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]),
  tenantScope,
  analyticsController.getInventoryUsage
);

export const analyticsRouter = router;
