import { clsx } from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
};

export function Spinner({ size = 'md', className, fullPage }: SpinnerProps) {
  const spinner = (
    <div
      className={clsx(
        'rounded-full border-blue-600 border-t-transparent animate-spin',
        sizeClasses[size],
        className,
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        {spinner}
        <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return spinner;
}
