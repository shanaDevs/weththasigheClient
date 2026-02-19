import api from './client';
import type {
  ApiResponse,
  Doctor,
  DoctorRegisterInput,
  CreditSummary,
  Address,
  AddressInput
} from '@/types';

export const doctorService = {
  async registerAsDoctor(data: DoctorRegisterInput): Promise<Doctor> {
    const response = await api.post<ApiResponse<Doctor>>('/doctors/register', data);
    return response.data.data;
  },

  async getProfile(): Promise<Doctor> {
    const response = await api.get<ApiResponse<Doctor>>('/doctors/me');
    return response.data.data;
  },

  async updateProfile(data: Partial<DoctorRegisterInput & { fullName?: string; phone?: string; clinicName?: string }>): Promise<Doctor> {
    const response = await api.put<ApiResponse<Doctor>>('/doctors/me', data);
    return response.data.data;
  },

  async getCreditSummary(): Promise<CreditSummary> {
    const response = await api.get<ApiResponse<CreditSummary>>('/doctors/credit');
    return response.data.data;
  },

  // Address management
  async getAddresses(): Promise<Address[]> {
    const response = await api.get<ApiResponse<Address[]>>('/doctors/addresses');
    return response.data.data;
  },

  async createAddress(data: AddressInput): Promise<Address> {
    const response = await api.post<ApiResponse<Address>>('/doctors/addresses', data);
    return response.data.data;
  },

  async updateAddress(id: number, data: Partial<AddressInput>): Promise<Address> {
    const response = await api.put<ApiResponse<Address>>(`/doctors/addresses/${id}`, data);
    return response.data.data;
  },

  async setDefaultAddress(id: number): Promise<Address> {
    const response = await api.put<ApiResponse<Address>>(`/doctors/addresses/${id}/default`, {});
    return response.data.data;
  },

  async deleteAddress(id: number): Promise<void> {
    await api.delete(`/doctors/addresses/${id}`);
  },

  async settleOutstanding(data: { amount: number; method: string; transactionId?: string; notes?: string }): Promise<any> {
    const response = await api.post<ApiResponse<any>>('/doctors/me/settle', data);
    return response.data;
  },

  async getMyPayments(params: { page?: number; limit?: number } = {}): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/payments/my-payments', { params });
    return response.data;
  },
};


