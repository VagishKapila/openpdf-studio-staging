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

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
