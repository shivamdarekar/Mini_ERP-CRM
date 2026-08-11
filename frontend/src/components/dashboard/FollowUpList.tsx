import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { CustomerStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatRelativeDate } from '@/utils/format';
import type { UpcomingFollowUp } from '@/types';

interface FollowUpListProps {
  followUps: UpcomingFollowUp[];
}

export function FollowUpList({ followUps }: FollowUpListProps) {
  const navigate = useNavigate();

  return (
    <Card padding={false} className="p-6">
      <CardHeader className="pb-5">
        <CardTitle>Upcoming Follow-ups</CardTitle>
        <span className="text-[10px] font-bold text-primary-700 bg-primary-500/10 border border-primary-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
          {followUps.length}
        </span>
      </CardHeader>
      <CardBody className="pt-0">
        {followUps.length === 0 ? (
          <EmptyState title="No upcoming follow-ups" className="min-h-[120px]" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {followUps.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 py-3.5 cursor-pointer hover:bg-slate-50/60 rounded-xl px-2.5 -mx-2.5 transition-all duration-200"
                onClick={() => navigate(`/customers/${f.id}`)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{f.name}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5 truncate">{f.businessName}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <CustomerStatusBadge status={f.status} />
                  <span className="text-xs font-bold text-primary-600 bg-primary-500/5 px-2.5 py-1 rounded-lg border border-primary-500/10 whitespace-nowrap">
                    {formatRelativeDate(f.followUpDate)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

