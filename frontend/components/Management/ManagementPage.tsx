'use client';

import { useState } from 'react';
import { useUserManagement, UserWithTeam } from '@/lib/hooks/useUserManagement';
import { UserRow } from './UserRow';
import { ReassignTeamModal } from './ReassignTeamModal';
import { RemoveTeamModal } from './RemoveTeamModal';
import { Loader, AlertCircle, RefreshCw, Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/AuthContext';

export function ManagementPage() {
  const { isManager } = useAuth();

  const { users, teams, loading, error, assignUserToTeam, removeUserFromTeam, reassignUserToTeam, refreshUsers, refreshTeams } =
    useUserManagement();

  const [searchTerm, setSearchTerm] = useState('');
  const [reassigningUser, setReassigningUser] = useState<UserWithTeam | null>(null);
  const [removingUser, setRemovingUser] = useState<UserWithTeam | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter employees only
  const employees = users.filter((u) => u.role === 'EMPLOYEE');
  const filteredUsers = employees.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignTeam = async (userId: string, teamId: string) => {
    setIsUpdating(true);
    try {
      await assignUserToTeam(userId, teamId);
      toast.success('User assigned to team');
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReassign = async (userId: string, newTeamId: string) => {
    setIsUpdating(true);
    try {
      await reassignUserToTeam(userId, newTeamId);
      toast.success('User reassigned successfully');
      setReassigningUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reassign user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!removingUser) return;
    setIsUpdating(true);
    try {
      await removeUserFromTeam(removingUser.userId || removingUser.id || '');
      toast.success('User removed from team');
      setRemovingUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove user');
    } finally {
      setIsUpdating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-[#6B778C] animate-spin mx-auto" />
          <p className="text-[#6B778C] font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  // Not manager check
  if (!isManager) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Access Denied</h1>
          <p className="text-[#6B778C]">Only managers can access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172B4D]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E7EB] shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#172B4D]">User Management</h1>
              <p className="text-[#6B778C] mt-1">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'employee' : 'employees'}
              </p>
            </div>
            <button
              onClick={() => {
                refreshUsers();
                refreshTeams();
              }}
              className="flex items-center gap-2 px-4 py-2 text-[#172B4D] bg-[#F4F5F7] hover:bg-[#E4E7EB] rounded-lg transition-colors font-medium"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B778C]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E4E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC] bg-white text-[#172B4D]"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error state */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Error loading users</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => refreshUsers()}
              className="text-red-600 hover:text-red-700 font-medium text-sm flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-dashed border-[#E4E7EB]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-[#0052CC]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#172B4D]">No employees</h3>
                <p className="text-[#6B778C] mt-1">No employee users found in the system</p>
              </div>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-dashed border-[#E4E7EB]">
            <div className="text-center space-y-4">
              <div className="text-[#6B778C]">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#172B4D]">No results</h3>
                <p className="text-[#6B778C] mt-1">No employees match your search</p>
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 text-[#0052CC] hover:text-[#0747A6] font-medium"
              >
                Clear search
              </button>
            </div>
          </div>
        ) : (
          /* Users table */
          <div className="bg-white rounded-lg border border-[#E4E7EB] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E4E7EB] bg-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#172B4D] w-1/3">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#172B4D] w-1/6">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#172B4D] w-1/3">
                      Current Team
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#172B4D] w-1/6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user.userId || user.id}
                      user={user}
                      teams={teams}
                      isManager={isManager}
                      onAssignTeam={handleAssignTeam}
                      onRemoveTeam={() => setRemovingUser(user)}
                      onReassignTeam={() => setReassigningUser(user)}
                      isUpdating={isUpdating}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReassignTeamModal
        isOpen={!!reassigningUser}
        onClose={() => setReassigningUser(null)}
        onSubmit={handleReassign}
        user={reassigningUser}
        teams={teams}
      />

      <RemoveTeamModal
        isOpen={!!removingUser}
        onClose={() => setRemovingUser(null)}
        onConfirm={handleRemove}
        user={removingUser}
        isRemoving={isUpdating}
      />
    </div>
  );
}
