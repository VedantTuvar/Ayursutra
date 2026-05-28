import { Router } from 'express';
import { sessionsController } from './sessions.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantScope } from '../../middleware/tenantScope';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { sessionNotesSchema } from './sessions.schema';
import { UserRole } from '@prisma/client';

const router = Router();

// Therapist operations
router.get(
  '/my',
  authenticate,
  authorize([UserRole.THERAPIST, UserRole.CLINIC_ADMIN]),
  tenantScope,
  sessionsController.getTherapistSessionsToday
);

router.get(
  '/:id',
  authenticate,
  tenantScope,
  sessionsController.getSessionById
);

router.post(
  '/:id/start',
  authenticate,
  authorize([UserRole.THERAPIST, UserRole.CLINIC_ADMIN]),
  tenantScope,
  sessionsController.startSession
);

router.post(
  '/:id/complete',
  authenticate,
  authorize([UserRole.THERAPIST, UserRole.CLINIC_ADMIN]),
  tenantScope,
  validate({ body: sessionNotesSchema }),
  sessionsController.recordNotesAndComplete
);

router.post(
  '/:id/notes',
  authenticate,
  authorize([UserRole.THERAPIST, UserRole.CLINIC_ADMIN]),
  tenantScope,
  validate({ body: sessionNotesSchema }),
  sessionsController.recordNotesAndComplete
);

export const sessionsRouter = router;
