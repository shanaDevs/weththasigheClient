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

  async verifyPayment(orderNumber: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/payments/verify/${orderNumber}`);
    return response.data.data;
  },

  async getPaymentData(orderId: string | number): Promise<any> {
    const response = await api.get<ApiResponse<any>>(`/orders/${orderId}/payment-data`);
    return response.data.data;
  },

  async downloadInvoice(id: string | number): Promise<void> {
    const response = await api.get(`/orders/${id}/invoice`, {
      responseType: 'blob'
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

