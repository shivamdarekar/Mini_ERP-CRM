import { cn } from '@/utils/cn';
import type { Pagination } from '@/types';

interface PaginationBarProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export function PaginationBar({ pagination, onPageChange }: PaginationBarProps) {
  const { page, totalPages, total, limit } = pagination;
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page numbers: always show first, last, current ±1
  const pages: (number | 'ellipsis')[] = [];
  const range = new Set([1, totalPages, page - 1, page, page + 1].filter(p => p >= 1 && p <= totalPages));
  const sorted = [...range].sort((a, b) => a - b);
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) pages.push('ellipsis');
    pages.push(p);
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
      <p className="text-xs text-slate-500">
        Showing {from}–{to} of {total} results
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                p === page
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'border border-border text-slate-600 hover:bg-slate-50'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
