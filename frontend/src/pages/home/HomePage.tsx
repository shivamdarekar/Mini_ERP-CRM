import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const features = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-blue-600 bg-blue-50',
    title: 'Customer CRM',
    description: 'Manage leads, active customers, and distributors. Track follow-ups and maintain complete interaction history.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    color: 'text-emerald-600 bg-emerald-50',
    title: 'Inventory Control',
    description: 'Real-time stock tracking with IN/OUT movements, low-stock alerts, and warehouse location management.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    color: 'text-amber-600 bg-amber-50',
    title: 'Sales Challans',
    description: 'Create and manage sales challans with automatic stock deduction on confirmation. Full audit trail included.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: 'text-purple-600 bg-purple-50',
    title: 'Role-Based Access',
    description: 'Four distinct roles — Admin, Sales, Warehouse, and Accounts — each with tailored views and permissions.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: 'text-rose-600 bg-rose-50',
    title: 'Analytics & Reports',
    description: 'Unified dashboards per role. Accounts track revenue, Warehouse monitors stock, Sales manages pipeline.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-cyan-600 bg-cyan-50',
    title: 'Audit Trail',
    description: 'Every action is logged. Full traceability across users, stock movements, and challan lifecycle events.',
  },
];

const roles = [
  { name: 'Admin', desc: 'Full system access', color: 'bg-purple-500', light: 'bg-purple-50 text-purple-700 ring-purple-200' },
  { name: 'Sales', desc: 'Customers & challans', color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700 ring-blue-200' },
  { name: 'Warehouse', desc: 'Products & inventory', color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { name: 'Accounts', desc: 'Revenue & reports', color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
];

const steps = [
  { n: '01', label: 'Add Customers', sub: 'Import or create your customer base' },
  { n: '02', label: 'Manage Products', sub: 'Set up your product catalogue' },
  { n: '03', label: 'Track Inventory', sub: 'Record stock IN / OUT movements' },
  { n: '04', label: 'Create Challan', sub: 'Generate sales challans instantly' },
  { n: '05', label: 'Confirm & Dispatch', sub: 'Auto-deduct stock on confirmation' },
];

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-900">FlowERP</span>
              <span className="hidden sm:inline text-xs text-slate-400 font-medium">Operations Portal</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm"
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full bg-primary-100 opacity-60 blur-3xl" />
          <div className="absolute top-20 -left-24 h-[400px] w-[400px] rounded-full bg-blue-100 opacity-40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 mb-6 tracking-wide uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
            Internal Operations Portal
          </span>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight">
            <span className="text-slate-900">Run your business</span>
            <br />
            <span className="bg-gradient-to-r from-primary-600 via-blue-600 to-primary-500 bg-clip-text text-transparent">
              end to end.
            </span>
          </h1>

          <p className="mt-6 max-w-xl mx-auto text-lg text-slate-500 leading-relaxed">
            FlowERP unifies your customers, inventory, and sales operations into one
            fast, role-aware platform built for wholesale and distribution teams.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto rounded-xl bg-primary-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-md shadow-primary-200"
            >
              Get started →
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-8 py-3.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              See features
            </a>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: '4', label: 'User Roles' },
              { value: '6', label: 'Core Modules' },
              { value: '100%', label: 'Audit Logged' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-primary-600">{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Everything you need</h2>
            <p className="mt-3 text-slate-500 max-w-md mx-auto">
              Six tightly integrated modules that cover the full lifecycle of your operations.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.color} mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-500">A simple, end-to-end business flow in five steps.</p>
          </div>
          <div className="relative">
            {/* connector line */}
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {steps.map((step, i) => (
                <div key={step.n} className="relative flex flex-col items-center text-center">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl font-bold text-lg shadow-sm mb-4 ${
                    i === 0 ? 'bg-primary-600 text-white' :
                    i === 1 ? 'bg-emerald-500 text-white' :
                    i === 2 ? 'bg-amber-500 text-white' :
                    i === 3 ? 'bg-purple-500 text-white' :
                    'bg-rose-500 text-white'
                  }`}>
                    {step.n}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{step.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="bg-slate-900 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary-400">Access Control</span>
              <h2 className="mt-3 text-3xl font-bold text-white leading-snug">
                The right tools for<br />every team member.
              </h2>
              <p className="mt-4 text-slate-400 leading-relaxed">
                FlowERP enforces strict role-based access. Each user sees only what they need —
                no clutter, no accidental changes, no data leaks.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'JWT authentication with Bearer token support',
                  'Role-based guards on every API endpoint',
                  'Complete audit trail for all operations',
                  'Secure session management with auto-expiry',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
                    <svg className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {roles.map((role) => (
                <div key={role.name} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors">
                  <div className={`h-2 w-8 rounded-full ${role.color} mb-3`} />
                  <p className="text-sm font-bold text-white">{role.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Ready to get started?</h2>
          <p className="mt-3 text-slate-500">Sign in with your credentials to access your role-specific dashboard.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-md shadow-primary-200"
          >
            Sign in to FlowERP
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600">
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-700">FlowERP</span>
          </div>
          <p className="text-xs text-slate-400">Internal use only &mdash; contact your administrator for access.</p>
        </div>
      </footer>
    </div>
  );
}
