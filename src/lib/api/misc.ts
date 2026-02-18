import api from './client';
import type { ApiResponse, Discount, Promotion, PublicSettings, Product, Pagination } from '@/types';

interface ValidateDiscountInput {
  code: string;
  cartTotal: number;
  itemCount: number;
}

interface ValidateDiscountResponse {
  valid: boolean;
  data?: Discount;
}

interface PromotionProductsResponse {
  products: Product[];
  pagination: Pagination;
}

export const discountService = {
  async validateDiscount(data: ValidateDiscountInput): Promise<ValidateDiscountResponse> {
    const response = await api.post<ApiResponse<Discount> & { valid: boolean }>('/discounts/validate', data);
    return {
      valid: response.data.valid || response.data.success,
      data: response.data.data,
    };
  },
};

export const promotionService = {
  async getActivePromotions(): Promise<Promotion[]> {
    const response = await api.get<ApiResponse<Promotion[]>>('/promotions/active');
    return response.data.data;
  },

  async getPromotionProducts(id: number, page = 1, limit = 20): Promise<PromotionProductsResponse> {
    const response = await api.get<ApiResponse<PromotionProductsResponse>>(`/promotions/${id}/products`, {
      params: { page, limit },
    });
    return response.data.data;
  },
};

export const settingsService = {
  async getPublicSettings(): Promise<PublicSettings> {
    const response = await api.get<ApiResponse<PublicSettings>>('/settings/public');
    return response.data.data;
  },
};
