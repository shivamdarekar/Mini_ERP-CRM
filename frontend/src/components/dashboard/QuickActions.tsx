import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { cn } from '@/utils/cn';


export interface QuickAction {
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  color: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const navigate = useNavigate();

  if (actions.length === 0) return null;

  const colorMap: Record<string, string> = {
    'bg-blue-50': 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    'bg-emerald-50': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    'bg-amber-50': 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    'bg-purple-50': 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
    'bg-red-50': 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
    'bg-primary-50': 'bg-primary-500/10 text-primary-600 border border-primary-500/20',
  };


  return (
    <Card padding={false} className="p-6">
      <CardHeader className="pb-5">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {actions.map((action) => (
            <button
              key={action.path}
              type="button"
              onClick={() => navigate(action.path)}
              className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200/60 p-4.5 text-left transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shadow-sm shrink-0", colorMap[action.color] || action.color)}>
                {action.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{action.label}</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-tight mt-1">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

