import { z } from 'zod';
import { InventoryCategory } from '@prisma/client';

export const createInventoryItemSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  nameHindi: z.string().optional(),
  category: z.nativeEnum(InventoryCategory).default(InventoryCategory.OIL),
  unit: z.string().default('ml'),
  currentStock: z.number().nonnegative().default(0),
  minimumThreshold: z.number().nonnegative().default(100),
  unitCost: z.number().positive().optional(),
  supplier: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional().transform((val) => val ? new Date(val) : undefined)
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(2).optional(),
  nameHindi: z.string().optional(),
  category: z.nativeEnum(InventoryCategory).optional(),
  unit: z.string().optional(),
  currentStock: z.number().nonnegative().optional(),
  minimumThreshold: z.number().nonnegative().optional(),
  unitCost: z.number().positive().optional(),
  supplier: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  isActive: z.boolean().optional()
});

export const stockInSchema = z.object({
  quantity: z.number().positive('Quantity must be greater than 0'),
  notes: z.string().optional()
});

export const consumeSchema = z.object({
  quantity: z.number().positive('Quantity must be greater than 0'),
  sessionId: z.string().uuid('Invalid session ID').optional(),
  notes: z.string().optional()
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type StockInInput = z.infer<typeof stockInSchema>;
export type ConsumeInput = z.infer<typeof consumeSchema>;
