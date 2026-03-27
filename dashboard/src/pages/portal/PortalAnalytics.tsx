import { useOutletContext } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useOrgAnalytics } from '@/lib/hooks';
import type { Organization } from '@/types';

interface PortalContext {
  org: Organization | undefined;
  role: string;
  slug: string;
}

export function PortalAnalytics() {
  const { slug } = useOutletContext<PortalContext>();
  const { data, isLoading } = useOrgAnalytics(slug);

  const analytics = data?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-48 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Track your document activity over time</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No analytics data available yet</p>
        </div>
      </div>
    );
  }

  const chartData = analytics.map((day) => ({
    date: new Date(day.reportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sent: day.docsSent,
    signed: day.docsSigned,
    pending: day.docsPending,
    revenue: (day.revenue || 0) / 100,
    avgTime: Math.round(day.avgTimeToSign || 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Track your document activity over time</p>
      </div>

      {/* Document Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="sent" stroke="#3b82f6" dot={false} name="Sent" />
            <Line type="monotone" dataKey="signed" stroke="#10b981" dot={false} name="Signed" />
            <Line type="monotone" dataKey="pending" stroke="#f59e0b" dot={false} name="Pending" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: any) => `$${value.toFixed(2)}`}
              />
              <Bar dataKey="revenue" fill="#059669" radius={[8, 8, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
          <div className="space-y-4">
            {[
              {
                label: 'Total Documents Sent',
                value: analytics.reduce((sum, a) => sum + a.docsSent, 0),
              },
              {
                label: 'Total Documents Signed',
                value: analytics.reduce((sum, a) => sum + a.docsSigned, 0),
              },
              {
                label: 'Total Revenue',
                value: `$${(analytics.reduce((sum, a) => sum + (a.revenue || 0), 0) / 100).toFixed(2)}`,
              },
              {
                label: 'Avg Time to Sign',
                value: `${Math.round(analytics.reduce((sum, a) => sum + a.avgTimeToSign, 0) / analytics.length)} min`,
              },
            ].map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{metric.label}</span>
                <span className="font-bold text-gray-900">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
