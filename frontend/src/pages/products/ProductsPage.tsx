import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useRole } from '@/hooks/useRole';
import { useDebounce } from '@/hooks/useDebounce';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { StockStatusBadge } from '@/components/inventory/StockStatusBadge';
import { formatCurrency, getErrorMessage } from '@/utils/format';

const LIMIT = 10;

export function ProductsPage() {
  const navigate = useNavigate();
  const { canManageInventory } = useRole();
  usePageTitle('Products');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const resetPage = () => setPage(1);

  const queryKey = [
    ...QUERY_KEYS.products,
    { page, search: debouncedSearch, category, statusFilter, lowStockOnly },
  ];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      productService.getProducts({
        page,
        limit: LIMIT,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(category ? { category } : {}),
        ...(statusFilter !== 'all' ? { isActive: statusFilter === 'active' } : {}),
        ...(lowStockOnly ? { lowStock: true } : {}),
      }),
  });

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage products, pricing, categories and stock thresholds."
        actions={
          canManageInventory ? (
            <Button
              onClick={() => navigate('/products/new')}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Add Product
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            leftAddon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
          />
        </div>
        <Input
          placeholder="Category..."
          value={category}
          onChange={e => { setCategory(e.target.value); resetPage(); }}
          className="sm:w-36"
        />
        <Select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as typeof statusFilter); resetPage(); }}
          className="sm:w-36"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <button
          type="button"
          onClick={() => { setLowStockOnly(v => !v); resetPage(); }}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            lowStockOnly
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-border bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Low Stock
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading products..." />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : products.length === 0 ? (
        <EmptyState
          title={debouncedSearch || category || lowStockOnly ? 'No products match your search.' : 'No products yet.'}
          description={canManageInventory ? 'Add your first product to get started.' : undefined}
          actionLabel={canManageInventory ? 'Add Product' : undefined}
          onAction={canManageInventory ? () => navigate('/products/new') : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-premium overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Min', 'Location', 'Status', ''].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => {
                  const low = p.currentStock <= p.minimumStock;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/40 transition-all duration-200 cursor-pointer"
                      onClick={() => navigate(`/products/${p.id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{p.name}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400 font-bold">{p.sku}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{p.category}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(p.unitPrice)}</td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${low ? 'text-rose-600' : 'text-slate-800'}`}>
                          {p.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-semibold">{p.minimumStock}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold text-xs">{p.warehouseLocation}</td>
                      <td className="px-6 py-4">
                        {p.isActive
                          ? <StockStatusBadge currentStock={p.currentStock} minimumStock={p.minimumStock} />
                          : <Badge variant="neutral">Inactive</Badge>
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => { e.stopPropagation(); navigate(`/products/${p.id}`); }}
                          className="rounded-lg h-7.5 text-xs text-slate-600 border-slate-200 hover:border-slate-300"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {products.map(p => {
              const low = p.currentStock <= p.minimumStock;
              return (
                <div
                  key={p.id}
                  className="p-5 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/products/${p.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs font-mono text-slate-400 font-semibold mt-0.5">{p.sku}</p>
                    </div>
                    {p.isActive
                      ? <StockStatusBadge currentStock={p.currentStock} minimumStock={p.minimumStock} />
                      : <Badge variant="neutral">Inactive</Badge>
                    }
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-450">
                    <span className="font-semibold">{p.category}</span>
                    <span className="text-slate-300">&middot;</span>
                    <span className="font-bold text-slate-700">{formatCurrency(p.unitPrice)}</span>
                    <span className="text-slate-300">&middot;</span>
                    <span className={low ? 'text-rose-600 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider' : 'font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]'}>
                      Stock: {p.currentStock}/{p.minimumStock}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <PaginationBar pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

