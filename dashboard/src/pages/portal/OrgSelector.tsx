import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ExternalLink } from 'lucide-react';
import { useMyOrgs, useCreateOrg } from '@/lib/hooks';
import toast from 'react-hot-toast';

export function OrgSelector() {
  const navigate = useNavigate();
  const { data, isLoading } = useMyOrgs();
  const createMutation = useCreateOrg();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');

  const orgs = data?.data || [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || !orgSlug.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate slug
    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      toast.error('Slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({ name: orgName, slug: orgSlug });
      if (result.data?.slug) {
        toast.success('Organization created!');
        navigate(`/portal/${result.data.slug}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create organization');
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setOrgName(name);
    if (!orgSlug || orgSlug === generateSlug(orgName)) {
      setOrgSlug(generateSlug(name));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold">
              D
            </div>
            <h1 className="text-xl font-bold text-gray-900">DocPix Studio</h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('admin_access_token');
              window.location.href = '/login';
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Your Organizations</h2>
          <p className="text-gray-500 mt-2">Select an organization to access its portal</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">You don't belong to any organizations yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Organization
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {orgs.map((membership) => (
                <button
                  key={membership.org.id}
                  onClick={() => navigate(`/portal/${membership.org.slug}`)}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {membership.org.logoUrl ? (
                      <img
                        src={membership.org.logoUrl}
                        alt={membership.org.name}
                        className="w-10 h-10 rounded"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: membership.org.primaryColor || '#6366F1' }}
                      >
                        {membership.org.name.charAt(0)}
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {membership.org.name}
                    </h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-gray-500">
                      <strong>Slug:</strong> {membership.org.slug}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      <strong>Role:</strong> {membership.role}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      <strong>Plan:</strong> {membership.org.plan}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-indigo-600 text-sm group-hover:gap-2 transition-all">
                    <span>Enter Portal</span>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create New Organization
            </button>
          </>
        )}

        {/* Create Organization Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Organization</h3>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Acme Inc"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Slug</label>
                  <input
                    type="text"
                    required
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    placeholder="acme-inc"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Portal URL: /portal/{orgSlug || 'acme-inc'}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setOrgName('');
                      setOrgSlug('');
                    }}
                    className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
