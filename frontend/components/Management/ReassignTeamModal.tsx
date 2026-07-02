'use client';

import { useState } from 'react';
import { UserWithTeam, Team } from '@/lib/hooks/useUserManagement';
import { X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReassignTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userId: string, newTeamId: string) => Promise<void>;
  user: UserWithTeam | null;
  teams: Team[];
}

export function ReassignTeamModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  teams,
}: ReassignTeamModalProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const availableTeams = teams.filter(
    (t) => (t.teamId || t.id) !== (user.teamId)
  );

  const currentTeam = teams.find((t) => t.teamId === user.teamId || t.id === user.teamId);

  const handleSubmit = async () => {
    if (!selectedTeamId) {
      toast.error('Please select a team');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(user.userId || user.id || '', selectedTeamId);
      toast.success('User reassigned successfully');
      setSelectedTeamId('');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reassign user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTeamId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E4E7EB]">
          <h2 className="text-xl font-semibold text-[#172B4D]">Reassign User to Team</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-[#6B778C] hover:text-[#172B4D] disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="bg-[#F4F5F7] rounded-lg p-4">
            <p className="text-sm text-[#6B778C]">
              <span className="font-medium">User:</span> {user.name}
            </p>
            <p className="text-sm text-[#6B778C] mt-1">
              <span className="font-medium">Email:</span> {user.email}
            </p>
          </div>

          {/* Current Team */}
          {currentTeam && (
            <div>
              <label className="block text-sm font-medium text-[#6B778C] mb-1.5">
                Current Team
              </label>
              <input
                type="text"
                value={currentTeam.name}
                disabled
                className="w-full px-4 py-2 border border-[#E4E7EB] rounded-lg bg-[#F4F5F7] text-[#6B778C] cursor-not-allowed"
              />
            </div>
          )}

          {/* New Team Selection */}
          <div>
            <label className="block text-sm font-medium text-[#6B778C] mb-1.5">
              New Team *
            </label>
            {availableTeams.length === 0 ? (
              <p className="text-sm text-[#6B778C] py-2">No other teams available</p>
            ) : (
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-[#E4E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent disabled:bg-[#F4F5F7]"
              >
                <option value="">Select a team...</option>
                {availableTeams.map((team) => (
                  <option key={team.teamId || team.id} value={team.teamId || team.id || ''}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#E4E7EB]">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-[#172B4D] bg-[#F4F5F7] hover:bg-[#E4E7EB] rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedTeamId}
            className="flex-1 px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
            Reassign
          </button>
        </div>
      </div>
    </div>
  );
}
