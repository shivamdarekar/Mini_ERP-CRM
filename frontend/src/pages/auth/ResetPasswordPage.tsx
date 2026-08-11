import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/utils/format';
import api from '@/services/api';

const schema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      setError('root', { message: 'Reset token is missing. Please use the link from your reset request.' });
      return;
    }
    try {
      await api.post('/auth/reset-password', { token, ...values });
      setSuccess(true);
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

        {success ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <svg className="h-7 w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Password reset!</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="mt-6 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              Go to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-slate-900">Set new password</h1>
              <p className="mt-2 text-sm text-slate-500">
                Choose a strong password for your account.
              </p>
            </div>

            {!token && (
              <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-xs text-amber-700">
                  No reset token found. Please use the link from your reset request or{' '}
                  <Link to="/forgot-password" className="font-semibold underline">request a new one</Link>.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                <Input
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />

                <Input
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                {errors.root && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
                    <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <p className="text-xs text-red-700">{errors.root.message}</p>
                  </div>
                )}

                <Button type="submit" size="lg" loading={isSubmitting} className="w-full" disabled={!token}>
                  Reset password
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
