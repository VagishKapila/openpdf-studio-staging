import { clsx } from 'clsx';

const colorMap: Record<string, string> = {
  // Plans
  free: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  starter: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  professional: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  enterprise: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',

  // Document status
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  sent: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewed: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  signed: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',

  // Payment status
  pending: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  succeeded: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',

  // Feedback priority
  critical: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',

  // Feedback status
  new: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  acknowledged: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  in_progress: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  resolved: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',

  // Boolean / generic
  active: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  verified: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  unverified: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',

  // Signature request
  declined: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

const defaultColor = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function StatusBadge({ status, size = 'sm', dot = false }: StatusBadgeProps) {
  const label = status.replace(/_/g, ' ');
  const colors = colorMap[status.toLowerCase()] || defaultColor;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full capitalize whitespace-nowrap',
        colors,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      )}
      {label}
    </span>
  );
}
