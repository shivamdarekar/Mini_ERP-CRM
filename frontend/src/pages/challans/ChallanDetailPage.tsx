import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challanService } from '@/services/challan.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useRole } from '@/hooks/useRole';
import { useAppToast } from '@/components/layout/AppLayout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { ChallanStatusBadge, MovementTypeBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InvoiceModal } from '@/components/challans/InvoiceModal';
import { formatDate, formatDateTime, formatCurrency, getErrorMessage } from '@/utils/format';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
  CONFIRM: 'bg-purple-500/10 text-purple-700 border border-purple-500/20',
  CANCEL: 'bg-slate-500/10 text-slate-650 border border-slate-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-700 border border-blue-500/20',
};

export function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canWrite } = useRole();
  const { showToast } = useAppToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const { data: challan, isLoading, isError, error, refetch } = useQuery({

    queryKey: QUERY_KEYS.challan(id!),
    queryFn: () => challanService.getChallanById(id!),
    enabled: !!id,
  });

  // Lazy-load history (audit logs + stock movements triggered by this challan)
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['challans', id, 'history'],
    queryFn: () => challanService.getChallanHistory(id!),
    enabled: !!id,
  });

  const historyAuditLogs = historyData?.auditLogs ?? [];
  const historyMovements = historyData?.stockMovements ?? [];

  // ── Confirm mutation ──────────────────────────────────────────────────────
  const confirmMutation = useMutation({
    mutationFn: () => challanService.confirmChallan(id!),
    onSuccess: () => {
      invalidateAfterConfirm();
      showToast('Challan confirmed. Inventory has been updated.');
      setConfirmOpen(false);
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error');
      setConfirmOpen(false);
      // Refetch to ensure UI reflects true state
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challan(id!) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
    },
  });

  // ── Cancel mutation ───────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: () => challanService.cancelChallan(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challan(id!) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      showToast('Challan cancelled.');
      setCancelOpen(false);
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error');
      setCancelOpen(false);
    },
  });

  const invalidateAfterConfirm = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challans });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.challan(id!) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movements });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lowStock });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
  };

  usePageTitle(challan ? challan.challanNumber : 'Challan Detail');

  if (isLoading) return <LoadingState message="Loading challan..." />;
  if (isError || !challan) return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const isDraft = challan.status === 'DRAFT';
  const isConfirmed = challan.status === 'CONFIRMED';
  const isCancelled = challan.status === 'CANCELLED';
  const items = challan.items ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate('/challans')}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 cursor-pointer"
            aria-label="Back"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">{challan.challanNumber}</h1>
              <ChallanStatusBadge status={challan.status} />
            </div>
            <p className="mt-1 text-sm text-slate-400 font-semibold">
              Created by {challan.createdByUser.name} &middot; {formatDateTime(challan.createdAt)}
            </p>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => setInvoiceOpen(true)}
            className="border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/60"
            leftIcon={
              <svg className="h-4.5 w-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
          >
            Download Invoice
          </Button>

          {isDraft && canWrite && (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(`/challans/${id}/edit`)}
                leftIcon={
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                  </svg>
                }
              >
                Edit Details
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setCancelOpen(true)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200"
              >
                Cancel Challan
              </Button>
              <Button
                size="md"
                onClick={() => setConfirmOpen(true)}
                leftIcon={
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                }
              >
                Confirm & Post Inventory
              </Button>
            </>
          )}

          {isConfirmed && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2">
              <svg className="h-4.5 w-4.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Confirmed & Posted</p>
            </div>
          )}

          {isCancelled && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-500/10 border border-slate-500/20 px-4 py-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Challan Cancelled</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Customer info */}
        <Card padding={false} className="p-6 lg:col-span-1">
          <CardHeader className="pb-5">
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardBody className="pt-5">
            <dl className="space-y-4">
              <div className="pb-3 border-b border-slate-50">
                <dt className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Name</dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">{challan.customer.name}</dd>
              </div>
              <div className="pb-3 border-b border-slate-50">
                <dt className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Business</dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">{challan.customer.businessName}</dd>
              </div>
              <div className="pb-3 border-b border-slate-50">
                <dt className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Mobile</dt>
                <dd className="mt-1 text-sm font-bold text-slate-800">{challan.customer.mobile}</dd>
              </div>
              <div className="pb-3 border-b border-slate-50 last:border-b-0 last:pb-0">
                <dt className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Email</dt>
                <dd className="mt-1 text-sm font-bold text-slate-800 break-all">{challan.customer.email}</dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        {/* Challan metadata */}
        <Card padding={false} className="p-6 lg:col-span-2">
          <CardHeader className="pb-5">
            <CardTitle>Challan Specifications</CardTitle>
          </CardHeader>
          <CardBody className="pt-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <MetaItem label="Challan Number" value={challan.challanNumber} mono />
              <MetaItem label="Status" value={challan.status} />
              <MetaItem label="Total Quantity" value={String(challan.totalQuantity)} />
              <MetaItem label="Total Amount" value={formatCurrency(challan.totalAmount)} />
              <MetaItem label="Created By" value={challan.createdByUser.name} />
              <MetaItem label="Created" value={formatDate(challan.createdAt)} />
              <MetaItem label="Last Updated" value={formatDateTime(challan.updatedAt)} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Items table — historical snapshot */}
      <Card padding={false} className="p-6 mb-6">
        <CardHeader className="pb-5">
          <CardTitle>Challan Products List</CardTitle>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </CardHeader>
        <CardBody className="pt-0">
          {items.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No items on this challan.</p>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                      <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                      <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Price</th>
                      <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                      <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 pr-4 font-bold text-slate-800">{item.productName}</td>
                        <td className="py-3.5 pr-4 font-mono text-xs text-slate-400 font-bold">{item.sku}</td>
                        <td className="py-3.5 pr-4 text-right text-slate-600 font-semibold">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3.5 pr-4 text-right font-bold text-slate-800">{item.quantity}</td>
                        <td className="py-3.5 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200">
                      <td colSpan={3} className="pt-4 text-xs text-slate-400 font-medium">
                        Prices reflect snapshot at time of challan creation.
                      </td>
                      <td className="pt-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Total ({challan.totalQuantity} units)
                      </td>
                      <td className="pt-4 text-right text-xl font-extrabold text-slate-900 tracking-tight">
                        {formatCurrency(challan.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {items.map(item => (
                  <div key={item.id} className="rounded-xl border border-slate-200/60 p-4.5 bg-slate-50/10">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-800">{item.productName}</p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">{item.sku}</p>
                      </div>
                      <p className="font-bold text-slate-900">{formatCurrency(item.total)}</p>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-450 font-semibold">
                      <span>{formatCurrency(item.unitPrice)} &times; {item.quantity}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/60 px-5 py-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total ({challan.totalQuantity} units)</span>
                  <span className="text-lg font-extrabold text-slate-900">{formatCurrency(challan.totalAmount)}</span>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Challan History — audit events + triggered stock movements */}
      <Card padding={false} className="p-6">
        <CardHeader className="pb-5">
          <CardTitle>Challan Transaction History</CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          {historyLoading ? (
            <LoadingState message="Loading history..." className="min-h-[80px]" />
          ) : historyAuditLogs.length === 0 && historyMovements.length === 0 ? (
            <EmptyState title="No history recorded yet." className="min-h-[80px]" />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Audit events */}
              {historyAuditLogs.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Audit Log Events</p>
                  <ul className="divide-y divide-slate-100">
                    {historyAuditLogs.map(log => (
                      <li key={log.id} className="py-3 flex items-start gap-4">
                        <span className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${ACTION_COLORS[log.action] ?? 'bg-slate-500/10 text-slate-650 border border-slate-500/20'}`}>
                          {log.action}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-800">{log.user?.name ?? 'System'}</span>
                            {log.description ? ` · ${log.description}` : ''}
                          </p>
                          <p className="text-[10px] text-slate-450 font-bold mt-1">{formatDateTime(log.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Triggered stock movements */}
              {historyMovements.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Triggered Inventory Movements</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                          <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                          <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty</th>
                          <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyMovements.map(m => (
                          <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 pr-4 font-bold text-slate-800">{m.product.name}</td>
                            <td className="py-3 pr-4"><MovementTypeBadge type={m.type} /></td>
                            <td className="py-3 pr-4 text-right font-extrabold text-rose-600">−{m.quantity}</td>
                            <td className="py-3 text-right text-xs text-slate-450 font-semibold whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>


      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Sales Challan"
        message="Are you sure you want to confirm this challan?"
        detail="Confirming will reduce inventory for all products in this challan. This action cannot be undone."
        confirmLabel="Confirm Challan"
        confirmVariant="primary"
        loading={confirmMutation.isPending}
        onConfirm={() => confirmMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Cancel dialog */}
      <ConfirmDialog
        open={cancelOpen}
        title="Cancel Sales Challan"
        message="Are you sure you want to cancel this challan?"
        detail="The challan will be marked as cancelled. Inventory will not be affected."
        confirmLabel="Cancel Challan"
        confirmVariant="danger"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setCancelOpen(false)}
      />

      {/* Invoice / Printable Modal */}
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        challan={challan}
      />
    </div>
  );
}

// ─── Meta item helper ─────────────────────────────────────────────────────────

function MetaItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-sm text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}
