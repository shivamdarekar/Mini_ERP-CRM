// ─── Auth ─────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ─── API wrapper ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, 'ADMIN'>;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  createdByUser: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface CreateCustomerPayload {
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  isActive?: boolean;
}

export type UpdateProductPayload = Partial<Omit<CreateProductPayload, 'currentStock'>>;

// ─── Stock Movement ───────────────────────────────────────────────────────────

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: MovementType;
  reason: string;
  createdBy: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  createdByUser: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface StockInPayload {
  productId: string;
  quantity: number;
  reason: string;
}

export interface StockOutPayload {
  productId: string;
  quantity: number;
  reason: string;
}

// ─── Challan ──────────────────────────────────────────────────────────────────

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  total: string;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  totalAmount: string;
  status: ChallanStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    businessName: string;
    mobile: string;
    email: string;
    customerType?: CustomerType;
    status?: CustomerStatus;
  };
  createdByUser: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  items?: ChallanItem[];
}

export interface CreateChallanPayload {
  customerId: string;
  items: { productId: string; quantity: number }[];
}

export interface UpdateChallanPayload {
  customerId?: string;
  items?: { productId: string; quantity: number }[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardCounts {
  activeCustomers: number;
  activeProducts: number;
  totalUsers: number;
  draftChallans: number;
  confirmedChallans: number;
  lowStockProducts: number;
}

export interface UpcomingFollowUp {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  status: CustomerStatus;
  followUpDate: string;
  createdAt: string;
}

export interface AdminDashboard {
  role: 'ADMIN';
  counts: DashboardCounts;
  recentAuditLogs: AuditLog[];
  recentMovements: StockMovement[];
  recentChallans: Challan[];
  recentUsers: User[];
  lowStockProducts: Product[];
  upcomingFollowUps: UpcomingFollowUp[];
}

export interface SalesDashboard {
  role: 'SALES';
  counts: DashboardCounts;
  recentCustomers: Customer[];
  recentChallans: Challan[];
  followUps: FollowUpNote[];
  recentActivity: AuditLog[];
  upcomingFollowUps: UpcomingFollowUp[];
}

export interface WarehouseDashboard {
  role: 'WAREHOUSE';
  counts: DashboardCounts;
  lowStockProducts: Product[];
  recentMovements: StockMovement[];
  recentProducts: Product[];
  upcomingFollowUps: UpcomingFollowUp[];
}

export interface AccountsDashboard {
  role: 'ACCOUNTS';
  counts: DashboardCounts;
  confirmedChallans: Challan[];
  recentCustomers: Customer[];
  salesSummary: {
    count: number;
    totalAmount: string | null;
  };
  upcomingFollowUps: UpcomingFollowUp[];
}

export type DashboardData =
  | AdminDashboard
  | SalesDashboard
  | WarehouseDashboard
  | AccountsDashboard;

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  description?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

export interface ChallanListParams {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  status?: ChallanStatus;
  createdBy?: string;
  from?: string;
  to?: string;
}

export interface MovementListParams {
  page?: number;
  limit?: number;
  productId?: string;
  type?: MovementType;
  createdBy?: string;
  from?: string;
  to?: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
}

export interface CustomerActivityResult {
  customer: Customer;
  auditLogs: AuditLog[];
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
