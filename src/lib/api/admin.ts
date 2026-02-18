import api from './client';
import type {
  ApiResponse,
  Product,
  Order,
  SystemSetting,
  Category,
  AdminCreateUserInput,
  OrderRequest,
  Supplier,
  ProductBatch,
  Doctor,
  User,
  Role,
  Agency
} from '@/types';

// Types for Admin API
export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Order[];
  salesByMonth: { month: string; revenue: number; orders: number }[];
  topProducts: { product: Product; totalSold: number; revenue: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  agencyId?: number;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  rangeType?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PromotionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  isActive?: boolean;
  search?: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  roleId?: number;
  isActive?: boolean;
  search?: string;
}

export interface Promotion {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: string;
  bannerImage?: string;
  discountType?: string;
  discountValue?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: string;
  displayOrder?: number;
  createdAt: string;
}

export interface CreatePromotionData {
  name: string;
  description?: string;
  type: string;
  discountType?: string;
  discountValue?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  productIds?: number[];
  categoryIds?: number[];
  bannerImage?: string;
  displayOrder?: number;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: string;
  averageOrderValue: string;
  statusBreakdown: Record<string, number>;
}

// Admin API Service
export const adminApi = {
  // Dashboard
  async getDashboardStats(): Promise<AdminStats> {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        api.get<ApiResponse<{ orders: Order[]; pagination: { total: number } }>>('/orders', {
          params: { limit: 5, page: 1 }
        }),
        api.get<ApiResponse<{ products: Product[]; pagination: { total: number } }>>('/products/admin', {
          params: { limit: 10 }
        }),
      ]);

      return {
        totalRevenue: 0,
        totalOrders: ordersRes.data.data?.pagination?.total || 0,
        totalProducts: productsRes.data.data?.pagination?.total || 0,
        totalUsers: 0,
        recentOrders: ordersRes.data.data?.orders || [],
        salesByMonth: [],
        topProducts: [],
      };
    } catch {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0,
        recentOrders: [],
        salesByMonth: [],
        topProducts: [],
      };
    }
  },

  async getOrderStats(startDate?: string, endDate?: string): Promise<OrderStats> {
    const response = await api.get<ApiResponse<OrderStats>>('/orders/stats', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  // Products
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const response = await api.get<ApiResponse<{ products: Product[]; pagination: PaginatedResponse<Product>['pagination'] }>>('/products/admin', {
      params: filters,
    });
    return {
      data: response.data.data?.products || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  async getProduct(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data.data;
  },

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data;
  },

  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async getLowStockProducts(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/products/low-stock');
    return response.data.data || [];
  },

  // Orders
  async getOrders(filters: OrderFilters = {}): Promise<PaginatedResponse<Order>> {
    const response = await api.get<ApiResponse<{ orders: Order[]; pagination: PaginatedResponse<Order>['pagination'] }>>('/orders', {
      params: filters,
    });
    return {
      data: response.data.data?.orders || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  async getOrder(id: number): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<Order> {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status, notes });
    return response.data.data;
  },

  async downloadOrdersExcel(filters: OrderFilters = {}): Promise<{ blob: Blob; fileName: string }> {
    const response = await api.get<Blob>('/orders/download/excel', {
      params: filters,
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] || '';
    const fileNameMatch = disposition.match(/filename="?([^";]+)"?/i);
    const fileName = fileNameMatch?.[1] || `orders_${new Date().toISOString().split('T')[0]}.xlsx`;

    return { blob: response.data, fileName };
  },

  // Promotions
  async getPromotions(filters: PromotionFilters = {}): Promise<PaginatedResponse<Promotion>> {
    const response = await api.get<ApiResponse<{ promotions: Promotion[]; pagination: PaginatedResponse<Promotion>['pagination'] }>>('/promotions', {
      params: filters,
    });
    return {
      data: response.data.data?.promotions || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  async getPromotion(id: number): Promise<Promotion> {
    const response = await api.get<ApiResponse<Promotion>>(`/promotions/${id}`);
    return response.data.data;
  },

  async createPromotion(data: CreatePromotionData): Promise<Promotion> {
    const response = await api.post<ApiResponse<Promotion>>('/promotions', data);
    return response.data.data;
  },

  async updatePromotion(id: number, data: Partial<CreatePromotionData>): Promise<Promotion> {
    const response = await api.put<ApiResponse<Promotion>>(`/promotions/${id}`, data);
    return response.data.data;
  },

  async deletePromotion(id: number): Promise<void> {
    await api.delete(`/promotions/${id}`);
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data.data || [];
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const response = await api.post<ApiResponse<Category>>('/categories', data);
    return response.data.data;
  },

  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  // Upload
  async uploadProductImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post<ApiResponse<{ images: string[]; count: number }>>('/upload/product-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.images;
  },

  async uploadCategoryImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<ApiResponse<{ url: string; publicId: string }>>('/upload/product-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.url;
  },

  // Users/Doctors
  async getDoctors(filters: UserFilters = {}): Promise<PaginatedResponse<Doctor>> {
    const response = await api.get<ApiResponse<{ doctors: Doctor[]; pagination: PaginatedResponse<Doctor>['pagination'] }>>('/doctors', {
      params: filters,
    });
    return {
      data: response.data.data?.doctors || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  async getDoctor(id: number): Promise<Doctor> {
    const response = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return response.data.data;
  },

  async updateDoctor(id: number, data: Partial<Doctor>): Promise<Doctor> {
    const response = await api.put<ApiResponse<Doctor>>(`/doctors/${id}`, data);
    return response.data.data;
  },

  async updateDoctorStatus(id: number, isActive: boolean): Promise<Doctor> {
    const response = await api.patch<ApiResponse<Doctor>>(`/doctors/${id}/status`, { isActive });
    return response.data.data;
  },

  async updateDoctorCredit(id: number, creditLimit: number): Promise<Doctor> {
    const response = await api.patch<ApiResponse<Doctor>>(`/doctors/${id}/credit`, { creditLimit });
    return response.data.data;
  },

  // Users
  async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const response = await api.get<ApiResponse<{ users: User[]; pagination: PaginatedResponse<User>['pagination'] }>>('/users', {
      params: filters,
    });
    return {
      data: response.data.data?.users || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  async updateUserStatus(id: number, isDisabled: boolean): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/status`, { isDisabled });
    return response.data.data;
  },

  // Settings
  async getSettings(category?: string, search?: string): Promise<{ settings: SystemSetting[]; grouped: Record<string, SystemSetting[]> }> {
    const response = await api.get<ApiResponse<{ settings: SystemSetting[]; grouped: Record<string, SystemSetting[]> }>>('/settings', {
      params: { category, search },
    });
    return response.data.data;
  },

  async bulkUpdateSettings(settings: { key: string; value: any }[]): Promise<void> {
    await api.post('/settings/bulk', { settings });
  },

  // Admin User/Doctor Creation
  async adminCreateUser(data: AdminCreateUserInput): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/users/admin/create-user', data);
    return response.data.data;
  },

  // Order Requests (Order More)
  async getOrderRequests(filters: { status?: string; page?: number; limit?: number } = {}): Promise<PaginatedResponse<OrderRequest>> {
    const response = await api.get<ApiResponse<{ requests: OrderRequest[]; pagination: PaginatedResponse<OrderRequest>['pagination'] }>>('/products/admin/order-requests', {
      params: filters,
    });
    return {
      data: response.data.data?.requests || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  },

  async processOrderRequest(id: number, data: { status: string; releasedQuantity: number; adminNote?: string }): Promise<OrderRequest> {
    const response = await api.patch<ApiResponse<OrderRequest>>(`/products/admin/order-requests/${id}`, data);
    return response.data.data;
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const response = await api.get<ApiResponse<Supplier[]>>('/products/suppliers');
    return response.data.data || [];
  },

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const response = await api.post<ApiResponse<Supplier>>('/products/suppliers', data);
    return response.data.data;
  },

  // Product Batches
  async getProductBatches(productId: number): Promise<ProductBatch[]> {
    const response = await api.get<ApiResponse<ProductBatch[]>>(`/products/${productId}/batches`);
    return response.data.data || [];
  },

  async addProductBatch(productId: number, data: Partial<ProductBatch>): Promise<ProductBatch> {
    const response = await api.post<ApiResponse<ProductBatch>>(`/products/${productId}/batches`, data);
    return response.data.data;
  },

  // Agencies
  async getAgencies(): Promise<Agency[]> {
    const response = await api.get<ApiResponse<Agency[]>>('/agencies');
    return response.data.data || [];
  },

  async createAgency(data: Partial<Agency>): Promise<Agency> {
    const response = await api.post<ApiResponse<Agency>>('/agencies', data);
    return response.data.data;
  },

  async updateAgency(id: number, data: Partial<Agency>): Promise<Agency> {
    const response = await api.put<ApiResponse<Agency>>(`/agencies/${id}`, data);
    return response.data.data;
  },
};

export default adminApi;
