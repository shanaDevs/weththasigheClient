import api from './client';
import type { ApiResponse, Agency } from '@/types';

export const agencyService = {
    async getAgencies(): Promise<Agency[]> {
        const response = await api.get<ApiResponse<Agency[]>>('/agencies');
        return response.data.data;
    },

    async getAgencyById(id: number): Promise<Agency> {
        const response = await api.get<ApiResponse<Agency>>(`/agencies/${id}`);
        return response.data.data;
    },
};
