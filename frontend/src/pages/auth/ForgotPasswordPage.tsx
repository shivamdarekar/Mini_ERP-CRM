import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/utils/format';
import api from '@/services/api';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await api.post<{ data: { resetToken?: string } }>('/auth/forgot-password', values);
      if (res.data?.data?.resetToken) setDevToken(res.data.data.resetToken);
      setSubmitted(true);
    } catch (err) {
      setError('root', { message: getErrorMessage(err) });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3" />
            </svg>
          </div>
          <span className="text-base font-bold text-slate-900">FlowERP</span>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <svg className="h-7 w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Request received</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              If an account exists for that email, a reset token has been generated.
              Contact your administrator to complete the reset.
            </p>

            {/* Dev-only token display */}
            {devToken && (
              <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-left">
                <p className="text-xs font-semibold text-amber-700 mb-1.5">Dev mode — reset token:</p>
                <code className="block break-all text-xs text-amber-800 font-mono">{devToken}</code>
                <Link
                  to={`/reset-password?token=${devToken}`}
                  className="mt-3 inline-block text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  Use this token →
                </Link>
              </div>
            )}

            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter your email and we'll generate a reset token for you.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                {errors.root && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
                    <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <p className="text-xs text-red-700">{errors.root.message}</p>
                  </div>
                )}

                <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
                  Send reset link
                </Button>
              </form>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
