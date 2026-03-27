import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, DollarSign,
  ScrollText, Building2, MessageSquare, Brain, Settings, LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/revenue', icon: DollarSign, label: 'Revenue' },
  { to: '/audit-log', icon: ScrollText, label: 'Audit Log' },
  { to: '/organizations', icon: Building2, label: 'Organizations' },
  { to: '/feedback', icon: MessageSquare, label: 'Feedback' },
  { to: '/ai', icon: Brain, label: 'AI Intelligence' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userJson = localStorage.getItem('dpstudio_admin_user');
    if (userJson) {
      try {
        setUser(JSON.parse(userJson));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dpstudio_admin_token');
    localStorage.removeItem('dpstudio_admin_refresh');
    localStorage.removeItem('dpstudio_admin_user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DP</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">DocPix Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400">DocPix Studio v0.1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Super Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'Admin'}</span>
              <span className="text-xs text-gray-500">{user?.email || 'admin@docpixstudio.com'}</span>
            </div>
            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
