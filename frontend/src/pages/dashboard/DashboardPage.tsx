import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { AdminDashboard } from './AdminDashboard';
import { SalesDashboard } from './SalesDashboard';
import { WarehouseDashboard } from './WarehouseDashboard';
import { AccountsDashboard } from './AccountsDashboard';
import { getErrorMessage } from '@/utils/format';

export function DashboardPage() {
  usePageTitle('Dashboard');
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: dashboardService.getOverview,
    staleTime: 1000 * 60,
  });

  if (isLoading) return <LoadingState message="Loading dashboard..." />;
  if (isError || !data) return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;

  switch (data.role) {
    case 'ADMIN':     return <AdminDashboard data={data} />;
    case 'SALES':     return <SalesDashboard data={data} />;
    case 'WAREHOUSE': return <WarehouseDashboard data={data} />;
    case 'ACCOUNTS':  return <AccountsDashboard data={data} />;
    default:
      return <div className="p-8 text-slate-500">Unknown role: {user?.role}</div>;
  }
}
