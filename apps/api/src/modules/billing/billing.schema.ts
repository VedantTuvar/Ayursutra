import { z } from 'zod';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export const generateInvoiceSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  discountAmount: z.number().nonnegative().default(0)
});

export const updateInvoiceSchema = z.object({
  discountAmount: z.number().nonnegative().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  notes: z.string().optional()
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  reference: z.string().optional(),
  notes: z.string().optional()
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
