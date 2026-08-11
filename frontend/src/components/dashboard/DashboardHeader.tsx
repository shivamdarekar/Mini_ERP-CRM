import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/utils/constants';

export function DashboardHeader() {
  const { user } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-5 border-b border-slate-200/50">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {user ? ROLE_LABELS[user.role] : ''} Workspace &middot; {today}
        </p>
      </div>

      {user && (
        <div className="inline-flex items-center gap-2.5 self-start sm:self-auto rounded-xl bg-white border border-slate-200/80 px-4 py-2.5 shadow-premium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            System Live &middot; <span className="text-primary-600 font-extrabold">{user.role}</span>
          </span>
        </div>
      )}
    </div>
  );

}
