import { StockMovementType } from '@prisma/client';
import { z } from 'zod';

const quantitySchema = z.number().int().positive('Quantity must be greater than 0');
const reasonSchema = z.string().trim().min(3, 'Reason is required').max(255);

export const inventoryProductIdParamsSchema = z.object({
  productId: z.string().uuid('Invalid product id'),
});

export const inventoryMovementIdParamsSchema = z.object({
  productId: z.string().uuid('Invalid product id').optional(),
});

export const stockInSchema = z.object({
  productId: z.string().uuid('Invalid product id'),
  quantity: quantitySchema,
  reason: reasonSchema,
});

export const stockOutSchema = z.object({
  productId: z.string().uuid('Invalid product id'),
  quantity: quantitySchema,
  reason: reasonSchema,
});

export const inventoryMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  productId: z.string().uuid('Invalid product id').optional(),
  type: z.nativeEnum(StockMovementType).optional(),
  createdBy: z.string().uuid('Invalid user id').optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const lowStockQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type StockInInput = z.infer<typeof stockInSchema>;
export type StockOutInput = z.infer<typeof stockOutSchema>;
export type InventoryMovementsQueryInput = z.infer<typeof inventoryMovementsQuerySchema>;
export type LowStockQueryInput = z.infer<typeof lowStockQuerySchema>;