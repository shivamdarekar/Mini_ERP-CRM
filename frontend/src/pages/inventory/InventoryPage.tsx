import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { inventoryService } from '@/services/inventory.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useRole } from '@/hooks/useRole';
import { useDebounce } from '@/hooks/useDebounce';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAppToast } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { MovementTypeBadge } from '@/components/ui/Badge';
import { StockStatusBadge } from '@/components/inventory/StockStatusBadge';
import { StockOperationModal } from '@/components/inventory/StockOperationModal';
import { formatDateTime, formatCurrency, getErrorMessage } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { MovementType } from '@/types';


type Tab = 'stock' | 'movements';
const LIMIT = 10;

export function InventoryPage() {
  const navigate = useNavigate();
  const { canManageInventory } = useRole();
  const { showToast } = useAppToast();
  usePageTitle('Inventory');

  const [tab, setTab] = useState<Tab>('stock');
  const [stockModal, setStockModal] = useState<'IN' | 'OUT' | null>(null);

  // Stock tab filters
  const [stockSearch, setStockSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [stockPage, setStockPage] = useState(1);
  const debouncedStockSearch = useDebounce(stockSearch, 400);

  // Movements tab filters
  const [movType, setMovType] = useState<MovementType | ''>('');
  const [movPage, setMovPage] = useState(1);

  // ── Stock / Products query ────────────────────────────────────────────────
  const stockQueryKey = [
    ...QUERY_KEYS.products,
    { page: stockPage, search: debouncedStockSearch, lowStockOnly },
  ];

  const { data: stockData, isLoading: stockLoading, isError: stockError, error: stockErr, refetch: refetchStock } = useQuery({
    queryKey: stockQueryKey,
    queryFn: () =>
      productService.getProducts({
        page: stockPage,
        limit: LIMIT,
        ...(debouncedStockSearch ? { search: debouncedStockSearch } : {}),
        ...(lowStockOnly ? { lowStock: true } : {}),
        isActive: true,
      }),
    enabled: tab === 'stock',
  });

  // ── Low-stock summary count ───────────────────────────────────────────────
  const { data: lowStockData } = useQuery({
    queryKey: QUERY_KEYS.lowStock,
    queryFn: () => inventoryService.getLowStock({ limit: 1 }),
  });

  // ── Movements query ───────────────────────────────────────────────────────
  const movQueryKey = [...QUERY_KEYS.movements, { page: movPage, type: movType }];

  const { data: movData, isLoading: movLoading, isError: movError, error: movErr, refetch: refetchMov } = useQuery({
    queryKey: movQueryKey,
    queryFn: () =>
      inventoryService.getMovements({
        page: movPage,
        limit: LIMIT,
        ...(movType ? { type: movType } : {}),
      }),
    enabled: tab === 'movements',
  });

  const products = stockData?.data ?? [];
  const stockPagination = stockData?.pagination;
  const movements = movData?.data ?? [];
  const movPagination = movData?.pagination;
  const lowStockCount = lowStockData?.pagination?.total ?? 0;
  const totalProducts = stockData?.pagination?.total ?? 0;

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Monitor stock levels and manage inventory movements."
        actions={
          canManageInventory ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStockModal('OUT')}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
                  </svg>
                }
              >
                Stock OUT
              </Button>
              <Button
                size="sm"
                onClick={() => setStockModal('IN')}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                }
              >
                Stock IN
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Products Catalogued"
          value={totalProducts}
          icon={
            <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
          bg="bg-primary-50"
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStockCount}
          icon={
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
          bg="bg-amber-50"
          alert={lowStockCount > 0}
        />
        <StatCard
          label="Total Movements Logged"
          value={movData?.pagination?.total ?? '—'}
          icon={
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          }
          bg="bg-emerald-50"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200/50 pb-px">
        {(['stock', 'movements'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4.5 py-3 text-sm font-bold border-b-2 -mb-px transition-all duration-200 cursor-pointer ${
              tab === t
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-350'
            }`}
          >
            {t === 'stock' ? 'Stock Levels' : 'Transaction Movements Ledger'}
          </button>
        ))}
      </div>

      {/* ── Stock Levels Tab ── */}
      {tab === 'stock' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={stockSearch}
                onChange={e => { setStockSearch(e.target.value); setStockPage(1); }}
                leftAddon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                }
              />
            </div>
            <button
              type="button"
              onClick={() => { setLowStockOnly(v => !v); setStockPage(1); }}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                lowStockOnly
                  ? 'border-amber-300 bg-amber-500/10 text-amber-800 hover:bg-amber-500/15'
                  : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
              }`}
            >
              ⚠ Low Stock Only
            </button>
          </div>

          {stockLoading ? (
            <LoadingState message="Loading stock levels..." />
          ) : stockError ? (
            <ErrorState message={getErrorMessage(stockErr)} onRetry={() => refetchStock()} />
          ) : products.length === 0 ? (
            <EmptyState
              title={lowStockOnly ? 'All products are sufficiently stocked.' : 'No products found.'}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200/60 bg-white shadow-premium overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/60 border-b border-slate-100">
                    <tr>
                      {['Product', 'SKU', 'Category', 'Current Stock', 'Minimum', 'Location', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition-all duration-200">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{formatCurrency(p.unitPrice)}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400 font-bold">{p.sku}</td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">{p.category}</td>
                        <td className="px-6 py-4">
                          <span className={`text-lg font-extrabold ${p.currentStock <= p.minimumStock ? 'text-rose-600' : 'text-slate-800'}`}>
                            {p.currentStock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-450 font-bold">{p.minimumStock}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{p.warehouseLocation}</td>
                        <td className="px-6 py-4">
                          <StockStatusBadge currentStock={p.currentStock} minimumStock={p.minimumStock} />
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/products/${p.id}`)}
                            className="rounded-lg h-7.5 text-xs text-slate-600 border-slate-200 hover:border-slate-300"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-slate-100">
                {products.map(p => (
                  <div key={p.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-xs font-mono text-slate-400 font-bold mt-0.5">{p.sku}</p>
                      </div>
                      <StockStatusBadge currentStock={p.currentStock} minimumStock={p.minimumStock} />
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-450">
                      <span className={`font-bold ${p.currentStock <= p.minimumStock ? 'text-rose-650' : 'text-slate-700'}`}>
                        Stock: {p.currentStock}
                      </span>
                      <span className="text-slate-300">&middot;</span>
                      <span className="font-semibold">Min: {p.minimumStock}</span>
                      <span className="text-slate-300">&middot;</span>
                      <span className="font-medium bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">{p.warehouseLocation}</span>
                    </div>
                  </div>
                ))}
              </div>

              {stockPagination && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                  <PaginationBar pagination={stockPagination} onPageChange={setStockPage} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Movements Tab ── */}
      {tab === 'movements' && (
        <>
          <div className="flex gap-3 mb-5">
            <Select
              value={movType}
              onChange={e => { setMovType(e.target.value as MovementType | ''); setMovPage(1); }}
              className="w-40"
            >
              <option value="">All Movements</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </Select>
          </div>

          {movLoading ? (
            <LoadingState message="Loading movements..." />
          ) : movError ? (
            <ErrorState message={getErrorMessage(movErr)} onRetry={() => refetchMov()} />
          ) : movements.length === 0 ? (
            <EmptyState title="No stock movements yet." />
          ) : (
            <div className="rounded-2xl border border-slate-200/60 bg-white shadow-premium overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/60 border-b border-slate-100">
                    <tr>
                      {['Date', 'Product', 'Type', 'Qty', 'Reason', 'By'].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/40 transition-all duration-200">
                        <td className="px-6 py-4 text-xs text-slate-400 font-semibold whitespace-nowrap">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{m.product.name}</p>
                          <p className="text-xs font-mono text-slate-400 font-bold mt-0.5">{m.product.sku}</p>
                        </td>
                        <td className="px-6 py-4">
                          <MovementTypeBadge type={m.type} />
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-base font-extrabold ${m.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {m.type === 'IN' ? '+' : '-'}{m.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-xs max-w-[240px] truncate" title={m.reason}>
                          {m.reason}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                          {m.createdByUser.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-slate-100">
                {movements.map(m => (
                  <div key={m.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-800">{m.product.name}</p>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{formatDateTime(m.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MovementTypeBadge type={m.type} />
                        <span className={`text-sm font-bold ${m.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.type === 'IN' ? '+' : '-'}{m.quantity}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-450 font-semibold truncate">{m.reason} &middot; <span className="text-slate-600">{m.createdByUser.name}</span></p>
                  </div>
                ))}
              </div>

              {movPagination && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                  <PaginationBar pagination={movPagination} onPageChange={setMovPage} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Stock IN / OUT modals */}
      {stockModal && (
        <StockOperationModal
          open={true}
          type={stockModal}
          onClose={() => setStockModal(null)}
          onSuccess={(msg) => { showToast(msg); setStockModal(null); }}
        />
      )}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  bg,
  alert = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  bg: string;
  alert?: boolean;
}) {
  const colorMap: Record<string, string> = {
    'bg-primary-50': 'bg-primary-500/10 text-primary-600 border border-primary-500/10',
    'bg-emerald-50': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10',
    'bg-amber-50': 'bg-amber-500/10 text-amber-600 border border-amber-500/10',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border bg-white p-6 shadow-premium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        alert
          ? 'border-amber-200/80 bg-amber-50/5'
          : 'border-slate-200/60 hover:border-slate-300/80'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={cn('mt-2 text-3xl font-extrabold tracking-tight truncate leading-none', alert ? 'text-amber-600' : 'text-slate-900')}>
            {value}
          </p>
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform hover:scale-105 duration-200 shadow-sm', colorMap[bg] || bg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

