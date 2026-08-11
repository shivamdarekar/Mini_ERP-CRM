import { cn } from '@/utils/cn';
import { Spinner } from '@/components/ui/Spinner';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  fullScreen = false,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-slate-500',
        fullScreen ? 'min-h-screen' : 'min-h-[200px] w-full',
        className
      )}
    >
      <Spinner size="lg" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
