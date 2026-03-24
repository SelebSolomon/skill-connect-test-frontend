import { clsx } from 'clsx';

type Variant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-600',
  info:    'bg-blue-50 text-blue-600',
};

const dotColors: Record<Variant, string> = {
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger:  'bg-red-500',
  neutral: 'bg-gray-400',
  info:    'bg-blue-400',
};

export function Badge({ variant = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

export function jobStatusBadge(status: string) {
  const map: Record<string, { variant: Variant; label: string }> = {
    open:        { variant: 'success', label: 'Open' },
    assigned:    { variant: 'info',    label: 'Assigned' },
    in_progress: { variant: 'warning', label: 'In Progress' },
    completed:   { variant: 'neutral', label: 'Completed' },
    cancelled:   { variant: 'danger',  label: 'Cancelled' },
  };
  const { variant, label } = map[status] ?? { variant: 'neutral', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function bidStatusBadge(status: string) {
  const map: Record<string, { variant: Variant; label: string }> = {
    pending:   { variant: 'warning', label: 'Pending' },
    accepted:  { variant: 'success', label: 'Assigned' },
    rejected:  { variant: 'danger',  label: 'Not Selected' },
    withdrawn: { variant: 'neutral', label: 'Withdrawn' },
  };
  const { variant, label } = map[status] ?? { variant: 'neutral', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}
