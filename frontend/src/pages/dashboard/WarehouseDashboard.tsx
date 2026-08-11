import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { LowStockTable } from '@/components/dashboard/LowStockTable';
import { RecentMovementsTable } from '@/components/dashboard/RecentMovementsTable';
import { RecentProductsTable } from '@/components/dashboard/RecentProductsTable';
import type { WarehouseDashboard as WarehouseDashboardData } from '@/types';

interface Props { data: WarehouseDashboardData; }

export function WarehouseDashboard({ data }: Props) {
  const { counts, lowStockProducts, recentMovements, recentProducts } = data;

  const actions = [
    {
      label: 'Stock IN',
      description: 'Add stock to inventory',
      path: '/inventory',
      color: 'bg-emerald-50',
      icon: <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg>,
    },
    {
      label: 'Stock OUT',
      description: 'Remove stock from inventory',
      path: '/inventory',
      color: 'bg-red-50',
      icon: <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" /></svg>,
    },
    {
      label: 'Add Product',
      description: 'Create a new product',
      path: '/products/new',
      color: 'bg-primary-50',
      icon: <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
    },
    {
      label: 'View Inventory',
      description: 'Browse stock levels',
      path: '/inventory',
      color: 'bg-amber-50',
      icon: <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard title="Products" value={counts.activeProducts} iconBg="bg-primary-50"
          icon={<svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>}
        />
        <StatCard title="Low Stock" value={counts.lowStockProducts} iconBg="bg-amber-50" alert={counts.lowStockProducts > 0}
          icon={<svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
        />
        <StatCard title="Movements" value={recentMovements.length} iconBg="bg-emerald-50"
          icon={<svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>}
        />
      </div>

      <QuickActions actions={actions} />

      {/* Row 1: Low stock + Recent movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <LowStockTable products={lowStockProducts} />
        <RecentMovementsTable movements={recentMovements} />
      </div>

      {/* Row 2: Recently added/updated products */}
      <RecentProductsTable products={recentProducts} />
    </div>
  );
}
