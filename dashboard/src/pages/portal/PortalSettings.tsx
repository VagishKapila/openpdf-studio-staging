import { useOutletContext } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useUpdateOrgBranding } from '@/lib/hooks';
import toast from 'react-hot-toast';
import type { Organization } from '@/types';

interface PortalContext {
  org: Organization | undefined;
  role: string;
  slug: string;
}

export function PortalSettings() {
  const { slug, org } = useOutletContext<PortalContext>();
  const updateMutation = useUpdateOrgBranding();

  const handleDeactivate = async () => {
    if (
      !confirm(
        'Are you sure you want to deactivate this organization? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        slug,
        data: { isActive: false },
      });
      toast.success('Organization deactivated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate organization');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization</p>
      </div>

      {/* Organization Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">Organization Name</label>
            <input
              type="text"
              disabled
              value={org?.name || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Read-only. Contact support to change.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">Organization Slug</label>
            <input
              type="text"
              disabled
              value={org?.slug || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Portal URL: /portal/{org?.slug}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">Plan</label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium capitalize">
                {org?.plan || 'free'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Current subscription plan</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-900 block mb-1">Created</label>
            <input
              type="text"
              disabled
              value={
                org?.createdAt
                  ? new Date(org.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-red-800 mb-4">
          Deactivating your organization will prevent all members from accessing it. This action
          cannot be undone.
        </p>
        <button
          onClick={handleDeactivate}
          disabled={updateMutation.isPending || !org?.isActive}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {updateMutation.isPending ? 'Deactivating...' : 'Deactivate Organization'}
        </button>
      </div>
    </div>
  );
}
