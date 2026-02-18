import api from './client';
import type {
  ApiResponse,
  Product,
  ProductQueryParams,
  Pagination
} from '@/types';

interface ProductsResponse {
  products: Product[];
  pagination: Pagination;
}

export const productService = {
  async getProducts(params?: ProductQueryParams): Promise<ProductsResponse> {
    const response = await api.get<ApiResponse<ProductsResponse>>('/products', { params });
    return response.data.data;
  },

  async getProductById(id: string | number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${slug}`);
    return response.data.data;
  },

  async searchProducts(query: string, limit = 10): Promise<Product[]> {
    const response = await api.get<ApiResponse<ProductsResponse>>('/products', {
      params: { search: query, limit },
    });
    return response.data.data.products;
  },

  async getProductsByCategory(categorySlug: string, params?: ProductQueryParams): Promise<ProductsResponse> {
    const response = await api.get<ApiResponse<ProductsResponse>>('/products', {
      params: { ...params, categorySlug },
    });
    return response.data.data;
  },

  async submitOrderMoreRequest(data: { productId: number; requestedQuantity: number; note?: string }): Promise<void> {
    await api.post('/products/order-more', data);
  },
};
