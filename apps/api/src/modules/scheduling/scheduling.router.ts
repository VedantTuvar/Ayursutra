import { Router } from 'express';
import { schedulingController } from './scheduling.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantScope } from '../../middleware/tenantScope';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { bookSessionSchema, rescheduleSessionSchema } from './scheduling.schema';
import { UserRole } from '@prisma/client';

const router = Router();

// Calendar data query
router.get(
  '/schedule',
  authenticate,
  tenantScope,
  schedulingController.listSessions
);

// Booking operations
router.post(
  '/sessions',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST]),
  tenantScope,
  validate({ body: bookSessionSchema }),
  schedulingController.bookSession
);

router.put(
  '/sessions/:id',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST]),
  tenantScope,
  validate({ body: rescheduleSessionSchema }),
  schedulingController.rescheduleSession
);

router.delete(
  '/sessions/:id',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST]),
  tenantScope,
  schedulingController.cancelSession
);

export const schedulingRouter = router;
export const sessionsRouterOverride = router; // Reused or augmented in sessions
