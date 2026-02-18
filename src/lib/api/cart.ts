import api from './client';
import type { ApiResponse, Cart } from '@/types';

interface CouponResponse {
  subtotal: string;
  discountAmount: string;
  total: string;
}

export const cartService = {
  async getCart(): Promise<Cart> {
    const response = await api.get<ApiResponse<Cart>>('/cart');
    return response.data.data;
  },

  async addToCart(productId: number, quantity: number): Promise<Cart> {
    const response = await api.post<ApiResponse<Cart>>('/cart/items', {
      productId,
      quantity,
    });
    return response.data.data;
  },

  async updateCartItem(itemId: number, quantity: number): Promise<Cart> {
    const response = await api.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, {
      quantity,
    });
    return response.data.data;
  },

  async removeFromCart(itemId: number): Promise<Cart> {
    const response = await api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`);
    return response.data.data;
  },

  async clearCart(): Promise<void> {
    await api.delete('/cart');
  },

  async applyCoupon(couponCode: string): Promise<CouponResponse & { message: string }> {
    const response = await api.post<ApiResponse<CouponResponse> & { message: string }>('/cart/coupon', {
      couponCode,
    });
    return { ...response.data.data, message: response.data.message || '' };
  },

  async removeCoupon(): Promise<Cart> {
    const response = await api.delete<ApiResponse<Cart>>('/cart/coupon');
    return response.data.data;
  },

  async setAddresses(shippingAddressId: number, billingAddressId?: number): Promise<Cart> {
    const response = await api.put<ApiResponse<Cart>>('/cart/addresses', {
      shippingAddressId,
      billingAddressId: billingAddressId || shippingAddressId,
    });
    return response.data.data;
  },
};
