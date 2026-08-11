import { cn } from '@/utils/cn';
import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-bold text-slate-600 tracking-wider uppercase">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={3}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 shadow-sm resize-none',
            'focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
            error
              ? 'border-red-400 focus:ring-red-400/10 focus:border-red-400'
              : 'border-slate-200 hover:border-slate-400',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs font-medium text-red-600 mt-0.5">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>}
      </div>
    );
  }
);


Textarea.displayName = 'Textarea';
