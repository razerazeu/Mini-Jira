'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import { Task, TaskStatus } from '@/lib/types';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';
import { useProjects } from '@/lib/hooks/useProjects';
import { KanbanBoard } from '@/components/Kanban';
import { TaskDetailModal } from '@/components/TaskDetail';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ProjectDetailPageProps {
  projectId: string;
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const router = useRouter();
  const { projects } = useProjects();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const project = projects.find((p) => p.projectId === projectId);

  useEffect(() => {
    fetchProjectTasks();
  }, [projectId]);

  const fetchProjectTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get all tasks and filter by project
      const response = await apiClient.get<Task[]>(`/tasks`);
      const projectTasks = response.data.filter((task) => task.projectId === projectId);
      setTasks(projectTasks);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load tasks';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setIsUpdating(true);
    try {
      const response = await apiClient.patch<Task>(`/tasks/${taskId}/status`, {
        status: newStatus,
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.taskId === taskId ? response.data : task
        )
      );

      toast.success(`Task moved to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update task';
      toast.error(message);
      await fetchProjectTasks();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateTask = () => {
    toast((t) => (
      <span>
        Task creation - <strong>coming soon!</strong>
      </span>
    ));
  };

  if (isLoading && !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-gray-400 animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 border border-red-200">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Failed to Load Project</h2>
              <p className="text-gray-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-full px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project?.name || 'Project'}</h1>
            {project?.description && (
              <p className="text-gray-600 mt-2">{project.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((status) => {
              const count = tasks.filter((t) => t.status === status).length;
              const icons = {
                TODO: '📝',
                IN_PROGRESS: '⚡',
                IN_REVIEW: '👀',
                DONE: '✅',
              };
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-2xl">{icons[status as keyof typeof icons]}</span>
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold">
                      {status.replace(/_/g, ' ')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-gray-600 font-medium">No tasks in this project yet</p>
              <p className="text-sm text-gray-500 mt-1">Create or assign tasks to get started</p>
            </div>
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            isLoading={isLoading}
            onTaskClick={handleTaskClick}
            onStatusChange={handleStatusChange}
            onCreateTask={handleCreateTask}
            isUpdating={isUpdating}
          />
        )}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTaskId(null);
          fetchProjectTasks();
        }}
      />
    </div>
  );
}
