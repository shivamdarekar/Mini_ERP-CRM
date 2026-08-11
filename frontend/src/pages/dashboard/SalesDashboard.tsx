import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentChallansTable } from '@/components/dashboard/RecentChallansTable';
import { FollowUpList } from '@/components/dashboard/FollowUpList';
import { RecentCustomersTable } from '@/components/dashboard/RecentCustomersTable';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import type { SalesDashboard as SalesDashboardData } from '@/types';

interface Props { data: SalesDashboardData; }

export function SalesDashboard({ data }: Props) {
  const { counts, recentChallans, upcomingFollowUps, recentCustomers, recentActivity } = data;

  const actions = [
    {
      label: 'Add Customer',
      description: 'Create a new customer',
      path: '/customers/new',
      color: 'bg-blue-50',
      icon: <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>,
    },
    {
      label: 'Create Challan',
      description: 'New sales challan',
      path: '/challans/create',
      color: 'bg-amber-50',
      icon: <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    },
    {
      label: 'View Customers',
      description: 'Browse all customers',
      path: '/customers',
      color: 'bg-primary-50',
      icon: <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard title="Customers" value={counts.activeCustomers} iconBg="bg-blue-50"
          icon={<svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <StatCard title="Follow-ups" value={upcomingFollowUps.length} iconBg="bg-amber-50" alert={upcomingFollowUps.length > 0}
          icon={<svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
        />
        <StatCard title="Confirmed" value={counts.confirmedChallans} iconBg="bg-emerald-50"
          icon={<svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <QuickActions actions={actions} />

      {/* Row 1: Follow-ups + Recent challans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FollowUpList followUps={upcomingFollowUps} />
        <RecentChallansTable challans={recentChallans} />
      </div>

      {/* Row 2: Recent customers + My activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentCustomersTable customers={recentCustomers} />
        <RecentActivityList logs={recentActivity} title="My Recent Activity" />
      </div>
    </div>
  );
}
