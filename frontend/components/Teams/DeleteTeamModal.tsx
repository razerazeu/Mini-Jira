'use client';

import { Team } from '@/lib/hooks/useTeams';
import { AlertTriangle, Loader, X } from 'lucide-react';

interface DeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  team: Team | null;
  isDeleting?: boolean;
}

export function DeleteTeamModal({
  isOpen,
  onClose,
  onConfirm,
  team,
  isDeleting = false,
}: DeleteTeamModalProps) {
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-lg shadow-2xl max-w-md w-full text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-white">Delete Team</h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-neutral-300 hover:text-neutral-100 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Are you sure?</h3>
              <p className="text-sm text-neutral-300 mt-1">
                This action cannot be undone. All data associated with this team will be permanently deleted.
              </p>
            </div>
          </div>

          {/* Team info */}
          <div className="bg-neutral-800 rounded-lg p-4">
            <p className="text-sm text-neutral-300">
              <span className="font-medium text-neutral-100">Team Name:</span> {team.name}
            </p>
            {team.description && (
              <p className="text-sm text-neutral-300 mt-2">
                <span className="font-medium text-neutral-100">Description:</span> {team.description}
              </p>
            )}
          </div>

          {/* Warning */}
          <div className="bg-red-900 border border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-200 font-medium">
              ⚠️ This action is irreversible. All team members and related data will be removed.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-neutral-700">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-neutral-100 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting && <Loader className="w-4 h-4 animate-spin" />}
            Delete Team
          </button>
        </div>
      </div>
    </div>
  );
}
