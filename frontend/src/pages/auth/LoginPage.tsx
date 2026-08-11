import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/utils/format';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, authLoading, navigate, from]);

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 bg-slate-950 overflow-hidden">
        {/* dot pattern overlay */}
        <div className="pointer-events-none absolute inset-0 dot-pattern-dark opacity-35" />
        
        {/* decorative radial glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary-600/10 blur-[130px]" />
          <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[130px]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-600/20">
            <svg className="h-5.5 w-5.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3" />
            </svg>
          </div>
          <span className="text-lg font-extrabold text-white tracking-wide">FlowERP</span>
        </div>

        {/* Center content */}
        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            Streamline your wholesale<br />
            <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">operations portal.</span>
          </h2>
          <p className="mt-4.5 text-slate-400 font-medium leading-relaxed">
            Manage customers, inventory, and sales challans with secure, role-based access built for wholesale distribution teams.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { label: 'Customer CRM', icon: '👥' },
              { label: 'Live Inventory', icon: '📦' },
              { label: 'Sales Challans', icon: '🧾' },
              { label: 'Audit Trail Logs', icon: '📊' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200 px-4.5 py-4">
                <span className="text-lg shrink-0">{item.icon}</span>
                <span className="text-sm font-bold text-slate-200">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="relative text-xs text-slate-600 font-semibold uppercase tracking-wider">
          Internal Systems &middot; Private Operations
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 relative">
        {/* dot pattern overlay */}
        <div className="pointer-events-none absolute inset-0 dot-pattern opacity-45" />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10 relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-md">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3" />
            </svg>
          </div>
          <span className="text-lg font-extrabold text-slate-900 tracking-wide">FlowERP</span>
        </div>

        <div className="w-full max-w-sm relative">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500 font-medium">Sign in to your team account to continue.</p>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/95 backdrop-blur-md p-8 shadow-xl shadow-slate-200/40">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-xs font-bold text-slate-600 tracking-wider uppercase">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              {errors.root && (
                <div className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3.5">
                  <svg className="h-4.5 w-4.5 text-rose-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-xs font-medium text-rose-700 leading-snug">{errors.root.message}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                loading={isSubmitting}
                className="w-full mt-2"
              >
                Sign in
              </Button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400 font-semibold tracking-wide uppercase">
            Secured Portal &middot; Unauthorized Access Prohibited
          </p>
        </div>
      </div>
    </div>
  );

}
