import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { UserPlus, Shield, ShieldAlert, Eye, User, Trash2 } from 'lucide-react';
import { useOrgMembers, useInviteMember, useUpdateMemberRole, useRemoveMember } from '@/lib/hooks';
import toast from 'react-hot-toast';
import type { Organization } from '@/types';

interface PortalContext {
  org: Organization | undefined;
  role: string;
  slug: string;
}

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  owner: ShieldAlert,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
};

export function PortalTeam() {
  const { slug, role: myRole } = useOutletContext<PortalContext>();
  const { data, isLoading } = useOrgMembers(slug);
  const inviteMutation = useInviteMember();
  const updateRoleMutation = useUpdateMemberRole();
  const removeMutation = useRemoveMember();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const members = data?.data || [];
  const isOwner = myRole === 'owner';

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      await inviteMutation.mutateAsync({
        slug,
        data: { email: inviteEmail, name: inviteName || undefined, role: inviteRole },
      });
      toast.success('Member invited!');
      setInviteEmail('');
      setInviteName('');
      setShowInvite(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite');
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await updateRoleMutation.mutateAsync({ slug, userId, role: newRole });
      toast.success('Role updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this organization?`)) return;
    try {
      await removeMutation.mutateAsync({ slug, userId });
      toast.success('Member removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 mt-1">{members.length} members</p>
        </div>
        {(myRole === 'admin' || myRole === 'owner') && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Invite form */}
      {showInvite && (myRole === 'admin' || myRole === 'owner') && (
        <form onSubmit={handleInvite} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Invite a team member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Name (optional)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              {isOwner && <option value="admin">Admin</option>}
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Members list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading team...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No team members yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member) => {
              const RoleIcon = ROLE_ICONS[member.role] || User;
              return (
                <div key={member.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                      {member.userName?.charAt(0)?.toUpperCase() ||
                        member.userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.userName || member.userEmail}
                      </p>
                      <p className="text-xs text-gray-500">{member.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        ROLE_COLORS[member.role]
                      }`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {member.role}
                    </span>
                    {member.role !== 'owner' && (myRole === 'admin' || myRole === 'owner') && (
                      <div className="flex items-center gap-1">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                          {isOwner && <option value="admin">Admin</option>}
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          onClick={() =>
                            handleRemove(member.userId, member.userName || member.userEmail)
                          }
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
