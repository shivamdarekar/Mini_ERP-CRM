import { Navigate } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import type { Role } from '@/types';
import type { ReactNode } from 'react';

interface RoleRouteProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { role } = useRole();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
}
