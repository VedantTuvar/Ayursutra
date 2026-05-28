import { z } from 'zod';

export const addSkillSchema = z.object({
  therapyTypeId: z.string().uuid('Invalid therapy type ID supplied'),
  proficiencyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'EXPERT']).default('INTERMEDIATE')
});

export type AddSkillInput = z.infer<typeof addSkillSchema>;
