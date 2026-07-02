'use client';

import { UserWithTeam } from '@/lib/hooks/useUserManagement';
import { AlertTriangle, Loader, X } from 'lucide-react';

interface RemoveTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: UserWithTeam | null;
  isRemoving?: boolean;
}

export function RemoveTeamModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  isRemoving = false,
}: RemoveTeamModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E4E7EB]">
          <h2 className="text-xl font-semibold text-[#172B4D]">Remove from Team</h2>
          <button
            onClick={onClose}
            disabled={isRemoving}
            className="text-[#6B778C] hover:text-[#172B4D] disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium text-[#172B4D]">Are you sure?</h3>
              <p className="text-sm text-[#6B778C] mt-1">
                This will remove {user.name} from their current team.
              </p>
            </div>
          </div>

          {/* User info */}
          <div className="bg-[#F4F5F7] rounded-lg p-4">
            <p className="text-sm text-[#6B778C]">
              <span className="font-medium">User:</span> {user.name}
            </p>
            <p className="text-sm text-[#6B778C] mt-1">
              <span className="font-medium">Email:</span> {user.email}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-[#E4E7EB]">
          <button
            onClick={onClose}
            disabled={isRemoving}
            className="flex-1 px-4 py-2 text-[#172B4D] bg-[#F4F5F7] hover:bg-[#E4E7EB] rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isRemoving}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRemoving && <Loader className="w-4 h-4 animate-spin" />}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
