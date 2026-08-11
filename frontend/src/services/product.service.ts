import api from './api';
import type {
  ApiResponse,
  Product,
  ProductListParams,
  CreateProductPayload,
  UpdateProductPayload,
  PaginatedResponse,
} from '@/types';

export const productService = {
  getProducts: async (params?: ProductListParams): Promise<PaginatedResponse<Product>> => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Product>>>('/products', { params });
    return data.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return data.data;
  },

  createProduct: async (payload: CreateProductPayload): Promise<Product> => {
    const { data } = await api.post<ApiResponse<Product>>('/products', payload);
    return data.data;
  },

  updateProduct: async (id: string, payload: UpdateProductPayload): Promise<Product> => {
    const { data } = await api.patch<ApiResponse<Product>>(`/products/${id}`, payload);
    return data.data;
  },
};
