import { ChallanStatus } from '@prisma/client';
import { z } from 'zod';

const itemSchema = z.object({
  productId: z.string().uuid('Invalid product id'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

const uniqueProductItems = (items: Array<{ productId: string }>) => {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.productId)) return false;
    seen.add(item.productId);
  }
  return true;
};

export const challanIdParamsSchema = z.object({
  id: z.string().uuid('Invalid challan id'),
});

export const challanCreateSchema = z
  .object({
    customerId: z.string().uuid('Invalid customer id'),
    items: z.array(itemSchema).min(1, 'At least one item is required'),
  })
  .refine((value) => uniqueProductItems(value.items), {
    message: 'Duplicate productIds are not allowed',
    path: ['items'],
  });

export const challanUpdateSchema = z
  .object({
    customerId: z.string().uuid('Invalid customer id').optional(),
    items: z.array(itemSchema).min(1, 'At least one item is required').optional(),
  })
  .strict();

export const challanListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  customerId: z.string().uuid('Invalid customer id').optional(),
  status: z.nativeEnum(ChallanStatus).optional(),
  createdBy: z.string().uuid('Invalid user id').optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ChallanCreateInput = z.infer<typeof challanCreateSchema>;
export type ChallanUpdateInput = z.infer<typeof challanUpdateSchema>;
export type ChallanListQueryInput = z.infer<typeof challanListQuerySchema>;