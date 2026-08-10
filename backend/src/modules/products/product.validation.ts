import { z } from 'zod';

const positiveText = (minMessage: string, maxLength: number) =>
  z.string().trim().min(1, minMessage).max(maxLength);

const moneySchema = z
  .union([z.string(), z.number()])
  .refine((value) => Number(value) >= 0, { message: 'Unit price must be greater than or equal to 0' })
  .transform((value) => value.toString());

const optionalBooleanQuerySchema = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const productIdParamsSchema = z.object({
  id: z.string().uuid('Invalid product id'),
});

export const productCreateSchema = z
  .object({
    name: positiveText('Product name is required', 150),
    sku: positiveText('SKU is required', 60),
    category: positiveText('Category is required', 100),
    unitPrice: moneySchema,
    currentStock: z.coerce.number().int().min(0).default(0),
    minimumStock: z.coerce.number().int().min(0),
    warehouseLocation: positiveText('Warehouse location is required', 150),
    isActive: z.coerce.boolean().optional().default(true),
  })
  .strict();

export const productUpdateSchema = z
  .object({
    name: positiveText('Product name is required', 150).optional(),
    sku: positiveText('SKU is required', 60).optional(),
    category: positiveText('Category is required', 100).optional(),
    unitPrice: moneySchema.optional(),
    minimumStock: z.coerce.number().int().min(0).optional(),
    warehouseLocation: positiveText('Warehouse location is required', 150).optional(),
    isActive: z.coerce.boolean().optional(),
  })
  .strict();

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  isActive: optionalBooleanQuerySchema.optional(),
  lowStock: optionalBooleanQuerySchema.optional(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductListQueryInput = z.infer<typeof productListQuerySchema>;