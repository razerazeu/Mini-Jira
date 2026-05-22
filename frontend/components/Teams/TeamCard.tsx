'use client';

import { Team, TeamMember } from '@/lib/hooks/useTeams';
import { Edit2, Trash2, Users } from 'lucide-react';

interface TeamCardProps {
  team: Team;
  memberCount?: number;
  isManager: boolean;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onViewMembers: (team: Team) => void;
}

export function TeamCard({
  team,
  memberCount = 0,
  isManager,
  onEdit,
  onDelete,
  onViewMembers,
}: TeamCardProps) {
  const createdDate = new Date(team.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-neutral-800 rounded-lg border border-neutral-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header with gradient */}
      <div className="h-24 bg-gradient-to-r from-indigo-600 to-indigo-700 relative">
        <div className="absolute inset-0 opacity-10 pattern-grid"></div>
      </div>

      {/* Card content */}
      <div className="p-6 -mt-8 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white truncate">{team.name}</h3>
            {team.description && (
              <p className="text-sm text-neutral-300 mt-1 line-clamp-2">{team.description}</p>
            )}
          </div>
        </div>

        {/* Team stats */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-700">
          <div className="flex items-center gap-2 text-neutral-300">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
          <span className="text-xs text-neutral-400">Created {createdDate}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewMembers(team)}
            className="flex-1 px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            View Members
          </button>
          {isManager && (
            <>
              <button
                onClick={() => onEdit(team)}
                className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 rounded-lg transition-colors"
                title="Edit team"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(team)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                title="Delete team"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
