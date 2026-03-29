import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, DollarSign, Building2,
  UserPlus, FileCheck, Clock, ShieldCheck,
  Activity, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatsRing } from '@/components/dashboard/StatsRing';
import { useDashboardStats, useSystemHealth } from '@/lib/hooks';

export function OverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useDashboardStats();
  const { data: healthData } = useSystemHealth();

  const stats = data?.data;
  const health = healthData?.data;

  // Derive KPI cards from the live API data
  const kpiCards = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: 'Total Users',
        value: stats.totalUsers.toLocaleString(),
        change: stats.newUsersThisWeek,
        changeLabel: 'new this week',
        trend: stats.newUsersThisWeek > 0 ? 'up' as const : 'flat' as const,
        icon: Users,
        nav: '/users',
      },
      {
        label: 'New Users Today',
        value: stats.newUsersToday.toLocaleString(),
        trend: stats.newUsersToday > 0 ? 'up' as const : 'flat' as const,
        icon: UserPlus,
        nav: '/users',
      },
      {
        label: 'Total Documents',
        value: stats.totalDocuments.toLocaleString(),
        icon: FileText,
        nav: '/documents',
      },
      {
        label: 'Documents Signed',
        value: stats.documentsSigned.toLocaleString(),
        change: stats.signatureCompletionRate,
        changeLabel: 'completion rate',
        trend: stats.signatureCompletionRate >= 50 ? 'up' as const : 'down' as const,
        icon: FileCheck,
        nav: '/documents',
      },
      {
        label: 'Pending Signatures',
        value: stats.documentsPending.toLocaleString(),
        trend: stats.documentsPending > 10 ? 'down' as const : 'flat' as const,
        icon: Clock,
        nav: '/documents',
      },
      {
        label: 'Total Revenue',
        value: `$${(stats.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        icon: DollarSign,
        nav: '/revenue',
      },
      {
        label: 'Revenue This Month',
        value: `$${(stats.revenueThisMonth / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        trend: stats.revenueThisMonth > 0 ? 'up' as const : 'flat' as const,
        icon: DollarSign,
        nav: '/revenue',
      },
      {
        label: 'Organizations',
        value: stats.totalOrganizations.toLocaleString(),
        change: stats.activeOrganizations,
        changeLabel: 'active',
        trend: stats.activeOrganizations > 0 ? 'up' as const : 'flat' as const,
        icon: Building2,
        nav: '/organizations',
      },
    ];
  }, [stats]);

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Overview</h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-700 dark:text-red-300 font-medium mb-1">Failed to load dashboard stats</p>
          <p className="text-sm text-red-500 dark:text-red-400 mb-4">
            {(error as any)?.message || 'Could not connect to the admin API.'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h2>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => (
          <KPICard
            key={card.label}
            label={card.label}
            value={card.value}
            change={card.change}
            changeLabel={card.changeLabel}
            trend={card.trend}
            icon={card.icon}
            onClick={() => navigate(card.nav)}
          />
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Signature Completion Ring */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Signature Completion Rate</h3>
          <div className="flex items-center justify-center">
            <StatsRing
              value={stats?.signatureCompletionRate ?? 0}
              label="completed"
              color="var(--brand-primary)"
            />
          </div>
        </div>

        {/* Quick User Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">User Breakdown</h3>
          <div className="space-y-4">
            <StatBar
              label="Verified"
              value={stats?.verifiedUsers ?? 0}
              total={stats?.totalUsers ?? 1}
              color="bg-green-500"
            />
            <StatBar
              label="Active"
              value={stats?.activeUsers ?? 0}
              total={stats?.totalUsers ?? 1}
              color="bg-brand-500"
            />
            <StatBar
              label="New This Week"
              value={stats?.newUsersThisWeek ?? 0}
              total={stats?.totalUsers ?? 1}
              color="bg-amber-500"
            />
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">System Health</h3>
          {health ? (
            <div className="space-y-3">
              <HealthRow icon={Activity} label="Uptime" value={formatUptime(health.uptime)} status="ok" />
              <HealthRow
                icon={ShieldCheck}
                label="Node"
                value={health.nodeVersion || 'N/A'}
                status="ok"
              />
              <HealthRow
                icon={Activity}
                label="Heap Used"
                value={health.memoryUsage
                  ? `${Math.round(health.memoryUsage.heapUsed / 1024 / 1024)} MB`
                  : 'N/A'}
                status={health.memoryUsage && health.memoryUsage.heapUsed > 500 * 1024 * 1024 ? 'warn' : 'ok'}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400">Loading health data...</p>
          )}
        </div>
      </div>

      {/* Payment Quick Stats */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Payment Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Payment Success Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.paymentSuccessRate ?? 0}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Lifetime Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ${(stats.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">This Month</p>
              <p className="text-xl font-bold text-green-600">
                ${(stats.revenueThisMonth / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline sub-components ──

function StatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">{value.toLocaleString()} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function HealthRow({ icon: Icon, label, value, status }: {
  icon: typeof Activity;
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'error';
}) {
  const dot = status === 'ok' ? 'bg-green-500' : status === 'warn' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
        <span className={`w-2 h-2 rounded-full ${dot}`} />
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
