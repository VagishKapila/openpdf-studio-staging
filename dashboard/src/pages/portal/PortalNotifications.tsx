import { useOutletContext } from 'react-router-dom';
import { Bell, FileText, DollarSign, User, AlertCircle } from 'lucide-react';
import { useOrgNotifications } from '@/lib/hooks';
import type { Organization } from '@/types';

interface PortalContext {
  org: Organization | undefined;
  role: string;
  slug: string;
}

const NOTIFICATION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  payment: DollarSign,
  team: User,
  system: AlertCircle,
};

export function PortalNotifications() {
  const { slug } = useOutletContext<PortalContext>();
  const { data, isLoading } = useOrgNotifications(slug);

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    for (const [key, icon] of Object.entries(NOTIFICATION_ICONS)) {
      if (type.toLowerCase().includes(key)) return icon;
    }
    return Bell;
  };

  const getColor = (type: string) => {
    if (type.toLowerCase().includes('payment')) return 'bg-emerald-100 text-emerald-600';
    if (type.toLowerCase().includes('document')) return 'bg-blue-100 text-blue-600';
    if (type.toLowerCase().includes('team')) return 'bg-purple-100 text-purple-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => {
              const NotifIcon = getIcon(notif.type);
              const bgColor = getColor(notif.type);
              return (
                <div
                  key={notif.id}
                  className={`px-5 py-4 hover:bg-gray-50 transition-colors ${
                    !notif.read ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                      <NotifIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{notif.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
