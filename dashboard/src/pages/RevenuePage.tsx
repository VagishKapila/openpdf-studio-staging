import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { useDashboardStats } from '@/lib/hooks';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/PageHeader';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';

type Period = 'daily' | 'weekly' | 'monthly';

export function RevenuePage() {
  const [period, setPeriod] = useState<Period>('daily');
  const { data: statsData, refetch: refetchStats } = useDashboardStats();
  const stats = statsData?.data;

  const { data: revenueData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['revenue', 'raw'],
    queryFn: () => api.getRevenue({ period: 'daily' }),
  });

  // Transform revenue data for charts
  const chartData = useMemo(() => {
    const raw = revenueData?.data;
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map((r: any) => ({
      date: r.date,
      revenue: Number(r.total) / 100,
      transactions: Number(r.count),
    }));
  }, [revenueData]);

  // Aggregate by period
  const aggregated = useMemo(() => {
    if (period === 'daily') return chartData;
    // For weekly/monthly, group the data
    const grouped: Record<string, { revenue: number; transactions: number }> = {};
    chartData.forEach((d) => {
      const date = new Date(d.date);
      let key: string;
      if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else {
        key = d.date.slice(0, 7);
      }
      if (!grouped[key]) grouped[key] = { revenue: 0, transactions: 0 };
      grouped[key]!.revenue += d.revenue;
      grouped[key]!.transactions += d.transactions;
    });
    return Object.entries(grouped).map(([date, vals]) => ({ date, ...vals }));
  }, [chartData, period]);

  const totalFromChart = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalTransactions = chartData.reduce((s, d) => s + d.transactions, 0);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Revenue" subtitle="Financial analytics and trends" />
        <CardSkeleton count={4} />
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-80 animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Revenue" />
        <ErrorState message={(error as any)?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Revenue"
        subtitle="Financial analytics and payment trends"
        onRefresh={() => { refetch(); refetchStats(); }}
      />

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FinanceCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${((stats?.totalRevenue ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          color="text-green-500"
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <FinanceCard
          icon={TrendingUp}
          label="This Month"
          value={`$${((stats?.revenueThisMonth ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change={stats?.revenueThisMonth && stats?.totalRevenue ? Math.round((stats.revenueThisMonth / stats.totalRevenue) * 100) : 0}
          color="text-brand-500"
          bgColor="bg-brand-50 dark:bg-brand-900/20"
        />
        <FinanceCard
          icon={CreditCard}
          label="Success Rate"
          value={`${stats?.paymentSuccessRate ?? 0}%`}
          color="text-emerald-500"
          bgColor="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <FinanceCard
          icon={CreditCard}
          label="Transactions"
          value={totalTransactions.toLocaleString()}
          subtitle={`$${(totalTransactions > 0 ? totalFromChart / totalTransactions : 0).toFixed(2)} avg`}
          color="text-blue-500"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                  period === p
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={aggregated}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-700" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-gray-400" />
            <YAxis tick={{ fontSize: 11 }} className="text-gray-400" tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} fill="url(#revenueGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction Volume Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Transaction Volume</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={aggregated}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-700" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-gray-400" />
            <YAxis tick={{ fontSize: 11 }} className="text-gray-400" />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px' }}
            />
            <Bar dataKey="transactions" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FinanceCard({ icon: Icon, label, value, change, subtitle, color, bgColor }: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  change?: number;
  subtitle?: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
          <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{change}% of total</span>
        </div>
      )}
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
