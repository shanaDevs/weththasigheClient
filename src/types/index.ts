export interface Role {
  id: number;
  name: string;
  displayName: string;
  level: number;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  displayName: string;
  module: string;
  action: string;
  description?: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName?: string;
  userName: string;
  phone: string;
  role: Role;
  roleId?: number;
  isDisabled?: boolean;
  twoFactorEnabled?: boolean;
  authenticatedBy?: 'phone' | 'userName';
  doctorProfile?: {
    id: number;
    licenseNumber: string;
    hospitalClinic: string;
    isVerified: boolean;
  };
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  identifier?: string;  // Generic field — backend resolves to phone or userName
  phone?: string;
  userName?: string;
  password?: string;
}

export interface RegisterData {
  firstName: string;
  lastName?: string;
  userName: string;
  phone: string;
  password: string;
}

// Product Types
export interface BulkPrice {
  minQuantity: number;
  maxQuantity?: number;
  price: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
  productCount?: number;
  parentId?: number | null;
  parent?: Pick<Category, 'id' | 'name' | 'slug'>;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Discount {
  id: number;
  name: string;
  code?: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  value: string | number;
  minOrderAmount?: string | number;
  minQuantity?: number;
  maxDiscountAmount?: string | number;
  applicableTo?: 'all' | 'categories' | 'products' | 'users';
  applicableIds?: number[];
  excludedIds?: number[];
  agencyIds?: number[];
  manufacturers?: string[];
  batchIds?: number[];
  usageLimit?: number;
  usageLimitPerUser?: number;
  usedCount?: number;
  startDate?: string;
  endDate?: string;
  isAutomatic?: boolean;
  isStackable?: boolean;
  priority?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}



export interface Promotion {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  type: 'flash_sale' | 'seasonal' | 'clearance' | 'bundle' | 'bogo' | 'volume_discount' | 'new_customer' | 'loyalty' | 'banner_only';
  bannerImage?: string;
  thumbnailImage?: string;
  displayOnHomepage?: boolean;
  displayOrder?: number;
  discountType?: 'percentage' | 'fixed_amount' | 'special_price';
  discountValue?: string | number;
  applicableTo?: 'all' | 'categories' | 'products';
  productIds?: number[];
  categoryIds?: number[];
  agencyIds?: number[];
  brandIds?: number[];
  manufacturers?: string[];
  batchIds?: number[];
  minPurchaseAmount?: string | number;
  maxUsageLimit?: number;
  usedCount?: number;
  startDate: string;
  endDate: string;
  bundleProducts?: { productId: number; quantity: number }[];
  bundlePrice?: string | number;
  status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'cancelled';
  isActive?: boolean;
  termsAndConditions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Agency {
  id: number;
  name: string;
  code?: string;
  description?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  images?: string[];
  sellingPrice: string;
  retailPrice?: string;
  wholesalePrice?: string;
  distributorPrice?: string;
  costPrice?: string;
  mrp: string;
  stockQuantity: number;
  taxEnabled: boolean;
  taxPercentage: string;
  genericName?: string;
  brand?: string;
  brandId?: number;
  manufacturer?: string; //- @deprecated
  agencyId?: number;
  agency?: Agency;
  dosageForm?: string;
  strength?: string;
  packSize?: string;
  requiresPrescription: boolean;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  isMaxOrderRestricted: boolean;
  categoryId?: number;
  category?: Category;
  priority?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  status?: string;
  bulkPrices?: BulkPrice[];
}

// Cart Types
export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  originalPrice: string;
  taxPercentage: string;
  taxAmount: string;
  subtotal: string;
  total: string;
  productName: string;
  productSku: string;
  productImage?: string;
  product: {
    stockQuantity: number;
    allowBackorder: boolean;
  };
}

export interface Cart {
  id: number;
  status: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  shippingAmount: string;
  total: string;
  itemCount: number;
  couponCode?: string;
  items: CartItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
}

// Address Types
export interface Address {
  id: number;
  addressType: 'shipping' | 'billing' | 'both';
  contactName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
  isDefault: boolean;
}

export interface AddressInput {
  addressType?: 'shipping' | 'billing' | 'both';
  contactName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  landmark?: string;
  isDefault?: boolean;
}

// Order Types
export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSlug?: string;
  productSku: string;
  productImage?: string;
  quantity: number;
  unitPrice: string;
  taxAmount: string;
  subtotal: string;
  total: string;
}

export interface StatusHistory {
  previousStatus: string;
  newStatus: string;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  orderId: number;
  amount: string;
  currency?: string;
  method: string;
  status: string;
  transactionId?: string;
  provider?: string;
  providerTransactionId?: string;
  chequeNumber?: string;
  bankName?: string;
  refundedAmount?: string;
  refundReason?: string;
  refundedAt?: string;
  paidAt?: string;
  failedAt?: string;
  errorMessage?: string;
  notes?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt?: string;
  order?: {
    id: number;
    orderNumber: string;
    total: string;
    paidAmount?: string;
    dueAmount?: string;
    userId: number;
    doctorId?: number;
    paymentStatus?: string;
    status?: string;
    createdAt?: string;
    user?: {
      id: number;
      firstName: string;
      lastName?: string;
      userName: string;
      phone: string;
    };
    doctor?: {
      id: number;
      licenseNumber: string;
      hospitalClinic?: string;
      specialization?: string;
      user?: {
        id: number;
        firstName: string;
        lastName?: string;
        userName: string;
        phone: string;
      };
    };
    items?: {
      id: number;
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: string;
      total: string;
    }[];
  };
  creator?: {
    id: number;
    firstName: string;
    lastName?: string;
    userName: string;
  };
  refunder?: {
    id: number;
    firstName: string;
    lastName?: string;
    userName: string;
  };
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  shippingAmount: string;
  total: string;
  paidAmount?: string;
  dueAmount?: string;
  itemCount: number;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  expectedDeliveryDate?: string;
  cancelReason?: string;
  customerNotes?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  items: OrderItem[];
  statusHistory?: StatusHistory[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'credit' | 'failed' | 'refunded';

export interface CreateOrderInput {
  paymentMethod: 'cash' | 'card' | 'upi' | 'net_banking' | 'credit' | 'cod' | 'payhere';
  shippingAddressId?: number;
  billingAddressId?: number;
  useCredit?: boolean;
  customerNotes?: string;
}

// Doctor Types
export interface Doctor {
  id: number;
  userId?: number;
  licenseNumber: string;
  specialization?: string;
  qualification?: string;
  hospitalClinic?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  secondaryPhone?: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  licensePhoto?: string;
  isVerified?: boolean;
  isActive?: boolean;
  status: 'pending' | 'active' | 'suspended' | 'blocked' | string;
  verifiedAt?: string;
  creditLimit: string;
  creditUsed: string;
  currentCredit?: string;
  creditAvailable?: string;
  paymentTerms?: number;
  createdAt: string;
  user?: User;
}

export interface DoctorRegisterInput {
  licenseNumber: string;
  specialization?: string;
  qualification?: string;
  hospitalClinic?: string;
  address?: string;
  secondaryPhone?: string;
  gstNumber?: string;
}

export interface CreditSummary {
  creditLimit: number;
  currentCredit: number;
  availableCredit: number;
  paymentTerms: number;
  pendingOrders: {
    id: number;
    orderNumber: string;
    total: string;
    creditDueDate: string;
    createdAt: string;
  }[];
}



// Inventory & Order Request Types
export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProductBatch {
  id: number;
  productId: number;
  batchNumber: string;
  supplierId: number;
  supplier?: Supplier;
  mfgDate?: string;
  expiryDate: string;
  stockQuantity: number;
  costPrice: string;
  sellingPrice: string;
  isActive: boolean;
  createdAt: string;
}

export interface OrderRequest {
  id: number;
  userId: number;
  user?: User;
  productId: number;
  product?: Product;
  requestedQuantity: number;
  note?: string;
  status: 'pending' | 'approved' | 'partially_approved' | 'rejected';
  releasedQuantity: number;
  adminNote?: string;
  processedBy?: number;
  processedAt?: string;
  createdAt: string;
}

export interface AdminCreateUserInput {
  firstName: string;
  lastName?: string;
  userName: string;
  phone: string;
  email?: string;
  roleName: string;
  licenseNumber?: string;
  licensePhoto?: string;
  specialization?: string;
  hospitalClinic?: string;
}

// Settings Types
export interface SystemSetting {
  id: number;
  category: string;
  key: string;
  value: string;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  displayName: string;
  description?: string;
  defaultValue?: string;
  validationRules?: any;
  inputType: 'text' | 'number' | 'email' | 'textarea' | 'toggle' | 'select' | 'multiselect' | 'color' | 'file' | 'password';
  options?: any;
  placeholder?: string;
  helpText?: string;
  isPublic: boolean;
  isEditable: boolean;
  sortOrder: number;
}

export interface PublicSettings {
  site_name: string;
  site_tagline: string;
  company_name: string;
  company_phone: string;
  currency_symbol: string;
  min_order_value: number;
  free_shipping_threshold: number;
  default_shipping_charge: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: { field: string; message: string }[];
}

export interface PaginatedResponse<T, K extends string = 'items'> {
  success: boolean;
  data: {
    [key in K]: T[];
  } & {
    pagination: Pagination;
  };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query Params Types
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: number;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  manufacturer?: string;
  agencyId?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'sellingPrice' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}
