import { useState } from 'react';
import {
  Settings, Palette, Bell, Key, Shield,
  Save, Eye, EyeOff, Copy, Check, Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAdminSettings, useUpdateSettings } from '@/lib/hooks';

type Tab = 'general' | 'branding' | 'notifications' | 'api' | 'security';

const tabs: { key: Tab; label: string; icon: typeof Settings }[] = [
  { key: 'general', label: 'General', icon: Settings },
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'api', label: 'API Keys', icon: Key },
  { key: 'security', label: 'Security', icon: Shield },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const { data: settingsData, isLoading: isLoadingSettings } = useAdminSettings();
  const updateSettings = useUpdateSettings();

  const settings = settingsData?.data || null;

  if (isLoadingSettings) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="Platform configuration and preferences" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform configuration and preferences" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && <GeneralSettings settings={settings} updateSettings={updateSettings} />}
          {activeTab === 'branding' && <BrandingSettings settings={settings} updateSettings={updateSettings} />}
          {activeTab === 'notifications' && <NotificationSettings settings={settings} updateSettings={updateSettings} />}
          {activeTab === 'api' && <ApiKeySettings settings={settings} updateSettings={updateSettings} />}
          {activeTab === 'security' && <SecuritySettings settings={settings} updateSettings={updateSettings} />}
        </div>
      </div>
    </div>
  );
}

// ── General Settings ──
function GeneralSettings({ settings, updateSettings }: { settings: any | null; updateSettings: any }) {
  const [values, setValues] = useState({
    platformName: settings?.general?.platformName || 'DocPix Studio',
    supportEmail: settings?.general?.supportEmail || 'support@docpixstudio.com',
    defaultPlan: settings?.general?.defaultPlan || 'free',
    maxUploadSizeMB: settings?.general?.maxUploadSizeMB || 25,
    maintenanceMode: settings?.general?.maintenanceMode || false,
  });

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      section: 'general',
      values,
    });
  };

  return (
    <SettingsCard title="General Configuration" description="Core platform settings">
      <FieldGroup label="Platform Name" description="Shown in the top nav and emails">
        <input
          type="text"
          value={values.platformName}
          onChange={(e) => setValues({ ...values, platformName: e.target.value })}
          className="settings-input"
        />
      </FieldGroup>
      <FieldGroup label="Support Email" description="Users will see this as the reply-to address">
        <input
          type="email"
          value={values.supportEmail}
          onChange={(e) => setValues({ ...values, supportEmail: e.target.value })}
          className="settings-input"
        />
      </FieldGroup>
      <FieldGroup label="Default User Plan" description="Plan assigned to new registrations">
        <select
          value={values.defaultPlan}
          onChange={(e) => setValues({ ...values, defaultPlan: e.target.value })}
          className="settings-input"
        >
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
        </select>
      </FieldGroup>
      <FieldGroup label="Max Upload Size" description="Maximum file size for document uploads">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={values.maxUploadSizeMB}
            onChange={(e) => setValues({ ...values, maxUploadSizeMB: parseInt(e.target.value) })}
            className="settings-input w-24"
          />
          <span className="text-sm text-gray-500">MB</span>
        </div>
      </FieldGroup>
      <FieldGroup label="Maintenance Mode" description="Temporarily disable the platform for all non-admin users">
        <ToggleSwitch
          checked={values.maintenanceMode}
          onChange={(checked) => setValues({ ...values, maintenanceMode: checked })}
        />
      </FieldGroup>
      <SaveButton onClick={handleSave} isLoading={updateSettings.isPending} />
    </SettingsCard>
  );
}

// ── Branding Settings ──
function BrandingSettings({ settings, updateSettings }: { settings: any | null; updateSettings: any }) {
  const [values, setValues] = useState({
    primaryColor: settings?.branding?.primaryColor || '#6366F1',
    secondaryColor: settings?.branding?.secondaryColor || '#8B5CF6',
    logoUrl: settings?.branding?.logoUrl || '',
    footerText: settings?.branding?.footerText || 'Powered by DocPix Studio',
  });

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      section: 'branding',
      values,
    });
  };

  return (
    <SettingsCard title="Default Branding" description="Defaults for new organizations. Each org can override these.">
      <FieldGroup label="Primary Color" description="Main brand color (hex)">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={values.primaryColor}
            onChange={(e) => setValues({ ...values, primaryColor: e.target.value })}
            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
          />
          <input
            type="text"
            value={values.primaryColor}
            onChange={(e) => setValues({ ...values, primaryColor: e.target.value })}
            className="settings-input w-28 font-mono"
          />
        </div>
      </FieldGroup>
      <FieldGroup label="Secondary Color" description="Accent and gradient color">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={values.secondaryColor}
            onChange={(e) => setValues({ ...values, secondaryColor: e.target.value })}
            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
          />
          <input
            type="text"
            value={values.secondaryColor}
            onChange={(e) => setValues({ ...values, secondaryColor: e.target.value })}
            className="settings-input w-28 font-mono"
          />
        </div>
      </FieldGroup>
      <FieldGroup label="Logo URL" description="Default logo shown in emails and signing pages">
        <input
          type="url"
          value={values.logoUrl}
          onChange={(e) => setValues({ ...values, logoUrl: e.target.value })}
          placeholder="https://example.com/logo.svg"
          className="settings-input"
        />
      </FieldGroup>
      <FieldGroup label="Footer Text" description="Shown at the bottom of client dashboards">
        <input
          type="text"
          value={values.footerText}
          onChange={(e) => setValues({ ...values, footerText: e.target.value })}
          className="settings-input"
        />
      </FieldGroup>

      {/* Preview */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 mb-3">Preview</p>
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="h-14 flex items-center px-4 gap-2" style={{ background: `linear-gradient(135deg, ${values.primaryColor}, ${values.secondaryColor})` }}>
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">DP</span>
            </div>
            <span className="text-white font-semibold text-sm">DocPix Studio</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-3 text-center">
            <p className="text-xs text-gray-400">{values.footerText}</p>
          </div>
        </div>
      </div>
      <SaveButton onClick={handleSave} isLoading={updateSettings.isPending} />
    </SettingsCard>
  );
}

// ── Notification Settings ──
function NotificationSettings({ settings, updateSettings }: { settings: any | null; updateSettings: any }) {
  const [values, setValues] = useState({
    emailEnabled: settings?.notifications?.emailEnabled ?? true,
    smsEnabled: settings?.notifications?.smsEnabled ?? false,
    dailyDigest: settings?.notifications?.dailyDigest ?? true,
    weeklyReport: settings?.notifications?.weeklyReport ?? true,
    anomalyAlerts: settings?.notifications?.anomalyAlerts ?? true,
    slackWebhookUrl: settings?.notifications?.slackWebhookUrl || '',
  });

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      section: 'notifications',
      values,
    });
  };

  return (
    <SettingsCard title="Notification Preferences" description="Configure how and when alerts are sent">
      <FieldGroup label="Email Notifications" description="Send email alerts for critical events">
        <ToggleSwitch
          checked={values.emailEnabled}
          onChange={(checked) => setValues({ ...values, emailEnabled: checked })}
        />
      </FieldGroup>
      <FieldGroup label="SMS Alerts" description="Send SMS for urgent signing reminders (requires Telnyx)">
        <ToggleSwitch
          checked={values.smsEnabled}
          onChange={(checked) => setValues({ ...values, smsEnabled: checked })}
        />
      </FieldGroup>
      <FieldGroup label="Daily Digest" description="Send a daily summary email at 9 AM">
        <ToggleSwitch
          checked={values.dailyDigest}
          onChange={(checked) => setValues({ ...values, dailyDigest: checked })}
        />
      </FieldGroup>
      <FieldGroup label="Weekly Report" description="Send a weekly analytics report every Monday">
        <ToggleSwitch
          checked={values.weeklyReport}
          onChange={(checked) => setValues({ ...values, weeklyReport: checked })}
        />
      </FieldGroup>
      <FieldGroup label="Anomaly Alerts" description="Auto-detect and alert on metric anomalies">
        <ToggleSwitch
          checked={values.anomalyAlerts}
          onChange={(checked) => setValues({ ...values, anomalyAlerts: checked })}
        />
      </FieldGroup>
      <FieldGroup label="Slack Webhook URL" description="Critical alerts sent to this Slack channel">
        <input
          type="url"
          value={values.slackWebhookUrl}
          onChange={(e) => setValues({ ...values, slackWebhookUrl: e.target.value })}
          placeholder="https://hooks.slack.com/services/..."
          className="settings-input"
        />
      </FieldGroup>
      <SaveButton onClick={handleSave} isLoading={updateSettings.isPending} />
    </SettingsCard>
  );
}

// ── API Key Settings ──
function ApiKeySettings({ settings, updateSettings }: { settings: any | null; updateSettings: any }) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [values, setValues] = useState({
    webhookUrl: settings?.api?.webhookUrl || '',
    allowedOrigins: settings?.api?.allowedOrigins || 'https://vagishkapila.github.io',
  });
  const fakeKey = 'dpx_live_sk_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c';

  function copyKey() {
    navigator.clipboard.writeText(fakeKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      section: 'api',
      values,
    });
  };

  return (
    <SettingsCard title="API Keys" description="Manage API keys for external integrations">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          API keys grant full access to your account. Never share them publicly.
        </p>
      </div>

      <FieldGroup label="Live API Key" description="Use this key in production">
        <div className="flex items-center gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={fakeKey}
            readOnly
            className="settings-input font-mono text-xs flex-1"
          />
          <button onClick={() => setShowKey(!showKey)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={copyKey} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </FieldGroup>

      <FieldGroup label="Webhook URL" description="We'll POST events to this URL">
        <input
          type="url"
          value={values.webhookUrl}
          onChange={(e) => setValues({ ...values, webhookUrl: e.target.value })}
          placeholder="https://your-app.com/webhooks/docpix"
          className="settings-input"
        />
      </FieldGroup>

      <FieldGroup label="Allowed Origins" description="CORS origins for browser API calls">
        <input
          type="text"
          value={values.allowedOrigins}
          onChange={(e) => setValues({ ...values, allowedOrigins: e.target.value })}
          className="settings-input"
        />
      </FieldGroup>

      <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
        <SaveButton onClick={handleSave} isLoading={updateSettings.isPending} />
        <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
          Rotate API Key
        </button>
      </div>
    </SettingsCard>
  );
}

// ── Security Settings ──
function SecuritySettings({ settings, updateSettings }: { settings: any | null; updateSettings: any }) {
  const [values, setValues] = useState({
    requireEmailVerification: settings?.security?.requireEmailVerification ?? true,
    allowGoogleOAuth: settings?.security?.allowGoogleOAuth ?? true,
    sessionTimeoutHours: settings?.security?.sessionTimeoutHours ?? 24,
    maxLoginAttempts: settings?.security?.maxLoginAttempts ?? 5,
    passwordMinLength: settings?.security?.passwordMinLength ?? true,
    passwordRequireUppercase: settings?.security?.passwordRequireUppercase ?? true,
    passwordRequireNumber: settings?.security?.passwordRequireNumber ?? true,
    passwordRequireSpecial: settings?.security?.passwordRequireSpecial ?? false,
    require2FA: settings?.security?.require2FA ?? false,
  });

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      section: 'security',
      values,
    });
  };

  return (
    <SettingsCard title="Security" description="Authentication and access control settings">
      <FieldGroup label="Require Email Verification" description="Users must verify email before accessing features">
        <ToggleSwitch
          checked={values.requireEmailVerification}
          onChange={(checked) => setValues({ ...values, requireEmailVerification: checked })}
        />
      </FieldGroup>
      <FieldGroup label="Allow Google OAuth" description="Enable Sign in with Google">
        <ToggleSwitch
          checked={values.allowGoogleOAuth}
          onChange={(checked) => setValues({ ...values, allowGoogleOAuth: checked })}
        />
      </FieldGroup>
      <FieldGroup label="Session Timeout" description="Auto-logout after inactivity (hours)">
        <input
          type="number"
          value={values.sessionTimeoutHours}
          onChange={(e) => setValues({ ...values, sessionTimeoutHours: parseInt(e.target.value) })}
          className="settings-input w-24"
        />
      </FieldGroup>
      <FieldGroup label="Max Login Attempts" description="Lock account after N failed attempts">
        <input
          type="number"
          value={values.maxLoginAttempts}
          onChange={(e) => setValues({ ...values, maxLoginAttempts: parseInt(e.target.value) })}
          className="settings-input w-24"
        />
      </FieldGroup>
      <FieldGroup label="Password Policy" description="Minimum password requirements">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={values.passwordMinLength}
              onChange={(e) => setValues({ ...values, passwordMinLength: e.target.checked })}
              className="rounded border-gray-300"
            />
            Min 8 characters
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={values.passwordRequireUppercase}
              onChange={(e) => setValues({ ...values, passwordRequireUppercase: e.target.checked })}
              className="rounded border-gray-300"
            />
            Require uppercase letter
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={values.passwordRequireNumber}
              onChange={(e) => setValues({ ...values, passwordRequireNumber: e.target.checked })}
              className="rounded border-gray-300"
            />
            Require number
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={values.passwordRequireSpecial}
              onChange={(e) => setValues({ ...values, passwordRequireSpecial: e.target.checked })}
              className="rounded border-gray-300"
            />
            Require special character
          </label>
        </div>
      </FieldGroup>
      <FieldGroup label="Two-Factor Authentication" description="Require 2FA for admin accounts">
        <ToggleSwitch
          checked={values.require2FA}
          onChange={(checked) => setValues({ ...values, require2FA: checked })}
        />
      </FieldGroup>
      <SaveButton onClick={handleSave} isLoading={updateSettings.isPending} />
    </SettingsCard>
  );
}

// ── Shared Helpers ──

function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{description}</p>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function FieldGroup({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function SaveButton({ onClick, isLoading }: { onClick: () => void; isLoading?: boolean }) {
  return (
    <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </div>
  );
}
