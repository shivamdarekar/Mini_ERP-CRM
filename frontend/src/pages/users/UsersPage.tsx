import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userService } from '@/services/user.service';
import { QUERY_KEYS } from '@/utils/constants';
import { useAppToast } from '@/components/layout/AppLayout';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { RoleBadge, Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate, getErrorMessage } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Role, User } from '@/types';


const LIMIT = 10;

// ─── Create user schema ───────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['SALES', 'WAREHOUSE', 'ACCOUNTS'], 'Select a role'),
});

type CreateFormValues = z.infer<typeof createSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function UsersPage() {
  usePageTitle('Users');
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const queryKey = [...QUERY_KEYS.users, { page, search: debouncedSearch, role: roleFilter }];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      userService.getUsers({
        page,
        limit: LIMIT,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      }),
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  // ── Create mutation ───────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      showToast('User created successfully.');
      setCreateOpen(false);
    },
    onError: (err) => {
      createForm.setError('root', { message: getErrorMessage(err) });
    },
  });

  // ── Toggle active mutation ────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (user: User) =>
      userService.updateUser(user.id, { isActive: !user.isActive }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      showToast(`User ${updated.isActive ? 'activated' : 'deactivated'} successfully.`);
      setToggleTarget(null);
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error');
      setToggleTarget(null);
    },
  });

  // ── Create form ───────────────────────────────────────────────────────────
  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'SALES' },
  });

  const handleCreate = async (values: CreateFormValues) => {
    await createMutation.mutateAsync(values);
  };

  const handleCreateClose = () => {
    createForm.reset();
    setCreateOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage team members and their access roles."
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }
          >
            Add User
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            leftAddon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
          />
        </div>
        <Select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value as Role | ''); setPage(1); }}
          className="sm:w-40"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="SALES">Sales</option>
          <option value="WAREHOUSE">Warehouse</option>
          <option value="ACCOUNTS">Accounts</option>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState message="Loading users..." />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found."
          actionLabel="Add User"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/60 bg-white shadow-premium overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/40 transition-all duration-200">
                    <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                    <td className="px-6 py-4 text-slate-555 font-semibold">{u.email}</td>
                    <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                    <td className="px-6 py-4">
                      <Badge variant={u.isActive ? 'success' : 'neutral'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-semibold">{formatDate(u.createdAt)}</td>
                    <td className="px-6 py-4">
                      {u.role !== 'ADMIN' && (
                        <Button
                          size="sm"
                          variant={u.isActive ? 'outline' : 'primary'}
                          onClick={() => setToggleTarget(u)}
                          className={cn("rounded-lg h-7.5 text-xs font-bold px-3 py-1 cursor-pointer", u.isActive ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200' : '')}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-slate-100">
            {users.map(u => (
              <div key={u.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={u.isActive ? 'success' : 'neutral'}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {u.role !== 'ADMIN' && (
                    <Button
                      size="sm"
                      variant={u.isActive ? 'outline' : 'primary'}
                      onClick={() => setToggleTarget(u)}
                      className={cn("rounded-lg h-7.5 text-xs font-bold px-3 py-1 cursor-pointer", u.isActive ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-205' : '')}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <PaginationBar pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>

      )}

      {/* Create User Modal */}
      <Modal open={createOpen} onClose={handleCreateClose} title="Add User">
        <form onSubmit={createForm.handleSubmit(handleCreate)} noValidate className="flex flex-col gap-4">
          <Input
            label="Full name *"
            placeholder="Rahul Sharma"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <Input
            label="Email *"
            type="email"
            placeholder="rahul@company.com"
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email')}
          />
          <Input
            label="Password *"
            type="password"
            placeholder="Min. 8 characters"
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password')}
          />
          <Select
            label="Role *"
            error={createForm.formState.errors.role?.message}
            {...createForm.register('role')}
          >
            <option value="SALES">Sales</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="ACCOUNTS">Accounts</option>
          </Select>

          {createForm.formState.errors.root && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <p className="text-xs text-red-700">{createForm.formState.errors.root.message}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleCreateClose} disabled={createForm.formState.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={createForm.formState.isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toggle active confirm */}
      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.isActive ? 'Deactivate User' : 'Activate User'}
        message={`${toggleTarget?.isActive ? 'Deactivate' : 'Activate'} ${toggleTarget?.name}?`}
        detail={toggleTarget?.isActive ? 'This user will no longer be able to log in.' : 'This user will regain access to the system.'}
        confirmLabel={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={toggleTarget?.isActive ? 'danger' : 'primary'}
        loading={toggleMutation.isPending}
        onConfirm={() => toggleTarget && toggleMutation.mutate(toggleTarget)}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}
