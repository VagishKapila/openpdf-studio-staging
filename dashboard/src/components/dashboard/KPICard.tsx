import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
interface Props {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'flat';
  icon?: LucideIcon;
  onClick?: () => void;
}

export function KPICard({ label, value, change, changeLabel, trend, icon: Icon, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-left hover:shadow-md transition-shadow w-full group"
    >
      <div className="flex items-start justify-between mb-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        {Icon && (
          <div className="p-1.5 bg-brand-50 dark:bg-brand-900/20 rounded-lg group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
            <Icon className="w-4 h-4 text-brand-500" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
          {trend === 'flat' && <Minus className="w-4 h-4 text-gray-400" />}
          <span
            className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            {change > 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-xs text-gray-400 ml-1">{changeLabel}</span>}
        </div>
      )}
    </button>
  );
}
