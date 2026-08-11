import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { ChallanStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatCurrency } from '@/utils/format';
import type { Challan } from '@/types';

interface RecentChallansTableProps {
  challans: Challan[];
}

export function RecentChallansTable({ challans }: RecentChallansTableProps) {
  const navigate = useNavigate();

  return (
    <Card padding={false} className="p-6">
      <CardHeader className="pb-5">
        <CardTitle>Recent Challans</CardTitle>
        <button
          type="button"
          onClick={() => navigate('/challans')}
          className="text-xs text-primary-600 hover:text-primary-500 font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          View all
        </button>
      </CardHeader>
      <CardBody className="pt-0">
        {challans.length === 0 ? (
          <EmptyState title="No challans yet" className="min-h-[120px]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Challan #</th>
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challans.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer hover:bg-slate-50/50 transition-all duration-200"
                    onClick={() => navigate(`/challans/${c.id}`)}
                  >
                    <td className="py-3.5 pr-4 font-mono text-xs font-bold text-slate-800">
                      {c.challanNumber}
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-slate-800 line-clamp-1">
                      {c.customer.name}
                    </td>
                    <td className="py-3.5 pr-4">
                      <ChallanStatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(c.totalAmount)}
                    </td>
                    <td className="py-3.5 text-right text-slate-400 font-medium text-xs">
                      {formatDate(c.createdAt)}
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

