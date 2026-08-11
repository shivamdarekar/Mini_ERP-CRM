import api from './api';
import type { ApiResponse, DashboardData } from '@/types';

export const dashboardService = {
  getOverview: async (): Promise<DashboardData> => {
    const { data } = await api.get<ApiResponse<DashboardData>>('/dashboard/overview');
    return data.data;
  },
};
