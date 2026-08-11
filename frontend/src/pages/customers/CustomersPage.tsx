import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
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
import { CustomerStatusBadge } from '@/components/ui/Badge';
import { formatDate, formatRelativeDate, getErrorMessage } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { CustomerStatus, CustomerType } from '@/types';


const LIMIT = 10;

export function CustomersPage() {
  const navigate = useNavigate();
  const { canWrite } = useRole();
  usePageTitle('Customers');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [customerType, setCustomerType] = useState<CustomerType | ''>('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  // Reset to page 1 when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleStatus = (v: CustomerStatus | '') => { setStatus(v); setPage(1); };
  const handleType = (v: CustomerType | '') => { setCustomerType(v); setPage(1); };

  const queryKey = [
    ...QUERY_KEYS.customers,
    { page, search: debouncedSearch, status, customerType },
  ];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      customerService.getCustomers({
        page,
        limit: LIMIT,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(status ? { status } : {}),
        ...(customerType ? { customerType } : {}),
      }),
  });

  const customers = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer relationships, follow-ups and business information."
        actions={
          canWrite ? (
            <Button
              onClick={() => navigate('/customers/new')}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Add Customer
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            leftAddon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
          />
        </div>
        <Select
          value={status}
          onChange={e => handleStatus(e.target.value as CustomerStatus | '')}
          className="sm:w-36"
        >
          <option value="">All Status</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <Select
          value={customerType}
          onChange={e => handleType(e.target.value as CustomerType | '')}
          className="sm:w-40"
        >
          <option value="">All Types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading customers..." />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : customers.length === 0 ? (
        <EmptyState
          title={debouncedSearch || status || customerType ? 'No customers match your search.' : 'No customers yet.'}
          description={canWrite ? 'Add your first customer to get started.' : undefined}
          actionLabel={canWrite ? 'Add Customer' : undefined}
          onAction={canWrite ? () => navigate('/customers/new') : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-premium overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Follow-up</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(c => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/40 transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{c.mobile}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 font-bold text-sm">{c.businessName}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{c.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-lg capitalize">
                        {c.customerType.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <CustomerStatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4">
                      {c.followUpDate ? (
                        <FollowUpDateCell date={c.followUpDate} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
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

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {customers.map(c => (
              <div
                key={c.id}
                className="p-5 hover:bg-slate-50/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/customers/${c.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5 truncate">{c.businessName}</p>
                  </div>
                  <CustomerStatusBadge status={c.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-450">
                  <span className="font-medium">{c.mobile}</span>
                  <span className="text-slate-300">&middot;</span>
                  <span className="capitalize font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">{c.customerType.toLowerCase()}</span>
                  {c.followUpDate && (
                    <>
                      <span className="text-slate-300">&middot;</span>
                      <FollowUpDateCell date={c.followUpDate} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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

// ─── Follow-up date cell with visual emphasis ─────────────────────────────────

function FollowUpDateCell({ date }: { date: string }) {
  const relative = formatRelativeDate(date);
  const isOverdue = new Date(date) < new Date() && relative !== 'Today';
  const isToday = relative === 'Today';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
        isToday
          ? 'text-amber-700 bg-amber-500/10 border-amber-500/20'
          : isOverdue
          ? 'text-rose-700 bg-rose-500/10 border-rose-500/20'
          : 'text-slate-600 bg-slate-100 border-slate-200/50'
      )}
    >
      {isToday ? '⚡ Today' : isOverdue ? `⚠ Overdue` : formatDate(date)}
    </span>
  );
}

