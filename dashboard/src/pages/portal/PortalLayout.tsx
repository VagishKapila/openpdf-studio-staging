import { useEffect } from 'react';
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Palette,
  Settings,
  Bell,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { useOrgDashboard, useOrgNotifications } from '@/lib/hooks';

export function PortalLayout() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: dashData } = useOrgDashboard(slug || '');
  const { data: notifData } = useOrgNotifications(slug || '');

  const org = dashData?.data?.organization;
  const role = dashData?.data?.currentUserRole || 'viewer';
  const unreadCount = notifData?.data?.filter((n) => !n.read).length || 0;

  // Set CSS variables from org branding
  useEffect(() => {
    if (org) {
      document.documentElement.style.setProperty('--portal-primary', org.primaryColor);
      document.documentElement.style.setProperty('--portal-secondary', org.secondaryColor);
    }
    return () => {
      document.documentElement.style.removeProperty('--portal-primary');
      document.documentElement.style.removeProperty('--portal-secondary');
    };
  }, [org]);

  const isAdmin = role === 'admin' || role === 'owner';
  const isOwner = role === 'owner';

  interface NavItem {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    end?: boolean;
    show: boolean;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { to: '', icon: LayoutDashboard, label: 'Dashboard', end: true, show: true },
    { to: 'documents', icon: FileText, label: 'Documents', show: true },
    { to: 'notifications', icon: Bell, label: 'Notifications', show: true, badge: unreadCount },
    { to: 'team', icon: Users, label: 'Team', show: isAdmin },
    { to: 'analytics', icon: BarChart3, label: 'Analytics', show: isAdmin },
    { to: 'branding', icon: Palette, label: 'Branding', show: isAdmin },
    { to: 'settings', icon: Settings, label: 'Settings', show: isOwner },
    { to: 'feedback', icon: MessageSquare, label: 'Feedback', show: true },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token');
    navigate('/login');
  };

  if (!slug) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Org header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {org?.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} className="w-8 h-8 rounded" />
            ) : (
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: org?.primaryColor || '#6366F1' }}
              >
                {org?.name?.charAt(0) || 'O'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-gray-900 truncate">{org?.name || 'Loading...'}</h2>
              <span className="text-xs text-gray-500 capitalize">{role}</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems
            .filter((i) => i.show)
            .map((item) => (
              <NavLink
                key={item.to}
                to={`/portal/${slug}/${item.to}`}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { backgroundColor: org?.primaryColor || '#6366F1' } : {}
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
          <p className="text-xs text-gray-400 text-center">{org?.footerText || 'Powered by DocPix Studio'}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet context={{ org, role, slug }} />
        </div>
      </main>
    </div>
  );
}
