'use client';

import { Task, TaskStatus } from '@/lib/types';
import React from 'react';
import { Eye } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskClick?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTask?: () => void;
  isUpdating?: boolean;
}

const columnConfig: Record<TaskStatus, { label: string; icon: React.ReactNode; accent: string }> = {
  TODO: { label: 'To Do', icon: '~_~', accent: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'In Progress', icon: '──●────', accent: 'bg-blue-50 text-[#0052CC]' },
  IN_REVIEW: { label: 'In Review', icon: <Eye className="w-4 h-4" />, accent: 'bg-amber-50 text-amber-700' },
  DONE: { label: 'Done', icon: '⋆˙⟡', accent: 'bg-emerald-50 text-emerald-700' },
};

export function KanbanBoard({
  tasks,
  isLoading = false,
  onTaskClick,
  onStatusChange,
  onCreateTask,
  isUpdating = false,
}: KanbanBoardProps) {
  const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statuses.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          const { label, icon, accent } = columnConfig[status];
          return (
            <div key={status} className="bg-white rounded-lg border border-[#E4E7EB] p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className={`h-9 min-w-9 px-1.5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-medium leading-none overflow-hidden ${accent}`}>
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] text-[#6B778C] uppercase font-semibold tracking-wide truncate">
                    {label}
                  </p>
                  <p className="text-xl font-bold text-[#172B4D] leading-tight">{columnTasks.length}</p>
                </div>
              </div>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div
                    key={task.taskId}
                    onClick={() => onTaskClick?.(task.taskId)}
                    className="p-3 bg-[#F4F5F7] rounded-lg border border-[#E4E7EB] cursor-pointer hover:border-[#0052CC] hover:bg-blue-50 transition-colors"
                  >
                    <p className="font-medium text-[#172B4D] truncate">{task.title}</p>
                    {task.deadline && (
                      <p className="text-xs text-[#6B778C] mt-1">{task.deadline}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
