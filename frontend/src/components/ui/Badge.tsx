import { cn } from '@/utils/cn';
import type { ChallanStatus, CustomerStatus, MovementType, Role } from '@/types';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-800 border border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-700 border border-rose-500/20',
  info: 'bg-blue-500/10 text-blue-700 border border-blue-500/20',
  neutral: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
  purple: 'bg-primary-500/10 text-primary-700 border border-primary-500/20',
};

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
}


// ─── Semantic badge helpers ───────────────────────────────────────────────────

export function ChallanStatusBadge({ status }: { status: ChallanStatus }) {
  const map: Record<ChallanStatus, BadgeVariant> = {
    CONFIRMED: 'success',
    DRAFT: 'warning',
    CANCELLED: 'neutral',
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const map: Record<CustomerStatus, BadgeVariant> = {
    ACTIVE: 'success',
    LEAD: 'info',
    INACTIVE: 'neutral',
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}

export function MovementTypeBadge({ type }: { type: MovementType }) {
  return (
    <Badge variant={type === 'IN' ? 'success' : 'danger'}>
      {type === 'IN' ? '▲ IN' : '▼ OUT'}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, BadgeVariant> = {
    ADMIN: 'purple',
    SALES: 'info',
    WAREHOUSE: 'warning',
    ACCOUNTS: 'success',
  };
  return <Badge variant={map[role]}>{role}</Badge>;
}
