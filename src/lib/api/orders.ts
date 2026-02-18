import api from './client';
import type { 
  ApiResponse, 
  Order, 
  CreateOrderInput, 
  OrderQueryParams,
  Pagination 
} from '@/types';

interface OrdersResponse {
  orders: Order[];
  pagination: Pagination;
}

export const orderService = {
  async createOrder(data: CreateOrderInput): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data.data;
  },

  async getMyOrders(params?: OrderQueryParams): Promise<OrdersResponse> {
    const response = await api.get<ApiResponse<OrdersResponse>>('/orders/my', { params });
    return response.data.data;
  },

  async getOrderById(id: string | number): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${orderNumber}`);
    return response.data.data;
  },

  async cancelOrder(id: number, notes?: string): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(`/orders/${id}/cancel`, { notes });
    return response.data.data;
  },
};
