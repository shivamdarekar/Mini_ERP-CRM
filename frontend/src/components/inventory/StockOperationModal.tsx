import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { inventoryService } from '@/services/inventory.service';
import { productService } from '@/services/product.service';
import { QUERY_KEYS } from '@/utils/constants';
import { getErrorMessage, formatCurrency } from '@/utils/format';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  productId: z.string().min(1, 'Select a product'),
  quantity: z
    .string()
    .min(1, 'Quantity is required')
    .refine(v => Number.isInteger(Number(v)) && Number(v) > 0, 'Enter a positive whole number'),
  reason: z.string().min(1, 'Reason is required').max(300),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface StockOperationModalProps {
  open: boolean;
  type: 'IN' | 'OUT';
  preselectedProductId?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StockOperationModal({
  open,
  type,
  preselectedProductId,
  onClose,
  onSuccess,
}: StockOperationModalProps) {
  const queryClient = useQueryClient();
  // 'form' = filling details, 'confirm' = OUT confirmation step
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { productId: preselectedProductId ?? '', quantity: '', reason: '' },
  });

  // Reset form and step when modal opens/closes
  useEffect(() => {
    if (open) {
      reset({ productId: preselectedProductId ?? '', quantity: '', reason: '' });
      setStep('form');
      setPendingValues(null);
    }
  }, [open, preselectedProductId, reset]);

  // Load all active products for the select (backend limit max is 100)
  const { data: productsData } = useQuery({
    queryKey: [...QUERY_KEYS.products, { isActive: true, limit: 100 }],
    queryFn: () => productService.getProducts({ isActive: true, limit: 100 }),
    enabled: open,
  });

  const products = productsData?.data ?? [];
  const selectedProductId = watch('productId');
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const invalidateAll = (productId: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.product(productId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventoryProduct(productId) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movements });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lowStock });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
  };

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { productId: values.productId, quantity: Number(values.quantity), reason: values.reason };
      return type === 'IN' ? inventoryService.stockIn(payload) : inventoryService.stockOut(payload);
    },
    onSuccess: (result) => {
      invalidateAll(result.product.id);
      const msg = type === 'IN'
        ? `Stock increased by ${result.movement.quantity} units.`
        : `Stock reduced by ${result.movement.quantity} units.`;
      onSuccess(msg);
      onClose();
    },
    onError: (err) => {
      // Go back to form step so user can see the error
      setStep('form');
      setPendingValues(null);
      setError('root', { message: getErrorMessage(err) });
    },
  });

  // Stock IN: submit immediately. Stock OUT: advance to confirm step.
  const onSubmit = (values: FormValues) => {
    if (type === 'IN') {
      mutation.mutate(values);
    } else {
      setPendingValues(values);
      setStep('confirm');
    }
  };

  const handleConfirmOut = () => {
    if (pendingValues) mutation.mutate(pendingValues);
  };

  const handleClose = () => {
    reset();
    setStep('form');
    setPendingValues(null);
    onClose();
  };

  const isIN = type === 'IN';

  // ── Confirm step (OUT only) ───────────────────────────────────────────────
  if (step === 'confirm' && pendingValues) {
    const confirmProduct = products.find(p => p.id === pendingValues.productId);
    const newStock = confirmProduct
      ? confirmProduct.currentStock - Number(pendingValues.quantity)
      : null;

    return (
      <Modal open={open} onClose={handleClose} title="Confirm Stock OUT">
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
            <p className="text-sm font-semibold text-amber-800">Review before confirming</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-slate-500">Product</span>
              <span className="font-medium text-slate-800">{confirmProduct?.name ?? pendingValues.productId}</span>
              <span className="text-slate-500">Quantity OUT</span>
              <span className="font-semibold text-red-600">− {pendingValues.quantity} units</span>
              {newStock !== null && (
                <>
                  <span className="text-slate-500">Stock after</span>
                  <span className={`font-semibold ${newStock <= (confirmProduct?.minimumStock ?? 0) ? 'text-amber-600' : 'text-slate-800'}`}>
                    {newStock} units{newStock <= (confirmProduct?.minimumStock ?? 0) ? ' ⚠ Low' : ''}
                  </span>
                </>
              )}
              <span className="text-slate-500">Reason</span>
              <span className="text-slate-700">{pendingValues.reason}</span>
            </div>
          </div>

          {errors.root && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-xs text-red-700">{errors.root.message}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setStep('form'); setPendingValues(null); }}
              disabled={mutation.isPending}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={mutation.isPending}
              onClick={handleConfirmOut}
            >
              Confirm Stock OUT
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Form step ─────────────────────────────────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isIN ? 'Stock IN' : 'Stock OUT'}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {/* Product select */}
        <Select
          label="Product *"
          error={errors.productId?.message}
          {...register('productId')}
        >
          <option value="">Select a product...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.sku}
            </option>
          ))}
        </Select>

        {/* Current stock info */}
        {selectedProduct && (
          <div className={`rounded-lg px-3 py-2 text-xs font-medium flex items-center justify-between ${
            selectedProduct.currentStock <= selectedProduct.minimumStock
              ? 'bg-amber-50 border border-amber-200 text-amber-700'
              : 'bg-slate-50 border border-border text-slate-600'
          }`}>
            <span>Current stock: <strong>{selectedProduct.currentStock}</strong></span>
            <span>Min: {selectedProduct.minimumStock}</span>
            {!isIN && (
              <span>Price: {formatCurrency(selectedProduct.unitPrice)}</span>
            )}
          </div>
        )}

        {/* Quantity */}
        <Input
          label="Quantity *"
          type="number"
          min="1"
          placeholder="Enter quantity"
          error={errors.quantity?.message}
          {...register('quantity')}
        />

        {/* Reason */}
        <Textarea
          label="Reason *"
          placeholder={isIN ? 'e.g. Purchase received from supplier' : 'e.g. Damaged goods removed'}
          rows={2}
          error={errors.reason?.message}
          {...register('reason')}
        />

        {errors.root && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs text-red-700">{errors.root.message}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            variant={isIN ? 'primary' : 'danger'}
            loading={isSubmitting}
          >
            {isIN ? 'Stock IN' : 'Stock OUT'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
