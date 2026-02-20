import api from './client';
import type { ApiResponse, Brand } from '@/types';

export const brandService = {
    async getBrands(): Promise<Brand[]> {
        const response = await api.get<ApiResponse<Brand[]>>('/brands');
        return response.data.data;
    },

    async getBrandBySlug(slug: string): Promise<Brand> {
        const response = await api.get<ApiResponse<Brand>>(`/brands/${slug}`);
        return response.data.data;
    },
};
