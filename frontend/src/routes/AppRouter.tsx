import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { AppLayout } from '@/components/layout/AppLayout';

// Public
import { HomePage } from '@/pages/home/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Dashboard
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

// Customers
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage';
import { CreateCustomerPage } from '@/pages/customers/CreateCustomerPage';
import { EditCustomerPage } from '@/pages/customers/EditCustomerPage';

// Products
import { ProductsPage } from '@/pages/products/ProductsPage';
import { ProductDetailPage } from '@/pages/products/ProductDetailPage';
import { CreateProductPage } from '@/pages/products/CreateProductPage';
import { EditProductPage } from '@/pages/products/EditProductPage';

// Inventory
import { InventoryPage } from '@/pages/inventory/InventoryPage';

// Challans
import { ChallansPage } from '@/pages/challans/ChallansPage';
import { ChallanDetailPage } from '@/pages/challans/ChallanDetailPage';
import { CreateChallanPage } from '@/pages/challans/CreateChallanPage';
import { EditChallanPage } from '@/pages/challans/EditChallanPage';

// Users
import { UsersPage } from '@/pages/users/UsersPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Customers */}
            <Route path="/customers" element={<RoleRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}><CustomersPage /></RoleRoute>} />
            <Route path="/customers/new" element={<RoleRoute allowedRoles={['ADMIN', 'SALES']}><CreateCustomerPage /></RoleRoute>} />
            <Route path="/customers/:id" element={<RoleRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}><CustomerDetailPage /></RoleRoute>} />
            <Route path="/customers/:id/edit" element={<RoleRoute allowedRoles={['ADMIN', 'SALES']}><EditCustomerPage /></RoleRoute>} />

            {/* Products — all roles view */}
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<RoleRoute allowedRoles={['ADMIN', 'WAREHOUSE']}><CreateProductPage /></RoleRoute>} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/products/:id/edit" element={<RoleRoute allowedRoles={['ADMIN', 'WAREHOUSE']}><EditProductPage /></RoleRoute>} />

            {/* Inventory */}
            <Route path="/inventory" element={<RoleRoute allowedRoles={['ADMIN', 'WAREHOUSE', 'ACCOUNTS']}><InventoryPage /></RoleRoute>} />

            {/* Challans — all roles view */}
            <Route path="/challans" element={<ChallansPage />} />
            <Route path="/challans/create" element={<RoleRoute allowedRoles={['ADMIN', 'SALES']}><CreateChallanPage /></RoleRoute>} />
            <Route path="/challans/:id" element={<ChallanDetailPage />} />
            <Route path="/challans/:id/edit" element={<RoleRoute allowedRoles={['ADMIN', 'SALES']}><EditChallanPage /></RoleRoute>} />

            {/* Users */}
            <Route path="/users" element={<RoleRoute allowedRoles={['ADMIN']}><UsersPage /></RoleRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
