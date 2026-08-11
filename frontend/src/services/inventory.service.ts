import api from './api';
import type {
  ApiResponse,
  Product,
  StockMovement,
  StockInPayload,
  StockOutPayload,
  MovementListParams,
  PaginatedResponse,
} from '@/types';

interface StockOperationResult {
  product: Product;
  movement: StockMovement;
}

interface InventoryProductDetail {
  product: Product;
  isLowStock: boolean;
  recentMovements: StockMovement[];
}

export const inventoryService = {
  stockIn: async (payload: StockInPayload): Promise<StockOperationResult> => {
    const { data } = await api.post<ApiResponse<StockOperationResult>>(
      '/inventory/stock-in',
      payload
    );
    return data.data;
  },

  stockOut: async (payload: StockOutPayload): Promise<StockOperationResult> => {
    const { data } = await api.post<ApiResponse<StockOperationResult>>(
      '/inventory/stock-out',
      payload
    );
    return data.data;
  },

  getMovements: async (params?: MovementListParams): Promise<PaginatedResponse<StockMovement>> => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<StockMovement>>>(
      '/inventory/movements',
      { params }
    );
    return data.data;
  },

  getProductDetail: async (productId: string): Promise<InventoryProductDetail> => {
    const { data } = await api.get<ApiResponse<InventoryProductDetail>>(
      `/inventory/products/${productId}`
    );
    return data.data;
  },

  getLowStock: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Product>> => {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Product>>>(
      '/inventory/low-stock',
      { params }
    );
    return data.data;
  },
};
