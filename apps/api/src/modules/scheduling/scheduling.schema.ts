import { z } from 'zod';

export const bookSessionSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  plannedTherapyId: z.string().uuid().optional(),
  treatmentPlanId: z.string().uuid().optional(),
  therapistId: z.string().uuid().nullable().optional(),
  roomId: z.string().uuid().nullable().optional(),
  scheduledStart: z.string().transform((val) => new Date(val)),
  scheduledEnd: z.string().transform((val) => new Date(val)),
  notes: z.string().optional()
});

export const rescheduleSessionSchema = z.object({
  scheduledStart: z.string().transform((val) => new Date(val)),
  scheduledEnd: z.string().transform((val) => new Date(val)),
  therapistId: z.string().uuid().nullable().optional(),
  roomId: z.string().uuid().nullable().optional(),
  notes: z.string().optional()
});

export type BookSessionInput = z.infer<typeof bookSessionSchema>;
export type RescheduleSessionInput = z.infer<typeof rescheduleSessionSchema>;
