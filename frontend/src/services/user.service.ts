import api from './api';
import type {
  ApiResponse,
  User,
  UserListParams,
  CreateUserPayload,
  UpdateUserPayload,
  PaginatedResponse,
} from '@/types';

export const userService = {
  getUsers: async (params?: UserListParams): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<User>>>('/users', { params });
    return data.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await api.post<ApiResponse<User>>('/users', payload);
    return data.data;
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>(`/users/${id}`, payload);
    return data.data;
  },

  deleteUser: async (id: string): Promise<User> => {
    const { data } = await api.delete<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },
};
