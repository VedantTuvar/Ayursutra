import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please supply a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const registerClinicSchema = z.object({
  clinicName: z.string().min(3, 'Clinic name must be at least 3 characters'),
  slug: z.string().min(3, 'Clinic slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'),
  adminName: z.string().min(2, 'Administrator name is required'),
  adminEmail: z.string().email('Please supply a valid admin email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required')
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterClinicInput = z.infer<typeof registerClinicSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
