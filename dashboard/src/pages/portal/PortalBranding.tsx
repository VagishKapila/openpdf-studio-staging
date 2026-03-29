import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Palette } from 'lucide-react';
import { useUpdateOrgBranding } from '@/lib/hooks';
import toast from 'react-hot-toast';
import type { Organization } from '@/types';

interface PortalContext {
  org: Organization | undefined;
  role: string;
  slug: string;
}

export function PortalBranding() {
  const { slug, org } = useOutletContext<PortalContext>();
  const updateMutation = useUpdateOrgBranding();

  const [primaryColor, setPrimaryColor] = useState(org?.primaryColor || '#6366F1');
  const [secondaryColor, setSecondaryColor] = useState(org?.secondaryColor || '#8B5CF6');
  const [logoUrl, setLogoUrl] = useState(org?.logoUrl || '');
  const [customDomain, setCustomDomain] = useState(org?.customDomain || '');
  const [emailFromName, setEmailFromName] = useState(org?.emailFromName || '');
  const [footerText, setFooterText] = useState(org?.footerText || '');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        slug,
        data: {
          primaryColor,
          secondaryColor,
          logoUrl: logoUrl || null,
          customDomain: customDomain || null,
          emailFromName: emailFromName || null,
          footerText,
        },
      });
      toast.success('Branding updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update branding');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
        <p className="text-gray-500 mt-1">Customize your organization's look and feel</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Colors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Color */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-16 rounded-lg cursor-pointer border border-gray-300"
              />
              <div>
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Used for buttons, links, accents</p>
              </div>
            </div>
          </div>

          {/* Secondary Color */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-16 h-16 rounded-lg cursor-pointer border border-gray-300"
              />
              <div>
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Used for secondary elements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logo URL */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Logo URL</label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Square image recommended (e.g., 256x256)</p>
          {logoUrl && (
            <div className="mt-3">
              <img src={logoUrl} alt="Logo preview" className="w-12 h-12 rounded" />
            </div>
          )}
        </div>

        {/* Custom Domain */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Custom Domain</label>
          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="portal.example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Your organization's branded portal domain</p>
        </div>

        {/* Email From Name */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Email From Name</label>
          <input
            type="text"
            value={emailFromName}
            onChange={(e) => setEmailFromName(e.target.value)}
            placeholder="e.g., Your Company Support"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">How emails will be signed</p>
        </div>

        {/* Footer Text */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">Footer Text</label>
          <input
            type="text"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="Powered by DocPix Studio"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Appears in portal sidebar footer</p>
        </div>

        {/* Save Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Preview
        </h2>
        <div className="flex gap-4">
          <div
            className="w-32 h-32 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: primaryColor }}
          >
            A
          </div>
          <div
            className="w-32 h-32 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: secondaryColor }}
          >
            B
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Primary:</strong> {primaryColor}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Secondary:</strong> {secondaryColor}
            </p>
            <p className="text-xs text-gray-500">
              Footer text: {footerText || 'Powered by DocPix Studio'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
