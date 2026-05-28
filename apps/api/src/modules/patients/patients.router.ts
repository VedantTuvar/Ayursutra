import { Router } from 'express';
import { patientsController } from './patients.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantScope } from '../../middleware/tenantScope';
import { validate } from '../../middleware/validate';
import { registerPatientSchema, updatePatientSchema, saveAssessmentSchema } from './patients.schema';

const router = Router();

router.get(
  '/',
  authenticate,
  tenantScope,
  patientsController.listPatients
);

router.post(
  '/',
  authenticate,
  tenantScope,
  validate({ body: registerPatientSchema }),
  patientsController.registerPatient
);

router.get(
  '/:id',
  authenticate,
  tenantScope,
  patientsController.getPatientById
);

router.put(
  '/:id',
  authenticate,
  tenantScope,
  validate({ body: updatePatientSchema }),
  patientsController.updatePatient
);

router.post(
  '/:id/assessment',
  authenticate,
  tenantScope,
  validate({ body: saveAssessmentSchema }),
  patientsController.saveAssessment
);

router.get(
  '/:id/timeline',
  authenticate,
  tenantScope,
  patientsController.getPatientTimeline
);

router.get(
  '/:id/active-plan',
  authenticate,
  tenantScope,
  patientsController.getActivePlan
);

export const patientsRouter = router;
