import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { CustomerStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';
import type { Customer } from '@/types';

interface RecentCustomersTableProps {
  customers: Customer[];
}

export function RecentCustomersTable({ customers }: RecentCustomersTableProps) {
  const navigate = useNavigate();

  return (
    <Card padding={false} className="p-6">
      <CardHeader className="pb-5">
        <CardTitle>Recent Customers</CardTitle>
        <button
          type="button"
          onClick={() => navigate('/customers')}
          className="text-xs text-primary-600 hover:text-primary-500 font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          View all
        </button>
      </CardHeader>
      <CardBody className="pt-0">
        {customers.length === 0 ? (
          <EmptyState title="No customers yet" className="min-h-[120px]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer hover:bg-slate-50/50 transition-all duration-200"
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-slate-800 line-clamp-1">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{c.businessName}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <CustomerStatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 text-right text-xs text-slate-400 font-medium whitespace-nowrap">
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

