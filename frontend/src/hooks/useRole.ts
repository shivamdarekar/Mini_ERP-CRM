import { useAuth } from './useAuth';
import type { Role } from '@/types';

export function useRole() {
  const { user } = useAuth();
  const role = user?.role ?? null;

  const hasRole = (...roles: Role[]): boolean => {
    return role !== null && roles.includes(role);
  };

  return {
    role,
    isAdmin: role === 'ADMIN',
    isSales: role === 'SALES',
    isWarehouse: role === 'WAREHOUSE',
    isAccounts: role === 'ACCOUNTS',
    hasRole,
    canWrite: role === 'ADMIN' || role === 'SALES',
    canManageInventory: role === 'ADMIN' || role === 'WAREHOUSE',
    canManageUsers: role === 'ADMIN',
  };
}
