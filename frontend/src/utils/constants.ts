import type { Role } from '@/types';

// ─── Storage keys ─────────────────────────────────────────────────────────────

export const AUTH_TOKEN_KEY = 'erp_token';
export const AUTH_USER_KEY = 'erp_user';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const QUERY_KEYS = {
  dashboard: ['dashboard'] as const,
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,
  customerFollowUps: (id: string) => ['customers', id, 'follow-ups'] as const,
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  inventory: ['inventory'] as const,
  inventoryProduct: (id: string) => ['inventory', 'products', id] as const,
  movements: ['inventory', 'movements'] as const,
  lowStock: ['inventory', 'low-stock'] as const,
  challans: ['challans'] as const,
  challan: (id: string) => ['challans', id] as const,
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  auditLogs: ['audit-logs'] as const,
  customerActivity: (id: string) => ['customers', id, 'activity'] as const,
} as const;

// ─── Role labels ──────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  SALES: 'Sales',
  WAREHOUSE: 'Warehouse',
  ACCOUNTS: 'Accounts',
};

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  SALES: 'bg-blue-100 text-blue-700',
  WAREHOUSE: 'bg-amber-100 text-amber-700',
  ACCOUNTS: 'bg-green-100 text-green-700',
};

// ─── Navigation per role ──────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
    { label: 'Users', path: '/users', icon: 'users' },
    { label: 'Customers', path: '/customers', icon: 'user-check' },
    { label: 'Products', path: '/products', icon: 'package' },
    { label: 'Inventory', path: '/inventory', icon: 'archive' },
    { label: 'Challans', path: '/challans', icon: 'file-text' },
  ],
  SALES: [
    { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
    { label: 'Customers', path: '/customers', icon: 'user-check' },
    { label: 'Products', path: '/products', icon: 'package' },
    { label: 'Challans', path: '/challans', icon: 'file-text' },
  ],
  WAREHOUSE: [
    { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
    { label: 'Products', path: '/products', icon: 'package' },
    { label: 'Inventory', path: '/inventory', icon: 'archive' },
    { label: 'Challans', path: '/challans', icon: 'file-text' },
  ],
  ACCOUNTS: [
    { label: 'Dashboard', path: '/dashboard', icon: 'grid' },
    { label: 'Customers', path: '/customers', icon: 'user-check' },
    { label: 'Products', path: '/products', icon: 'package' },
    { label: 'Inventory', path: '/inventory', icon: 'archive' },
    { label: 'Challans', path: '/challans', icon: 'file-text' },
  ],
};
