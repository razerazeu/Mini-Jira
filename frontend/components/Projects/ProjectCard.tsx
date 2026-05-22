'use client';

function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

import { Folder, Edit2, Trash2, ArrowRight, Calendar } from 'lucide-react';
import { Project, useProjects } from '@/lib/hooks/useProjects';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProjectCard({ project, onClick, onEdit, onDelete }: ProjectCardProps) {
  const taskProgress = project.totalTasks
    ? Math.round(((project.completedTasks || 0) / project.totalTasks) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all overflow-hidden group">
      {/* Header with icon */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Folder className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg truncate">{project.name}</h3>
            {project.teamName && (
              <p className="text-xs text-gray-600 mt-0.5">{project.teamName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {project.totalTasks || 0}
            </span>
            <span className="text-gray-600">tasks</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Completed</p>
            <p className="text-lg font-semibold text-green-600">
              {project.completedTasks || 0}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {project.totalTasks && project.totalTasks > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Progress</span>
              <span className="text-xs font-semibold text-gray-700">{taskProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Created date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
          <Calendar className="w-3.5 h-3.5" />
          <span>Created {formatDate(project.createdAt)}</span>
        </div>
      </div>

      {/* Footer with actions */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClick}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
        >
          View Tasks
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit project"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
