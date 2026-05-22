'use client';

import { Task, TaskStatus } from '@/lib/types';
import React from 'react';

interface KanbanBoardProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskClick?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTask?: () => void;
  isUpdating?: boolean;
}

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
          return (
            <div key={status} className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                {status.replace(/_/g, ' ')}
                <span className="ml-2 text-sm text-gray-500">({columnTasks.length})</span>
              </h3>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div
                    key={task.taskId}
                    onClick={() => onTaskClick?.(task.taskId)}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900 truncate">{task.title}</p>
                    {task.deadline && (
                      <p className="text-xs text-gray-500 mt-1">{task.deadline}</p>
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
