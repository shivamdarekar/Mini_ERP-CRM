/**
 * Format ISO date string to readable date.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format ISO date string to readable date + time.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a numeric string as Indian currency.
 */
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num);
}

/**
 * Relative time label for follow-up dates.
 */
export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  return `In ${diffDays} days`;
}

/**
 * Truncate long strings with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '…';
}

/**
 * Extract a user-friendly error message from an unknown error.
 * Never exposes stack traces or internal details.
 */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
    const status = axiosError.response?.status;
    const msg = axiosError.response?.data?.message;

    if (msg && typeof msg === 'string') return msg;

    switch (status) {
      case 400: return 'Invalid request. Please check your input.';
      case 401: return 'Your session has expired. Please log in again.';
      case 403: return 'You do not have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 409: return 'A conflict occurred. The record may already exist.';
      case 500: return 'A server error occurred. Please try again later.';
      case 503: return 'Service is temporarily unavailable. Please try again later.';
      default: return 'Something went wrong. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}
