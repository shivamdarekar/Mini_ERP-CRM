import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg?: string;
  description?: string;
  alert?: boolean;
}

export function StatCard({ title, value, icon, iconBg = 'bg-primary-50', description, alert = false }: StatCardProps) {
  const colorMap: Record<string, string> = {
    'bg-primary-50': 'bg-primary-500/10 text-primary-600 border border-primary-500/10',
    'bg-blue-50': 'bg-blue-500/10 text-blue-600 border border-blue-500/10',
    'bg-emerald-50': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10',
    'bg-amber-50': 'bg-amber-500/10 text-amber-600 border border-amber-500/10',
    'bg-purple-50': 'bg-purple-500/10 text-purple-600 border border-purple-500/10',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border bg-white p-6 shadow-premium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        alert
          ? 'border-amber-200/80 bg-amber-50/5'
          : 'border-slate-200/60 hover:border-slate-300/80'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className={cn('mt-2 text-3xl font-extrabold tracking-tight truncate leading-none', alert ? 'text-amber-600' : 'text-slate-900')}>
            {value}
          </p>
          {description && (
            <p className="mt-2 text-xs font-medium text-slate-400 truncate">{description}</p>
          )}
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform hover:scale-105 duration-200 shadow-sm', colorMap[iconBg] || iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}


