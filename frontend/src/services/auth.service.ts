import api from './api';
import type { ApiResponse, AuthUser, LoginPayload, LoginResponse, UpdateProfilePayload, ChangePasswordPayload } from '@/types';

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', payload);
    return data.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me');
    return data.data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<AuthUser> => {
    const { data } = await api.patch<ApiResponse<AuthUser>>('/auth/me', payload);
    return data.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const { data } = await api.patch<ApiResponse<{ message: string }>>('/auth/password', payload);
    return data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
};
