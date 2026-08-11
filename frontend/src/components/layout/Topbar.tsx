import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbName = (segment: string) => {
    // If it's a UUID or MongoDB-like ID or number
    const isId = /^[0-9a-fA-F-]+$/.test(segment) || !isNaN(Number(segment));
    if (isId) return 'Details';

    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      customers: 'Customers',
      new: 'New',
      edit: 'Edit',
      products: 'Products',
      inventory: 'Inventory',
      challans: 'Sales Challans',
      create: 'Create',
      users: 'Team Users',
    };
    return map[segment.toLowerCase()] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white px-5 lg:px-6 shrink-0 shadow-sm shadow-slate-100/40">
      {/* Left: hamburger + breadcrumb area */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 lg:hidden transition-all duration-200 cursor-pointer"
          aria-label="Open menu"
        >
          <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        {/* Dynamic Breadcrumbs */}
        {user && (
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-800 transition-colors">
              Portal
            </Link>
            {pathnames.map((value, index) => {
              const last = index === pathnames.length - 1;
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const name = getBreadcrumbName(value);

              return (
                <div key={to} className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  {last ? (
                    <span className="text-slate-800 font-bold">{name}</span>
                  ) : (
                    <Link to={to} className="hover:text-slate-800 transition-colors">
                      {name}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right: user info + logout */}
      {user && (
        <div className="flex items-center gap-4.5">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-800 leading-tight">{user.name}</span>
            <span className="text-[10px] text-slate-400 font-medium leading-tight">{user.email}</span>
          </div>
          <RoleBadge role={user.role} />
          <div className="h-8 w-px bg-slate-200" />
          <Button
            variant="ghost"
            size="sm"
            loading={loggingOut}
            onClick={handleLogout}
            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="hidden sm:inline font-semibold">Logout</span>
          </Button>
        </div>
      )}
    </header>
  );
}

