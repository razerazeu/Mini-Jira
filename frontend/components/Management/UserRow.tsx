'use client';

import { UserWithTeam, Team } from '@/lib/hooks/useUserManagement';
import { Users, Mail, Shield, Trash2, Edit2 } from 'lucide-react';

interface UserRowProps {
  user: UserWithTeam;
  teams: Team[];
  isManager: boolean;
  onAssignTeam: (userId: string, teamId: string) => void;
  onRemoveTeam: (userId: string) => void;
  onReassignTeam: (userId: string) => void;
  isUpdating?: boolean;
}

export function UserRow({
  user,
  teams,
  isManager,
  onAssignTeam,
  onRemoveTeam,
  onReassignTeam,
  isUpdating = false,
}: UserRowProps) {
  const currentTeam = teams.find((t) => t.teamId === user.teamId || t.id === user.teamId);
  const unassignedTeams = teams.filter(
    (t) => t.teamId !== user.teamId && t.id !== user.teamId
  );

  const getRoleBadge = (role: string) => {
    const isManager = role === 'MANAGER';
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          isManager
            ? 'bg-purple-100 text-purple-800'
            : 'bg-blue-100 text-blue-800'
        }`}
      >
        {isManager ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />}
        {role}
      </span>
    );
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* User Info */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-blue-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-6 py-4">
        {getRoleBadge(user.role)}
      </td>

      {/* Current Team */}
      <td className="px-6 py-4">
        {currentTeam ? (
          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {currentTeam.name}
          </span>
        ) : (
          <span className="text-gray-500 text-sm">No team assigned</span>
        )}
      </td>

      {/* Actions */}
      {isManager && (
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {user.role === 'EMPLOYEE' ? (
              <>
                {!user.teamId ? (
                  // Assign dropdown
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onAssignTeam(user.userId || user.id || '', e.target.value);
                      }
                    }}
                    disabled={isUpdating}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Assign Team...</option>
                    {teams.map((team) => (
                      <option key={team.teamId || team.id} value={team.teamId || team.id || ''}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    {/* Reassign dropdown */}
                    {unassignedTeams.length > 0 && (
                      <button
                        onClick={() => onReassignTeam(user.userId || user.id || '')}
                        disabled={isUpdating}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Reassign to different team"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {/* Remove from team */}
                    <button
                      onClick={() => onRemoveTeam(user.userId || user.id || '')}
                      disabled={isUpdating}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove from team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <span className="text-gray-500 text-sm">Manager - No assignment</span>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
