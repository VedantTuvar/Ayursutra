import { z } from 'zod';

export const sessionNotesSchema = z.object({
  oilsUsed: z.array(
    z.object({
      name: z.string(),
      quantityMl: z.number().min(0),
      unit: z.string().default('ml')
    })
  ).default([]),
  patientResponse: z.string().optional(),
  observations: z.string().optional(),
  followUpInstructions: z.string().optional(),
  vitals: z.object({
    bp: z.string().optional(),
    pulse: z.number().optional(),
    temp: z.number().optional()
  }).optional()
});

export type SessionNotesInput = z.infer<typeof sessionNotesSchema>;
