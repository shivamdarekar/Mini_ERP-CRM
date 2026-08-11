import api from './api';
import type {
  ApiResponse,
  Customer,
  CustomerListParams,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  FollowUpNote,
  CustomerActivityResult,
  PaginatedResponse,
} from '@/types';

export const customerService = {
  getCustomers: async (params?: CustomerListParams): Promise<PaginatedResponse<Customer>> => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params });
    return data.data;
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    const { data } = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return data.data;
  },

  getCustomerActivity: async (id: string): Promise<CustomerActivityResult> => {
    const { data } = await api.get<ApiResponse<CustomerActivityResult>>(`/customers/${id}/activity`);
    return data.data;
  },

  createCustomer: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const { data } = await api.post<ApiResponse<Customer>>('/customers', payload);
    return data.data;
  },

  updateCustomer: async (id: string, payload: UpdateCustomerPayload): Promise<Customer> => {
    const { data } = await api.patch<ApiResponse<Customer>>(`/customers/${id}`, payload);
    return data.data;
  },

  addFollowUp: async (customerId: string, content: string): Promise<FollowUpNote> => {
    const { data } = await api.post<ApiResponse<FollowUpNote>>(
      `/customers/${customerId}/follow-ups`,
      { content }
    );
    return data.data;
  },

  getFollowUps: async (customerId: string): Promise<FollowUpNote[]> => {
    const { data } = await api.get<ApiResponse<FollowUpNote[]>>(
      `/customers/${customerId}/follow-ups`
    );
    return data.data;
  },
};
