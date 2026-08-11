import api from './api';
import type {
  ApiResponse,
  Challan,
  ChallanListParams,
  CreateChallanPayload,
  UpdateChallanPayload,
  StockMovement,
  AuditLog,
  PaginatedResponse,
} from '@/types';

interface ConfirmChallanResult {
  challan: Challan;
  stockMovements: StockMovement[];
}

interface ChallanHistoryResult {
  challan: Challan;
  auditLogs: AuditLog[];
  stockMovements: StockMovement[];
}

export const challanService = {
  getChallans: async (params?: ChallanListParams): Promise<PaginatedResponse<Challan>> => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Challan>>>('/challans', { params });
    return data.data;
  },

  getChallanById: async (id: string): Promise<Challan> => {
    const { data } = await api.get<ApiResponse<Challan>>(`/challans/${id}`);
    return data.data;
  },

  createChallan: async (payload: CreateChallanPayload): Promise<Challan> => {
    const { data } = await api.post<ApiResponse<Challan>>('/challans', payload);
    return data.data;
  },

  updateChallan: async (id: string, payload: UpdateChallanPayload): Promise<Challan> => {
    const { data } = await api.patch<ApiResponse<Challan>>(`/challans/${id}`, payload);
    return data.data;
  },

  confirmChallan: async (id: string): Promise<ConfirmChallanResult> => {
    const { data } = await api.post<ApiResponse<ConfirmChallanResult>>(`/challans/${id}/confirm`);
    return data.data;
  },

  cancelChallan: async (id: string): Promise<Challan> => {
    const { data } = await api.post<ApiResponse<Challan>>(`/challans/${id}/cancel`);
    return data.data;
  },

  getChallanHistory: async (id: string): Promise<ChallanHistoryResult> => {
    const { data } = await api.get<ApiResponse<ChallanHistoryResult>>(`/challans/${id}/history`);
    return data.data;
  },
};
