import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OverviewPage } from './pages/OverviewPage';
import { UsersPage } from './pages/UsersPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { RevenuePage } from './pages/RevenuePage';
import { AuditLogPage } from './pages/AuditLogPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { FeedbackPage } from './pages/FeedbackPage';
import LoginPage from './pages/LoginPage';
import { PortalLayout } from './pages/portal/PortalLayout';
import { PortalDashboard } from './pages/portal/PortalDashboard';
import { PortalDocuments } from './pages/portal/PortalDocuments';
import { PortalTeam } from './pages/portal/PortalTeam';
import { PortalNotifications } from './pages/portal/PortalNotifications';
import { PortalAnalytics } from './pages/portal/PortalAnalytics';
import { PortalBranding } from './pages/portal/PortalBranding';
import { PortalSettings } from './pages/portal/PortalSettings';
import { PortalFeedback } from './pages/portal/PortalFeedback';
import { OrgSelector } from './pages/portal/OrgSelector';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Super Admin Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="revenue" element={<RevenuePage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Org Portal */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <OrgSelector />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/:slug/*"
          element={
            <ProtectedRoute>
              <PortalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PortalDashboard />} />
          <Route path="" element={<PortalDashboard />} />
          <Route path="documents" element={<PortalDocuments />} />
          <Route path="notifications" element={<PortalNotifications />} />
          <Route path="team" element={<PortalTeam />} />
          <Route path="analytics" element={<PortalAnalytics />} />
          <Route path="branding" element={<PortalBranding />} />
          <Route path="settings" element={<PortalSettings />} />
          <Route path="feedback" element={<PortalFeedback />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
