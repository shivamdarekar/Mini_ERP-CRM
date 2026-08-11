import api from './api';
import type { ApiResponse, AuditLog, AuditLogListParams, PaginatedResponse } from '@/types';

export const auditLogService = {
  getAuditLogs: async (params?: AuditLogListParams): Promise<PaginatedResponse<AuditLog>> => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<AuditLog>>>('/audit-logs', { params });
    return data.data;
  },
};
