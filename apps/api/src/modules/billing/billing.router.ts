import { Router } from 'express';
import { billingController } from './billing.controller';
import { authenticate } from '../../middleware/authenticate';
import { tenantScope } from '../../middleware/tenantScope';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { generateInvoiceSchema, updateInvoiceSchema, recordPaymentSchema } from './billing.schema';
import { UserRole } from '@prisma/client';

const router = Router();

// General invoice queries
router.get(
  '/',
  authenticate,
  tenantScope,
  billingController.listInvoices
);

// Auto generate invoice
router.post(
  '/generate',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST]),
  tenantScope,
  validate({ body: generateInvoiceSchema }),
  billingController.generateInvoice
);

// Payment registries
router.post(
  '/payments',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST]),
  tenantScope,
  validate({ body: recordPaymentSchema }),
  billingController.recordPayment
);

// Invoice operations
router.get(
  '/:id',
  authenticate,
  tenantScope,
  billingController.getInvoiceById
);

router.put(
  '/:id',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST]),
  tenantScope,
  validate({ body: updateInvoiceSchema }),
  billingController.updateInvoice
);

router.post(
  '/:id/issue',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST]),
  tenantScope,
  billingController.issueInvoice
);

router.get(
  '/:id/pdf',
  authenticate,
  tenantScope,
  billingController.downloadInvoicePDF
);

router.post(
  '/:id/payments',
  authenticate,
  authorize([UserRole.CLINIC_ADMIN, UserRole.RECEPTIONIST]),
  tenantScope,
  validate({ body: recordPaymentSchema }),
  billingController.recordPayment
);

export const billingRouter = router;
export const paymentsRouterOverride = router;
