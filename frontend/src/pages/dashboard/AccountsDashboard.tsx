import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RecentChallansTable } from '@/components/dashboard/RecentChallansTable';
import { RecentCustomersTable } from '@/components/dashboard/RecentCustomersTable';
import { formatCurrency } from '@/utils/format';
import type { AccountsDashboard as AccountsDashboardData } from '@/types';

interface Props { data: AccountsDashboardData; }

export function AccountsDashboard({ data }: Props) {
  const { counts, confirmedChallans, salesSummary, recentCustomers } = data;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Customers" value={counts.activeCustomers} iconBg="bg-blue-50"
          icon={<svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <StatCard title="Confirmed" value={counts.confirmedChallans} iconBg="bg-emerald-50"
          icon={<svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="Draft" value={counts.draftChallans} iconBg="bg-amber-50"
          icon={<svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
        />
        <StatCard
          title="Total Sales (30d)"
          value={salesSummary.totalAmount ? formatCurrency(salesSummary.totalAmount) : '—'}
          iconBg="bg-primary-50"
          icon={<svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Row 1: Recent confirmed challans + recent customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentChallansTable challans={confirmedChallans} />
        <RecentCustomersTable customers={recentCustomers} />
      </div>
    </div>
  );
}
