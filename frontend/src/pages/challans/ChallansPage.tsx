import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { challanService } from '@/services/challan.service';
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
import { PaginationBar } from '@/components/ui/PaginationBar';
import { ChallanStatusBadge } from '@/components/ui/Badge';
import { InvoiceModal } from '@/components/challans/InvoiceModal';
import { formatDate, formatCurrency, getErrorMessage } from '@/utils/format';
import type { ChallanStatus, Challan } from '@/types';

const LIMIT = 10;

export function ChallansPage() {
  const navigate = useNavigate();
  const { canWrite } = useRole();
  usePageTitle('Sales Challans');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ChallanStatus | ''>('');
  const [page, setPage] = useState(1);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const resetPage = () => setPage(1);

  const queryKey = [...QUERY_KEYS.challans, { page, search: debouncedSearch, status }];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      challanService.getChallans({
        page,
        limit: LIMIT,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(status ? { status } : {}),
      }),
  });

  const challans = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Sales Challans"
        description="Create, manage and track customer sales challans."
        actions={
          canWrite ? (
            <Button
              onClick={() => navigate('/challans/create')}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Create Challan
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input
            placeholder="Search challan number or customer..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            leftAddon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
          />
        </div>
        <Select
          value={status}
          onChange={e => { setStatus(e.target.value as ChallanStatus | ''); resetPage(); }}
          className="sm:w-40"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading challans..." />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : challans.length === 0 ? (
        <EmptyState
          title={debouncedSearch || status ? 'No challans match your search.' : 'No sales challans yet.'}
          description={canWrite ? 'Create your first challan to get started.' : undefined}
          actionLabel={canWrite ? 'Create Challan' : undefined}
          onAction={canWrite ? () => navigate('/challans/create') : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-premium overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {['Challan #', 'Customer', 'Qty', 'Amount', 'Status', 'Created By', 'Date', ''].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challans.map(c => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/40 transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/challans/${c.id}`)}
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-800">
                      {c.challanNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{c.customer.name}</p>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">{c.customer.businessName}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-650 font-bold">{c.totalQuantity}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(c.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <ChallanStatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{c.createdByUser.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium whitespace-nowrap">{formatDate(c.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => { e.stopPropagation(); setSelectedChallan(c); }}
                          className="rounded-lg h-7.5 text-xs text-indigo-700 bg-indigo-50/50 border-indigo-200 hover:bg-indigo-100/60"
                        >
                          Invoice
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => { e.stopPropagation(); navigate(`/challans/${c.id}`); }}
                          className="rounded-lg h-7.5 text-xs text-slate-600 border-slate-200 hover:border-slate-300"
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {challans.map(c => (
              <div
                key={c.id}
                className="p-5 hover:bg-slate-50/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/challans/${c.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-bold text-slate-800">{c.challanNumber}</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{c.customer.name}</p>
                    <p className="text-xs text-slate-400 font-semibold">{c.customer.businessName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <ChallanStatusBadge status={c.status} />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setSelectedChallan(c); }}
                      className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Invoice PDF
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-450">
                  <span className="font-semibold">Qty: {c.totalQuantity}</span>
                  <span className="text-slate-300">&middot;</span>
                  <span className="font-bold text-slate-700">{formatCurrency(c.totalAmount)}</span>
                  <span className="text-slate-300">&middot;</span>
                  <span className="font-medium">{formatDate(c.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {pagination && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <PaginationBar pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Invoice PDF Modal */}
      {selectedChallan && (
        <InvoiceModal
          open={!!selectedChallan}
          onClose={() => setSelectedChallan(null)}
          challan={selectedChallan}
        />
      )}
    </div>
  );
}
