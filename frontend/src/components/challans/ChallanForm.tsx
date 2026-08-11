import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { productService } from '@/services/product.service';
import { QUERY_KEYS } from '@/utils/constants';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/utils/format';
import type { Customer, Product } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChallanLineItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface ChallanFormState {
  customerId: string;
  items: ChallanLineItem[];
}

interface ChallanFormProps {
  initialState?: Partial<ChallanFormState>;
  onSubmit: (state: ChallanFormState) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  submitting?: boolean;
  serverError?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChallanForm({
  initialState,
  onSubmit,
  onCancel,
  submitLabel,
  submitting = false,
  serverError,
}: ChallanFormProps) {
  const [customerId, setCustomerId] = useState(initialState?.customerId ?? '');
  const [items, setItems] = useState<ChallanLineItem[]>(initialState?.items ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerSearch, setCustomerSearch] = useState('');

  // Load customers (backend limit max is 100)
  const { data: customersData } = useQuery({
    queryKey: [...QUERY_KEYS.customers, { limit: 100, status: 'ACTIVE' }],
    queryFn: () => customerService.getCustomers({ limit: 100, status: 'ACTIVE' }),
  });

  // Load active products (backend limit max is 100)
  const { data: productsData } = useQuery({
    queryKey: [...QUERY_KEYS.products, { limit: 100, isActive: true }],
    queryFn: () => productService.getProducts({ limit: 100, isActive: true }),
  });

  const customers = customersData?.data ?? [];
  const products = productsData?.data ?? [];
  const selectedCustomer = customers.find(c => c.id === customerId);
  const addedProductIds = new Set(items.map(i => i.productId));

  // ── Item operations ───────────────────────────────────────────────────────

  const addItem = useCallback(() => {
    // Find first product not already added
    const available = products.find(p => !addedProductIds.has(p.id));
    if (!available) return;
    setItems(prev => [...prev, { productId: available.id, product: available, quantity: 1 }]);
    setErrors(prev => { const n = { ...prev }; delete n.items; return n; });
  }, [products, addedProductIds]);

  const removeItem = useCallback((idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const changeProduct = useCallback((idx: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    // Duplicate check
    if (items.some((item, i) => i !== idx && item.productId === productId)) {
      setErrors(prev => ({ ...prev, [`item_${idx}_product`]: 'This product is already added.' }));
      return;
    }
    setErrors(prev => { const n = { ...prev }; delete n[`item_${idx}_product`]; return n; });
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, productId, product, quantity: 1 } : item));
  }, [products, items]);

  const changeQty = useCallback((idx: number, raw: string) => {
    const qty = parseInt(raw, 10);
    const key = `item_${idx}_qty`;
    if (!raw || isNaN(qty) || qty <= 0) {
      setErrors(prev => ({ ...prev, [key]: 'Enter a positive whole number.' }));
    } else {
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: isNaN(qty) ? 0 : qty } : item));
  }, []);

  // ── Totals ────────────────────────────────────────────────────────────────

  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const totalAmount = items.reduce((s, i) => {
    const price = parseFloat(i.product.unitPrice) || 0;
    return s + price * (i.quantity || 0);
  }, 0);

  // ── Validate & submit ─────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!customerId) newErrors.customerId = 'Please select a customer.';
    if (items.length === 0) newErrors.items = 'Add at least one product.';
    items.forEach((item, idx) => {
      if (!item.productId) newErrors[`item_${idx}_product`] = 'Select a product.';
      if (!item.quantity || item.quantity <= 0) newErrors[`item_${idx}_qty`] = 'Enter a valid quantity.';
    });
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    await onSubmit({ customerId, items });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Customer */}
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mb-4 pb-1.5 border-b border-slate-100">
          Select Customer Record
        </h3>
        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            placeholder="Search active customers..."
            value={customerSearch}
            onChange={e => setCustomerSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          <Select
            value={customerId}
            onChange={e => { setCustomerId(e.target.value); setErrors(prev => { const n = { ...prev }; delete n.customerId; return n; }); }}
            error={errors.customerId}
          >
            <option value="">Select customer...</option>
            {customers
              .filter(c => !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.businessName.toLowerCase().includes(customerSearch.toLowerCase()))
              .map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.businessName}
                </option>
              ))}
          </Select>
          {selectedCustomer && <CustomerCard customer={selectedCustomer} />}
        </div>
      </section>

      {/* Products */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-100">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">
            Sales Itemised Products
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={products.length === 0 || addedProductIds.size >= products.length}
            className="rounded-lg h-8 text-xs font-bold"
            leftIcon={
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }
          >
            Add Product
          </Button>
        </div>

        {errors.items && (
          <p className="text-xs text-rose-600 font-bold mb-3">{errors.items}</p>
        )}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 py-10 text-center">
            <p className="text-sm text-slate-400 font-semibold">No products added to this challan yet.</p>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">Click "Add Product" above to compile the list.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/60 overflow-hidden shadow-premium bg-white">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60 border-b border-slate-100">
                  <tr>
                    {['Product', 'Available', 'Unit Price', 'Qty', 'Line Total', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const lineTotal = parseFloat(item.product.unitPrice) * (item.quantity || 0);
                    const overStock = item.quantity > item.product.currentStock;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-5 py-3 min-w-[220px]">
                          <Select
                            value={item.productId}
                            onChange={e => changeProduct(idx, e.target.value)}
                            error={errors[`item_${idx}_product`]}
                            className="text-xs"
                          >
                            {products.map(p => (
                              <option
                                key={p.id}
                                value={p.id}
                                disabled={addedProductIds.has(p.id) && p.id !== item.productId}
                              >
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`text-xs font-bold ${item.product.currentStock <= item.product.minimumStock ? 'text-rose-600' : 'text-slate-500'}`}>
                            {item.product.currentStock} units
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-slate-800 font-bold">
                          {formatCurrency(item.product.unitPrice)}
                        </td>
                        <td className="px-5 py-3 min-w-[120px]">
                          <div className="flex flex-col gap-1">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity || ''}
                              onChange={e => changeQty(idx, e.target.value)}
                              className={`w-20 rounded-xl border px-3 py-1.5 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                                errors[`item_${idx}_qty`] ? 'border-red-400 focus:ring-red-500/10' : 'border-slate-200'
                              }`}
                            />
                            {errors[`item_${idx}_qty`] && (
                              <p className="text-[10px] text-rose-600 font-bold mt-1">{errors[`item_${idx}_qty`]}</p>
                            )}
                            {overStock && !errors[`item_${idx}_qty`] && (
                              <p className="text-[10px] text-amber-600 font-bold mt-1">⚠ Exceeds stock</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 transition-all duration-200 cursor-pointer"
                            aria-label="Remove"
                          >
                            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {items.map((item, idx) => {
                const lineTotal = parseFloat(item.product.unitPrice) * (item.quantity || 0);
                const overStock = item.quantity > item.product.currentStock;
                return (
                  <div key={idx} className="p-5 bg-white">
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <Select
                        value={item.productId}
                        onChange={e => changeProduct(idx, e.target.value)}
                        error={errors[`item_${idx}_product`]}
                        className="flex-1 text-xs"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={addedProductIds.has(p.id) && p.id !== item.productId}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </Select>
                      <button type="button" onClick={() => removeItem(idx)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 transition-colors">
                        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-450 font-semibold mb-3">
                      <span>Available: <strong className={overStock ? 'text-amber-600' : 'text-slate-650'}>{item.product.currentStock}</strong></span>
                      <span>Price: <strong>{formatCurrency(item.product.unitPrice)}</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || ''}
                          onChange={e => changeQty(idx, e.target.value)}
                          className={`w-20 rounded-xl border px-3 py-1.5 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${errors[`item_${idx}_qty`] ? 'border-red-400' : 'border-slate-200'}`}
                        />
                        {errors[`item_${idx}_qty`] && <p className="text-[10px] text-rose-600 font-bold">{errors[`item_${idx}_qty`]}</p>}
                        {overStock && !errors[`item_${idx}_qty`] && <p className="text-[10px] text-amber-600 font-bold">⚠ Exceeds stock</p>}
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Line Total</p>
                        <p className="font-extrabold text-slate-800 mt-1">{formatCurrency(lineTotal)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Summary */}
      {items.length > 0 && (
        <div className="rounded-2xl border border-slate-200/60 bg-slate-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Total Products: <span className="text-slate-800 ml-1 font-extrabold">{items.length}</span></span>
            <span>Total Qty: <span className="text-slate-800 ml-1 font-extrabold">{totalQty}</span></span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center justify-end">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Total Amount</p>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {serverError && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
          <p className="text-xs text-rose-700 font-bold leading-relaxed">{serverError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="button" loading={submitting} onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── Customer info card ───────────────────────────────────────────────────────

function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 px-4.5 py-3.5 shadow-sm mt-1 animate-fadeIn">
      <p className="text-sm font-bold text-slate-900">{customer.name}</p>
      <p className="text-xs text-slate-600 font-semibold mt-0.5">{customer.businessName}</p>
      <p className="text-xs text-slate-455 font-medium mt-1">{customer.mobile} &middot; {customer.email}</p>
    </div>
  );
}

