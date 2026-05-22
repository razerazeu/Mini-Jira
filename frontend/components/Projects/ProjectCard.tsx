'use client';

import { useAuth } from '@/app/AuthContext';

function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

import { Folder, Edit2, Trash2, ArrowRight, Calendar } from 'lucide-react';
import { Project } from '@/lib/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProjectCard({ project, onClick, onEdit, onDelete }: ProjectCardProps) {
  const { user, isManager } = useAuth();

  const taskProgress = project.totalTasks
    ? Math.round(((project.completedTasks || 0) / project.totalTasks) * 100)
    : 0;

  const canEdit = isManager;
  const canDelete = isManager;
  // Only allow non-managers to view tasks when the project is owned by a team
  // and the user's team matches the project's team. Projects without a team
  // are restricted for non-managers.
  const canViewTasks = isManager || (
    !!project.teamId && !!user?.teamId && String(project.teamId) === String(user.teamId)
  );

  return (
    <div className="bg-[#0b0b0b] rounded-lg border border-gray-800 hover:border-gray-700 hover:shadow-lg transition-all overflow-hidden group">
      {/* Header with icon */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-800 rounded-lg">
            <Folder className="w-6 h-6 text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-lg truncate">{project.name}</h3>
            {project.teamName && (
              <p className="text-xs text-gray-400 mt-0.5">{project.teamName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{project.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {project.totalTasks || 0}
            </span>
            <span className="text-gray-400">tasks</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-lg font-semibold text-green-500">
              {project.completedTasks || 0}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {project.totalTasks && project.totalTasks > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Progress</span>
              <span className="text-xs font-semibold text-gray-300">{taskProgress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Created date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-900">
          <Calendar className="w-3.5 h-3.5" />
          <span>Created {formatDate(project.createdAt)}</span>
        </div>
      </div>

      {/* Footer with actions */}
      <div className="bg-[#0b0b0b] border-t border-gray-800 px-4 py-3 flex items-center justify-between">
        {canViewTasks ? (
          <button
            onClick={onClick}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
          >
            View Tasks
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="text-xs text-gray-500">Restricted</div>
        )}

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="p-1.5 text-gray-300 hover:text-blue-400 hover:bg-blue-900 rounded-lg transition-colors"
              title="Edit project"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-900 rounded-lg transition-colors"
              title="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
