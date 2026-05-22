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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  // Not manager check
  if (!isManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">Only managers can access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'employee' : 'employees'}
              </p>
            </div>
            <button
              onClick={() => {
                refreshUsers();
                refreshTeams();
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error state */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Error loading users</h3>
              <p className="text-sm text-red-800 mt-1">{error}</p>
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
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">No employees</h3>
                <p className="text-gray-600 mt-1">No employee users found in the system</p>
              </div>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="text-center space-y-4">
              <div className="text-gray-400">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">No results</h3>
                <p className="text-gray-600 mt-1">No employees match your search</p>
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            </div>
          </div>
        ) : (
          /* Users table */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/6">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/3">
                      Current Team
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-1/6">
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
