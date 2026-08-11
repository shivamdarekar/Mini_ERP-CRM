import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StockStatusBadge } from '@/components/inventory/StockStatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import type { Product } from '@/types';

interface RecentProductsTableProps {
  products: Product[];
}

export function RecentProductsTable({ products }: RecentProductsTableProps) {
  const navigate = useNavigate();

  return (
    <Card padding={false} className="p-6">
      <CardHeader className="pb-5">
        <CardTitle>Recent Products</CardTitle>
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="text-xs text-primary-600 hover:text-primary-500 font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          View all
        </button>
      </CardHeader>
      <CardBody className="pt-0">
        {products.length === 0 ? (
          <EmptyState title="No products yet" className="min-h-[120px]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer hover:bg-slate-50/50 transition-all duration-200"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-slate-800 line-clamp-1">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-medium">{p.sku}</p>
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-slate-400 font-semibold">{p.warehouseLocation}</td>
                    <td className="py-3.5 pr-4 text-right">
                      <span className={`text-sm font-bold ${p.currentStock <= p.minimumStock ? 'text-rose-600' : 'text-slate-800'}`}>
                        {p.currentStock}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/{p.minimumStock}</span>
                    </td>
                    <td className="py-3.5 text-right">
                      <StockStatusBadge currentStock={p.currentStock} minimumStock={p.minimumStock} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

