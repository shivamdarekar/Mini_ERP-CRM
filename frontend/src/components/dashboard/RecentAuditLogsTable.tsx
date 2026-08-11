import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime } from '@/utils/format';
import type { AuditLog } from '@/types';

interface RecentAuditLogsTableProps {
  logs: AuditLog[];
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-700 border border-blue-500/20',
  DELETE: 'bg-rose-500/10 text-rose-700 border border-rose-500/20',
  STOCK_IN: 'bg-teal-500/10 text-teal-700 border border-teal-500/20',
  STOCK_OUT: 'bg-amber-500/10 text-amber-850 border border-amber-500/20',
  CONFIRM: 'bg-purple-500/10 text-purple-700 border border-purple-500/20',
  CANCEL: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
};

export function RecentAuditLogsTable({ logs }: RecentAuditLogsTableProps) {
  return (
    <Card padding={false} className="p-6">
      <CardHeader className="pb-5">
        <CardTitle>Recent Activity Audit Log</CardTitle>
      </CardHeader>
      <CardBody className="pt-0">
        {logs.length === 0 ? (
          <EmptyState title="No activity yet" className="min-h-[120px]" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {logs.map((log) => (
              <li key={log.id} className="py-3 flex items-start gap-4">
                <span className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${actionColors[log.action] ?? 'bg-slate-500/10 text-slate-600 border border-slate-500/20'}`}>
                  {log.action}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-800">{log.user?.name ?? 'System'}</span>
                    {log.description ? ` · ${log.description}` : ` · ${log.entityType}`}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">{formatDateTime(log.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

