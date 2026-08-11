import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@/services/customer.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useRole } from '@/hooks/useRole';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { CustomerStatusBadge } from '@/components/ui/Badge';
import { AddFollowUpModal } from '@/components/customers/AddFollowUpModal';
import { useAppToast } from '@/components/layout/AppLayout';
import { formatDate, formatDateTime, formatRelativeDate, getErrorMessage } from '@/utils/format';
import { cn } from '@/utils/cn';


// ─── Action badge colours (reused from audit log pattern) ─────────────────────
const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-700 border border-blue-500/20',
  DELETE: 'bg-rose-500/10 text-rose-750 border border-rose-500/20',
};

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canWrite } = useRole();
  const { showToast } = useAppToast();
  const [followUpOpen, setFollowUpOpen] = useState(false);
  usePageTitle('Customer Detail');

  const {
    data: customer,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.customer(id!),
    queryFn: () => customerService.getCustomerById(id!),
    enabled: !!id,
  });

  const {
    data: followUps,
    isLoading: followUpsLoading,
    isError: followUpsError,
  } = useQuery({
    queryKey: QUERY_KEYS.customerFollowUps(id!),
    queryFn: () => customerService.getFollowUps(id!),
    enabled: !!id,
  });

  const {
    data: activityData,
    isLoading: activityLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.customerActivity(id!),
    queryFn: () => customerService.getCustomerActivity(id!),
    enabled: !!id,
  });

  const auditLogs = activityData?.auditLogs ?? [];

  if (isLoading) return <LoadingState message="Loading customer..." />;
  if (isError || !customer)
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const followUpRelative = customer.followUpDate
    ? formatRelativeDate(customer.followUpDate)
    : null;
  const isFollowUpToday = followUpRelative === 'Today';
  const isFollowUpOverdue =
    customer.followUpDate &&
    new Date(customer.followUpDate) < new Date() &&
    !isFollowUpToday;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 cursor-pointer"
            aria-label="Back"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{customer.name}</h1>
              <CustomerStatusBadge status={customer.status} />
            </div>
            <p className="mt-1 text-sm text-slate-400 font-semibold">{customer.businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {canWrite && (
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate(`/customers/${id}/edit`)}
              leftIcon={
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              }
            >
              Edit Details
            </Button>
          )}
          {canWrite && (
            <Button
              size="md"
              onClick={() => setFollowUpOpen(true)}
              leftIcon={
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Add Follow-up Note
            </Button>
          )}
        </div>
      </div>

      {/* Two-column info grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Customer Information */}
        <Card padding={false} className="p-6">
          <CardHeader className="pb-5">
            <CardTitle>Customer Profile Details</CardTitle>
          </CardHeader>
          <CardBody className="pt-5">
            <dl className="space-y-4">
              <InfoRow label="Mobile" value={customer.mobile} />
              <InfoRow label="Email" value={customer.email} />
              <InfoRow label="Address" value={customer.address} />
              <InfoRow
                label="Customer Type"
                value={customer.customerType.charAt(0) + customer.customerType.slice(1).toLowerCase()}
              />
              {customer.gstNumber && (
                <InfoRow label="GST Number" value={customer.gstNumber} mono />
              )}
              <InfoRow label="Member Since" value={formatDate(customer.createdAt)} />
            </dl>
          </CardBody>
        </Card>

        {/* CRM / Follow-up */}
        <Card padding={false} className="p-6">
          <CardHeader className="pb-5">
            <CardTitle>Active CRM Details</CardTitle>
          </CardHeader>
          <CardBody className="pt-5">
            <dl className="space-y-4">
              <div className="pb-3 border-b border-slate-50">
                <dt className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Next Follow-up Date</dt>
                <dd className="mt-1.5">
                  {customer.followUpDate ? (
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-sm font-bold',
                          isFollowUpToday
                            ? 'text-amber-600'
                            : isFollowUpOverdue
                            ? 'text-rose-600'
                            : 'text-slate-800'
                        )}
                      >
                        {formatDate(customer.followUpDate)}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0',
                          isFollowUpToday
                            ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                            : isFollowUpOverdue
                            ? 'bg-rose-500/10 text-rose-650 border-rose-500/20'
                            : 'bg-slate-500/10 text-slate-650 border-slate-500/20'
                        )}
                      >
                        {isFollowUpToday ? '⚡ Today' : isFollowUpOverdue ? '⚠ Overdue' : followUpRelative}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 font-semibold">Not scheduled</span>
                  )}
                </dd>
              </div>
              {customer.notes && (
                <div className="pb-3 border-b border-slate-50">
                  <dt className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Notes & Remarks</dt>
                  <dd className="mt-1.5 text-sm text-slate-700 font-medium whitespace-pre-wrap">{customer.notes}</dd>
                </div>
              )}
              <InfoRow label="Last Activity Sync" value={formatDateTime(customer.updatedAt)} />
            </dl>
          </CardBody>
        </Card>
      </div>

      {/* Follow-up History */}
      <Card padding={false} className="p-6 mb-6">
        <CardHeader className="pb-5">
          <CardTitle>Follow-up Contact History</CardTitle>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {followUps ? `${followUps.length} note${followUps.length !== 1 ? 's' : ''}` : ''}
          </span>
        </CardHeader>
        <CardBody className="pt-0">
          {followUpsLoading ? (
            <LoadingState message="Loading notes..." className="min-h-[80px]" />
          ) : followUpsError ? (
            <ErrorState message="Could not load follow-up notes." />
          ) : !followUps || followUps.length === 0 ? (
            <EmptyState
              title="No follow-up notes yet."
              description={canWrite ? 'Add the first note using the button above.' : undefined}
              className="min-h-[100px]"
            />
          ) : (
            <ul className="space-y-4">
              {[...followUps]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(note => (
                  <li key={note.id} className="rounded-2xl border border-slate-200/50 bg-slate-50/20 p-5 shadow-sm hover:border-slate-350 transition-all duration-200">
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                      <span className="text-xs font-extrabold text-slate-800">
                        {note.createdByUser.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{formatDateTime(note.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-650 font-medium leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </li>
                ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Customer Activity / Audit Trail */}
      <Card padding={false} className="p-6">
        <CardHeader className="pb-5">
          <CardTitle>Customer Lifecycle Activity Trail</CardTitle>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {activityLoading ? '…' : `${auditLogs.length} event${auditLogs.length !== 1 ? 's' : ''}`}
          </span>
        </CardHeader>
        <CardBody className="pt-0">
          {activityLoading ? (
            <LoadingState message="Loading activity..." className="min-h-[80px]" />
          ) : auditLogs.length === 0 ? (
            <EmptyState title="No activity recorded yet." className="min-h-[100px]" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {auditLogs.map(log => (
                <li key={log.id} className="py-3 flex items-start gap-4">
                  <span className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${ACTION_COLORS[log.action] ?? 'bg-slate-500/10 text-slate-600 border border-slate-500/20'}`}>
                    {log.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-800">{log.user?.name ?? 'System'}</span>
                      {log.description ? ` · ${log.description}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">{formatDateTime(log.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Add Follow-up Modal */}
      <AddFollowUpModal
        customerId={id!}
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        onSuccess={() => showToast('Follow-up note added.')}
      />
    </div>
  );
}

// ─── Info row helper ──────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="pb-3 border-b border-slate-50 last:border-b-0 last:pb-0">
      <dt className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">{label}</dt>
      <dd className={`mt-1 text-sm font-bold text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

