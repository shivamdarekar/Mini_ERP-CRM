import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/common/EmptyState';
import type { Product } from '@/types';

interface LowStockTableProps {
  products: Product[];
}

export function LowStockTable({ products }: LowStockTableProps) {
  const navigate = useNavigate();

  return (
    <Card padding={false} className="p-6">
      <CardHeader className="pb-5">
        <CardTitle>Low Stock Alert</CardTitle>
        <span className="text-[10px] font-bold text-amber-800 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
          {products.length} item{products.length !== 1 ? 's' : ''}
        </span>
      </CardHeader>
      <CardBody className="pt-0">
        {products.length === 0 ? (
          <EmptyState title="All stock levels are healthy" className="min-h-[120px]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min</th>
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
                      <span className="font-bold text-slate-800 line-clamp-1">{p.name}</span>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-400 font-mono text-xs font-medium">{p.sku}</td>
                    <td className="py-3.5 text-right">
                      <span className="font-bold text-rose-600">{p.currentStock}</span>
                    </td>
                    <td className="py-3.5 text-right text-slate-500 font-medium">{p.minimumStock}</td>
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

