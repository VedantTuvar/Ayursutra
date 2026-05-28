import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters'),
  capacity: z.number().min(1, 'Room capacity must be at least 1').default(1),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
});

export const updateRoomSchema = z.object({
  name: z.string().min(2).optional(),
  capacity: z.number().min(1).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
