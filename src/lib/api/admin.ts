import api from './client';
import type {
  ApiResponse,
  Product,
  Order,
  Payment,
  SystemSetting,
  Category,
  AdminCreateUserInput,
  OrderRequest,
  Supplier,
  ProductBatch,
  Doctor,
  User,
  Role,
  Permission,
  Agency,
  Discount,
  Brand,
  Promotion
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


export interface CreatePromotionData {
  name: string;
  description?: string;
  type: Promotion['type'];
  discountType?: Promotion['discountType'];
  discountValue?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  productIds?: number[];
  categoryIds?: number[];
  agencyIds?: number[];
  brandIds?: number[];
  manufacturers?: string[];
  batchIds?: number[];
  applicableTo?: string;
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
    return this.uploadImage(file);
  },

  async uploadImage(file: File): Promise<string> {
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

  async verifyDoctor(id: number, data: { status: 'approved' | 'rejected'; notes?: string; creditLimit?: number; paymentTerms?: number }): Promise<void> {
    await api.post(`/doctors/${id}/verify`, data);
  },

  async updateDoctorCredit(id: number, creditLimit: number): Promise<void> {
    await api.patch(`/doctors/${id}/credit-limit`, { creditLimit });
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
  async getOrderRequests(filters: { status?: string; page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResponse<OrderRequest>> {
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


  // Product Batches
  async getProductBatches(productId: number): Promise<ProductBatch[]> {
    const response = await api.get<ApiResponse<ProductBatch[]>>(`/products/${productId}/batches`);
    return response.data.data || [];
  },

  async addProductBatch(productId: number, data: Partial<ProductBatch>): Promise<ProductBatch> {
    const response = await api.post<ApiResponse<ProductBatch>>(`/products/${productId}/batches`, data);
    return response.data.data;
  },

  async updateProductBatch(batchId: number, data: Partial<ProductBatch>): Promise<ProductBatch> {
    const response = await api.put<ApiResponse<ProductBatch>>(`/products/batches/${batchId}`, data);
    return response.data.data;
  },

  async deleteProductBatch(batchId: number): Promise<void> {
    await api.delete(`/products/batches/${batchId}`);
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

  async deleteAgency(id: number): Promise<void> {
    await api.delete(`/agencies/${id}`);
  },

  // Roles & Permissions
  async getRoles(): Promise<Role[]> {
    const response = await api.get<ApiResponse<Role[]>>('/roles');
    return response.data.data || [];
  },

  async getPermissions(): Promise<Permission[]> {
    const response = await api.get<ApiResponse<Permission[]>>('/roles/permissions');
    return response.data.data || [];
  },

  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await api.put(`/roles/${roleId}/permissions`, { permissionIds });
  },

  // Categories
  async getCategories(params?: { includeInactive?: boolean; flat?: boolean }): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/categories', {
      params: { ...params, includeInactive: params?.includeInactive ? 'true' : undefined, flat: params?.flat ? 'true' : undefined }
    });
    return response.data.data || [];
  },

  async getCategory(id: number): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
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

  async reorderCategories(orders: { id: number; sortOrder: number }[]): Promise<void> {
    await api.post('/categories/reorder', { categories: orders });
  },

  async getCategoryProducts(categoryId: number, params?: { page?: number; limit?: number }): Promise<{ products: Product[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const response = await api.get<ApiResponse<{ products: Product[]; pagination: any }>>(`/categories/${categoryId}/products`, { params });
    return response.data.data as any;
  },

  // Discounts
  async getDiscounts(params?: { page?: number; limit?: number; type?: string; isActive?: boolean; search?: string }): Promise<{ discounts: Discount[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const response = await api.get<ApiResponse<any>>('/discounts', { params });
    return response.data.data;
  },

  async getDiscount(id: number): Promise<Discount & { stats: { orderCount: number; totalSaved: number } }> {
    const response = await api.get<ApiResponse<any>>(`/discounts/${id}`);
    return response.data.data;
  },

  async createDiscount(data: Partial<Discount>): Promise<Discount> {
    const response = await api.post<ApiResponse<Discount>>('/discounts', data);
    return response.data.data;
  },

  async updateDiscount(id: number, data: Partial<Discount>): Promise<Discount> {
    const response = await api.put<ApiResponse<Discount>>(`/discounts/${id}`, data);
    return response.data.data;
  },

  async deleteDiscount(id: number): Promise<void> {
    await api.delete(`/discounts/${id}`);
  },

  async validateDiscountCode(code: string, cartTotal: number, items: any[] = []): Promise<{ valid: boolean; discountAmount?: number; data?: Partial<Discount> }> {
    const response = await api.post<any>('/discounts/validate', { code, cartTotal, items });
    return response.data;
  },

  // Brands / Manufacturers
  async getManufacturers(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/products/manufacturers');
    return response.data.data;
  },

  async getBrands(): Promise<Brand[]> {
    const response = await api.get<ApiResponse<Brand[]>>('/brands');
    return response.data.data;
  },

  async createBrand(data: Partial<Brand>): Promise<Brand> {
    const response = await api.post<ApiResponse<Brand>>('/brands', data);
    return response.data.data;
  },

  async updateBrand(id: number, data: Partial<Brand>): Promise<Brand> {
    const response = await api.put<ApiResponse<Brand>>(`/brands/${id}`, data);
    return response.data.data;
  },

  async deleteBrand(id: number): Promise<void> {
    await api.delete(`/brands/${id}`);
  },

  async resendUserVerification(id: number): Promise<void> {
    await api.post('/users/admin/resend-verification', { id });
  },

  async resendDoctorVerification(id: number): Promise<{ sentTo: string }> {
    const response = await api.post<ApiResponse<{ sentTo: string }>>('/users/admin/resend-doctor-verification', { id });
    return response.data.data;
  },

  // Suppliers
  async getSuppliers(params?: any): Promise<any> {
    const response = await api.get('/suppliers', { params });
    return response.data.data;
  },

  async getSupplier(id: number): Promise<any> {
    const response = await api.get(`/suppliers/${id}`);
    return response.data.data;
  },

  async createSupplier(data: any): Promise<any> {
    const response = await api.post('/suppliers', data);
    return response.data.data;
  },

  async updateSupplier(id: number, data: any): Promise<any> {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data.data;
  },

  async deleteSupplier(id: number): Promise<any> {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data.data;
  },

  // Purchase Orders
  async getPurchaseOrders(params?: any): Promise<any> {
    const response = await api.get('/purchase-orders', { params });
    return response.data.data;
  },

  async getPurchaseOrder(id: number): Promise<any> {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data.data;
  },

  async createPurchaseOrder(data: any): Promise<any> {
    const response = await api.post('/purchase-orders', data);
    return response.data.data;
  },

  // Payments
  async getPayments(filters: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    doctorId?: number;
    userId?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<PaginatedResponse<Payment>> {
    const response = await api.get<ApiResponse<{ payments: Payment[]; pagination: PaginatedResponse<Payment>['pagination'] }>>('/payments', {
      params: filters,
    });
    return {
      data: response.data.data?.payments || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  async getPaymentStats(startDate?: string, endDate?: string): Promise<{
    totalPaid: number;
    totalRefunds: number;
    totalOutstanding: number;
    netPayments: number;
    byMethod: { method: string; count: number; total: number }[];
  }> {
    const response = await api.get<ApiResponse<any>>('/payments/stats', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  async getOrderPayments(orderId: number): Promise<Payment[]> {
    const response = await api.get<ApiResponse<Payment[]>>(`/payments/order/${orderId}`);
    return response.data.data || [];
  },

  async addPayment(orderId: number, data: { amount: number; method: string; transactionId?: string; notes?: string }): Promise<any> {
    const response = await api.post<ApiResponse<any>>(`/payments/order/${orderId}`, data);
    return response.data.data;
  },

  async processRefund(paymentId: number, data: { amount?: number; reason: string }): Promise<any> {
    const response = await api.post<ApiResponse<any>>(`/payments/${paymentId}/refund`, data);
    return response.data.data;
  },

  async settleDoctorOutstanding(doctorId: number, data: { amount: number; method: string; transactionId?: string; notes?: string }): Promise<any> {
    const response = await api.post<ApiResponse<any>>(`/doctors/${doctorId}/settle`, data);
    return response.data;
  },
};


export default adminApi;
