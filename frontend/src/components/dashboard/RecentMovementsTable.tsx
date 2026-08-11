import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { MovementTypeBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime } from '@/utils/format';
import type { StockMovement } from '@/types';

interface RecentMovementsTableProps {
  movements: StockMovement[];
}

export function RecentMovementsTable({ movements }: RecentMovementsTableProps) {
  return (
    <Card padding={false} className="p-6">
      <CardHeader className="pb-5">
        <CardTitle>Recent Stock Movements</CardTitle>
      </CardHeader>
      <CardBody className="pt-0">
        {movements.length === 0 ? (
          <EmptyState title="No stock movements yet" className="min-h-[120px]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-4">Reason</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-all duration-200">
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-slate-800 line-clamp-1">{m.product.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-medium">{m.product.sku}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <MovementTypeBadge type={m.type} />
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-900">{m.quantity}</td>
                    <td className="py-3.5 pl-4 text-slate-500 font-medium text-xs max-w-[200px] truncate" title={m.reason}>
                      {m.reason}
                    </td>
                    <td className="py-3.5 text-right text-slate-400 font-medium text-xs whitespace-nowrap">
                      {formatDateTime(m.createdAt)}
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

