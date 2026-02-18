import api from './client';
import type { ApiResponse, Category } from '@/types';

interface CategoriesParams {
  hierarchical?: boolean;
  activeOnly?: boolean;
}

export const categoryService = {
  async getCategories(params?: CategoriesParams): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/categories', { params });
    return response.data.data;
  },

  async getCategoryBySlug(slug: string): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/categories/${slug}`);
    return response.data.data;
  },

  async getCategoryById(id: number): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
  },
};
