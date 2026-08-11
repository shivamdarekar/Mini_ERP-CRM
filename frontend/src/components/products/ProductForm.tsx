import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Product name is required').max(150),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50)
    .regex(/^[A-Za-z0-9\-_]+$/, 'SKU can only contain letters, numbers, hyphens and underscores'),
  category: z.string().min(1, 'Category is required').max(100),
  unitPrice: z
    .string()
    .min(1, 'Unit price is required')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Enter a valid price'),
  minimumStock: z
    .string()
    .min(1, 'Minimum stock is required')
    .refine(v => Number.isInteger(Number(v)) && Number(v) >= 0, 'Enter a valid whole number'),
  warehouseLocation: z.string().min(1, 'Warehouse location is required').max(100),
  isActive: z.boolean().optional(),
});

export type ProductFormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  serverError?: string;
  isEdit?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  serverError,
  isEdit = false,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {/* Product Information */}
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-4 pb-1.5 border-b border-slate-100">
          Product Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Product name *"
              placeholder="Dell Monitor 24 inch"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>
          <Input
            label="SKU *"
            placeholder="MON-001"
            error={errors.sku?.message}
            {...register('sku')}
          />
          <Input
            label="Category *"
            placeholder="Electronics"
            error={errors.category?.message}
            {...register('category')}
          />
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-4 pb-1.5 border-b border-slate-100">
          Pricing Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Unit price (₹) *"
            placeholder="8500.00"
            error={errors.unitPrice?.message}
            leftAddon={<span className="text-xs font-semibold">₹</span>}
            {...register('unitPrice')}
          />
        </div>
      </section>

      {/* Inventory Settings */}
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-4 pb-1.5 border-b border-slate-100">
          Inventory Control Thresholds
        </h3>
        {!isEdit && (
          <p className="text-xs text-blue-700 mb-4 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5 font-semibold leading-relaxed">
            Initial stock starts at 0. Use <strong>Inventory → Stock IN</strong> to add opening stock.
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Minimum stock *"
            placeholder="5"
            type="number"
            min="0"
            error={errors.minimumStock?.message}
            {...register('minimumStock')}
          />
          <Input
            label="Warehouse location *"
            placeholder="A-01"
            error={errors.warehouseLocation?.message}
            {...register('warehouseLocation')}
          />
        </div>
      </section>

      {/* Status — edit only */}
      {isEdit && (
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-4 pb-1.5 border-b border-slate-100">
            Activation Status
          </h3>
          <label className="flex items-center gap-3 cursor-pointer w-fit select-none">
            <input
              type="checkbox"
              className="h-4.5 w-4.5 rounded-lg border-slate-300 text-primary-600 focus:ring-primary-500/30 checked:bg-primary-600 transition-all duration-200"
              {...register('isActive')}
            />
            <span className="text-sm text-slate-700 font-bold">Product is active</span>
          </label>
        </section>
      )}


      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
          <p className="text-xs text-red-700">{serverError}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function productToFormValues(p: Product): ProductFormValues {
  return {
    name: p.name,
    sku: p.sku,
    category: p.category,
    unitPrice: p.unitPrice,
    minimumStock: String(p.minimumStock),
    warehouseLocation: p.warehouseLocation,
    isActive: p.isActive,
  };
}

export function toProductCreatePayload(v: ProductFormValues): CreateProductPayload {
  return {
    name: v.name,
    sku: v.sku,
    category: v.category,
    unitPrice: v.unitPrice,
    currentStock: 0,
    minimumStock: Number(v.minimumStock),
    warehouseLocation: v.warehouseLocation,
    isActive: v.isActive ?? true,
  };
}

export function toProductUpdatePayload(v: ProductFormValues): UpdateProductPayload {
  return {
    name: v.name,
    sku: v.sku,
    category: v.category,
    unitPrice: v.unitPrice,
    minimumStock: Number(v.minimumStock),
    warehouseLocation: v.warehouseLocation,
    isActive: v.isActive ?? true,
  };
}
