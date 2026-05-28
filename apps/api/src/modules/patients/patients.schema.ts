import { z } from 'zod';

export const registerPatientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please supply a valid email address'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  medicalHistory: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  emergencyContact: z.object({
    name: z.string().min(1, 'Emergency contact name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phone: z.string().min(1, 'Emergency phone number is required')
  }).optional()
});

export const updatePatientSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  medicalHistory: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string()
  }).optional()
});

export const saveAssessmentSchema = z.object({
  prakriti: z.object({
    vata: z.number().min(0).max(100),
    pitta: z.number().min(0).max(100),
    kapha: z.number().min(0).max(100),
    dominance: z.string()
  }).optional(),
  vikriti: z.object({
    vata: z.number().min(0).max(100),
    pitta: z.number().min(0).max(100),
    kapha: z.number().min(0).max(100),
    dominance: z.string()
  }).optional()
});

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type SaveAssessmentInput = z.infer<typeof saveAssessmentSchema>;
