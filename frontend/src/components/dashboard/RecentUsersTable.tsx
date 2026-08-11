import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { RoleBadge, Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';
import type { User } from '@/types';

interface RecentUsersTableProps {
  users: User[];
}

export function RecentUsersTable({ users }: RecentUsersTableProps) {
  const navigate = useNavigate();

  return (

    <Card padding={false} className="p-6">
      <CardHeader className="pb-5">
        <CardTitle>Recent Users</CardTitle>
        <button
          type="button"
          onClick={() => navigate('/users')}
          className="text-xs text-primary-600 hover:text-primary-500 font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          View all
        </button>
      </CardHeader>
      <CardBody className="pt-0">
        {users.length === 0 ? (
          <EmptyState title="No users yet" className="min-h-[120px]" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="pb-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-all duration-200">
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-slate-800 line-clamp-1">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{u.email}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge variant={u.isActive ? 'success' : 'neutral'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right text-xs text-slate-400 font-medium whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

