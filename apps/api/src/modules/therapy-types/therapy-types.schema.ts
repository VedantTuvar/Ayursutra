import { z } from 'zod';

export const createTherapyTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  nameHindi: z.string().optional(),
  category: z.enum(['POORVAKARMA', 'PRADHANKARMA', 'PASCHATKARMA']),
  defaultDurationMins: z.number().min(5).max(300).default(60),
  defaultOils: z.array(z.string()).default([]),
  description: z.string().optional(),
  contraindications: z.string().optional(),
  requiresTherapistCount: z.number().min(1).default(1),
  isActive: z.boolean().default(true)
});

export const updateTherapyTypeSchema = z.object({
  name: z.string().min(2).optional(),
  nameHindi: z.string().optional(),
  category: z.enum(['POORVAKARMA', 'PRADHANKARMA', 'PASCHATKARMA']).optional(),
  defaultDurationMins: z.number().min(5).max(300).optional(),
  defaultOils: z.array(z.string()).optional(),
  description: z.string().optional(),
  contraindications: z.string().optional(),
  requiresTherapistCount: z.number().min(1).optional(),
  isActive: z.boolean().optional()
});

export type CreateTherapyTypeInput = z.infer<typeof createTherapyTypeSchema>;
export type UpdateTherapyTypeInput = z.infer<typeof updateTherapyTypeSchema>;
