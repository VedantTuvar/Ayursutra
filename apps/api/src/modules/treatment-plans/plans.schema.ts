import { z } from 'zod';

const plannedTherapyInput = z.object({
  therapyTypeId: z.string().uuid('Invalid therapy type ID'),
  dayNumber: z.number().min(1, 'Day number must be at least 1'),
  sequenceOrder: z.number().min(1).default(1),
  durationMins: z.number().min(5).default(60),
  prescribedOils: z.array(
    z.object({
      name: z.string(),
      quantityMl: z.number().min(1)
    })
  ).optional(),
  notes: z.string().optional()
});

export const createPlanSchema = z.object({
  name: z.string().min(3, 'Plan name must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  dietInstructions: z.string().optional(),
  lifestyleNotes: z.string().optional(),
  totalDays: z.number().min(1).default(14),
  plannedTherapies: z.array(plannedTherapyInput).min(1, 'At least one planned therapy is required')
});

export const updatePlanSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  dietInstructions: z.string().optional(),
  lifestyleNotes: z.string().optional(),
  totalDays: z.number().min(1).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  plannedTherapies: z.array(plannedTherapyInput).optional()
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type PlannedTherapyInputType = z.infer<typeof plannedTherapyInput>;
