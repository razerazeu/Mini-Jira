'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader, AlertCircle, Target } from 'lucide-react';
import { Task, TaskStatus } from '@/lib/types';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/app/AuthContext';
import { AccessDenied } from '@/components/AccessDenied';
import { useProjects } from '@/lib/hooks/useProjects';
import { KanbanBoard } from '@/components/Kanban';
import { TaskDetailModal } from '@/components/TaskDetail';

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

  const { user, isManager } = useAuth();

  const canViewProject = isManager || (
    !!project?.teamId && !!user?.teamId && String(project?.teamId) === String(user?.teamId)
  );

  useEffect(() => {
    if (canViewProject) {
      fetchProjectTasks();
    }
  }, [projectId, canViewProject]);

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
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-10 h-10 text-[#0052CC] animate-spin mx-auto" />
          <p className="text-[#6B778C] font-medium">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#0052CC] hover:text-[#0747A6] mb-6 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6 border border-red-200">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-[#172B4D]">Failed to Load Project</h2>
              <p className="text-[#6B778C] mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const progressPct = totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0;

  return (
    !canViewProject && project ? (
      <AccessDenied title="Access Denied" message="You don't have permission to view this project." />
    ) : (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E7EB] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#0052CC] hover:text-[#0747A6] mb-4 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#172B4D]">{project?.name || 'Project'}</h1>
              {project?.description && (
                <p className="text-[#6B778C] mt-1.5 max-w-2xl">{project.description}</p>
              )}
            </div>

            {totalTasks > 0 && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-28 bg-[#E4E7EB] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#0052CC] h-full rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[#172B4D]">{progressPct}% done</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader className="w-8 h-8 text-[#0052CC] animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <Target className="w-12 h-12 text-[#0052CC] mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-[#172B4D] font-medium">No tasks in this project yet</p>
                <p className="text-sm text-[#6B778C] mt-1">Create or assign tasks to get started</p>
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
    )
  );
}
