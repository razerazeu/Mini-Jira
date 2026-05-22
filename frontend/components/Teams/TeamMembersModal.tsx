'use client';

import { Team, TeamMember } from '@/lib/hooks/useTeams';
import { X, Loader, Mail, Shield, User } from 'lucide-react';
import { useUserManagement } from '@/lib/hooks/useUserManagement';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/AuthContext';

function AddMemberSection({ team, onMembersUpdated }: { team: Team; onMembersUpdated?: () => void }) {
  const { users, assignUserToTeam, removeUserFromTeam } = useUserManagement();
  const { isManager } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isManager) return null;

  const available = users.filter((u) => u.role === 'EMPLOYEE' && u.teamId !== team.teamId);

  const handleAdd = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await assignUserToTeam(selectedUser, team.teamId || team.id || '');
      toast.success('User added to team');
      setSelectedUser('');
      onMembersUpdated?.();
    } catch (e: any) {
      toast.error(e.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 mb-2">Add member</label>
      <div className="flex gap-2">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white"
        >
          <option value="">Select a user</option>
          {available.map((u) => (
            <option key={u.userId} value={u.userId}>{u.name} — {u.email}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={loading || !selectedUser}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  );
}

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  members: TeamMember[];
  isLoading?: boolean;
  onMembersUpdated?: () => void;
}

export function TeamMembersModal({
  isOpen,
  onClose,
  team,
  members,
  isLoading = false,
  onMembersUpdated,
}: TeamMembersModalProps) {
  if (!isOpen || !team) return null;

  const getRoleBadgeColor = (role: string) => {
    return role === 'MANAGER'
      ? 'bg-purple-700 text-purple-100'
      : 'bg-indigo-700 text-indigo-100';
  };

  const getRoleIcon = (role: string) => {
    return role === 'MANAGER' ? (
      <Shield className="w-4 h-4" />
    ) : (
      <User className="w-4 h-4" />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Team Members</h2>
            <p className="text-sm text-neutral-300 mt-1">{team.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-300 hover:text-neutral-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add member (managers only) */}
          {team && (
            <AddMemberSection team={team} onMembersUpdated={onMembersUpdated} />
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 text-neutral-400 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
              <p className="text-neutral-300 font-medium">No team members yet</p>
              <p className="text-sm text-neutral-400 mt-1">
                Assign employees to this team to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-neutral-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-neutral-100">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{member.name}</p>
                        <div className="flex items-center gap-1 text-sm text-neutral-300">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ${getRoleBadgeColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {member.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-neutral-100 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
