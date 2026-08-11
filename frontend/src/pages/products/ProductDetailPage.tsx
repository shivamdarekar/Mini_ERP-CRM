import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useRole } from '@/hooks/useRole';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StockStatusBadge } from '@/components/inventory/StockStatusBadge';
import { formatCurrency, formatDate, formatDateTime, getErrorMessage } from '@/utils/format';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManageInventory } = useRole();

  const { data: product, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.product(id!),
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  usePageTitle(product ? product.name : 'Product Detail');

  if (isLoading) return <LoadingState message="Loading product..." />;
  if (isError || !product)
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const isLow = product.currentStock <= product.minimumStock;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 cursor-pointer"
            aria-label="Back"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{product.name}</h1>
              {product.isActive
                ? <StockStatusBadge currentStock={product.currentStock} minimumStock={product.minimumStock} />
                : <Badge variant="neutral">Inactive</Badge>
              }
            </div>
            <p className="mt-1 text-sm font-mono text-slate-400 font-bold">{product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(`/inventory`)}
            leftIcon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            }
          >
            View Inventory
          </Button>
          {canManageInventory && (
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(`/products/${id}/edit`)}
              leftIcon={
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              }
            >
              Edit Details
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Product Information */}
        <Card padding={false} className="p-6">
          <CardHeader className="pb-5">
            <CardTitle>Product Catalog Details</CardTitle>
          </CardHeader>
          <CardBody className="pt-5">
            <dl className="space-y-4">
              <InfoRow label="Name" value={product.name} />
              <InfoRow label="SKU" value={product.sku} mono />
              <InfoRow label="Category" value={product.category} />
              <InfoRow label="Unit Price" value={formatCurrency(product.unitPrice)} />
              <InfoRow label="Warehouse Location" value={product.warehouseLocation} />
              <InfoRow label="Status" value={product.isActive ? 'Active' : 'Inactive'} />
              <InfoRow label="Created" value={formatDate(product.createdAt)} />
              <InfoRow label="Last Updated" value={formatDateTime(product.updatedAt)} />
            </dl>
          </CardBody>
        </Card>

        {/* Inventory Information */}
        <Card padding={false} className="p-6">
          <CardHeader className="pb-5">
            <CardTitle>Inventory Status Summary</CardTitle>
          </CardHeader>
          <CardBody className="pt-5">
            <dl className="space-y-4">
              <div className="pb-3 border-b border-slate-50">
                <dt className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Current Stock Quantity</dt>
                <dd className={`mt-2 text-3xl font-extrabold tracking-tight ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                  {product.currentStock}
                  <span className="text-sm font-semibold text-slate-400 ml-1.5">units</span>
                </dd>
              </div>
              <InfoRow label="Minimum Stock Threshold" value={`${product.minimumStock} units`} />
              <div className="pb-3 border-b border-slate-50 last:border-b-0">
                <dt className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Current Stock Status</dt>
                <dd className="mt-2">
                  <StockStatusBadge currentStock={product.currentStock} minimumStock={product.minimumStock} />
                </dd>
              </div>
              {isLow && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 mt-2">
                  <p className="text-xs text-amber-800 font-bold leading-relaxed">
                    ⚠ Stock level is at or below the minimum threshold. Go to Inventory → Stock IN to replenish.
                  </p>
                </div>
              )}
            </dl>
            {canManageInventory && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => navigate('/inventory')}
                  className="w-full"
                >
                  Manage Stock in Inventory Ledger
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="pb-3 border-b border-slate-50 last:border-b-0 last:pb-0">
      <dt className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{label}</dt>
      <dd className={`mt-1 text-sm font-bold text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

