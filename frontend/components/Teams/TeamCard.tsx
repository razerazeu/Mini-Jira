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

  const initials = team.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="bg-white rounded-lg border border-[#E4E7EB] shadow-sm hover:shadow-md hover:border-[#C1C7D0] transition-all overflow-hidden">
      {/* Header with team avatar */}
      <div className="h-14 bg-gradient-to-r from-[#0052CC] to-[#0747A6] relative">
        <div className="absolute inset-0 opacity-10 pattern-grid"></div>
        <div className="absolute left-6 -bottom-6 w-14 h-14 rounded-xl bg-white border-4 border-white shadow-sm flex items-center justify-center">
          <div className="w-full h-full rounded-lg bg-blue-50 flex items-center justify-center">
            <span className="text-[#0052CC] font-bold text-lg">{initials}</span>
          </div>
        </div>
      </div>

      {/* Card content */}
      <div className="px-6 pb-6 pt-9 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#172B4D] truncate">{team.name}</h3>
            {team.description && (
              <p className="text-sm text-[#6B778C] mt-1 line-clamp-2">{team.description}</p>
            )}
          </div>
        </div>

        {/* Team stats */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E4E7EB]">
          <div className="flex items-center gap-2 text-[#6B778C]">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
          <span className="text-xs text-[#6B778C]">Created {createdDate}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewMembers(team)}
            className="flex-1 px-3 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            View Members
          </button>
          {isManager && (
            <>
              <button
                onClick={() => onEdit(team)}
                className="px-3 py-2 bg-[#F4F5F7] hover:bg-[#E4E7EB] text-[#172B4D] rounded-lg transition-colors"
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
