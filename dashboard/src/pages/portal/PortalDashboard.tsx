import { useOutletContext } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, PenLine, DollarSign, Users } from 'lucide-react';
import { useOrgDashboard } from '@/lib/hooks';
import type { Organization } from '@/types';

interface PortalContext {
  org: Organization | undefined;
  role: string;
  slug: string;
}

interface KPIProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}

function KPI({ icon: Icon, label, value, color }: KPIProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function PortalDashboard() {
  const { slug, role } = useOutletContext<PortalContext>();
  const { data, isLoading } = useOrgDashboard(slug);
  const dash = data?.data;
  const isAdmin = role === 'admin' || role === 'owner';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const docs = dash?.documents || { total: 0, signed: 0, pending: 0, draft: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your document activity</p>
      </div>

      {/* Document KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          icon={FileText}
          label="Total Documents"
          value={docs.total}
          color="bg-blue-50 text-blue-600"
        />
        <KPI icon={Clock} label="Pending" value={docs.pending} color="bg-amber-50 text-amber-600" />
        <KPI
          icon={CheckCircle2}
          label="Signed"
          value={docs.signed}
          color="bg-green-50 text-green-600"
        />
        <KPI icon={PenLine} label="Drafts" value={docs.draft} color="bg-gray-50 text-gray-600" />
      </div>

      {/* Admin-only: Revenue + Members */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPI
            icon={DollarSign}
            label="Total Revenue"
            value={`$${((dash?.revenue?.total || 0) / 100).toFixed(2)}`}
            color="bg-emerald-50 text-emerald-600"
          />
          <KPI
            icon={DollarSign}
            label="This Month"
            value={`$${((dash?.revenue?.thisMonth || 0) / 100).toFixed(2)}`}
            color="bg-indigo-50 text-indigo-600"
          />
          <KPI
            icon={Users}
            label="Team Members"
            value={dash?.memberCount || 0}
            color="bg-purple-50 text-purple-600"
          />
        </div>
      )}

      {/* Document Pipeline Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Pipeline</h2>
        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          {[
            { label: 'Draft', count: docs.draft, color: 'bg-gray-400' },
            { label: 'Pending', count: docs.pending, color: 'bg-amber-400' },
            { label: 'Signed', count: docs.signed, color: 'bg-green-400' },
          ].map((stage) => (
            <div key={stage.label} className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">{stage.label}</span>
                <span className="font-bold text-gray-900">{stage.count}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all`}
                  style={{
                    width:
                      docs.total > 0
                        ? `${((stage.count / docs.total) * 100).toFixed(0)}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Completion Rate</h3>
          <p className="text-3xl font-bold text-gray-900">
            {docs.total > 0 ? ((docs.signed / docs.total) * 100).toFixed(0) : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {docs.signed} of {docs.total} documents signed
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Action</h3>
          <p className="text-3xl font-bold text-amber-600">{docs.pending}</p>
          <p className="text-xs text-gray-500 mt-2">Documents awaiting signature</p>
        </div>
      </div>
    </div>
  );
}
