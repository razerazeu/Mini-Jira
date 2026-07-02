'use client';

import { useState } from 'react';
import { useProjects, Project } from '@/lib/hooks/useProjects';
import { useTeams } from '@/lib/hooks/useTeams';
import { ProjectCard } from './ProjectCard';
import { ProjectFormModal } from './ProjectFormModal';
import { DeleteProjectModal } from './DeleteProjectModal';
import { Plus, Loader, AlertCircle, RefreshCw, Grid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/AuthContext';

export function ProjectsPage() {
  const router = useRouter();
  const { projects, loading, error, createProject, updateProject, deleteProject } =
    useProjects();
  const { teams } = useTeams();
  const { user, isManager } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const handleCreateProject = async (data: {
    name: string;
    description?: string;
    teamId?: string;
  }) => {
    await createProject(data);
  };

  const handleEditProject = async (data: {
    name: string;
    description?: string;
    teamId?: string;
  }) => {
    if (!editingProject) return;
    await updateProject(editingProject.projectId, data);
    setEditingProject(null);
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    await deleteProject(deletingProject.projectId);
    setDeletingProject(null);
  };

  const handleViewTasks = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-[#6B778C] animate-spin mx-auto" />
          <p className="text-[#6B778C] font-medium">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172B4D]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E7EB] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#172B4D]">Projects</h1>
              <p className="text-[#6B778C] mt-1">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </p>
            </div>
            {isManager && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                New Project
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1 border border-[#E4E7EB] rounded-lg p-1 bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-50 text-[#0052CC]'
                    : 'text-[#6B778C] hover:text-[#172B4D]'
                }`}
                title="Grid view"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-50 text-[#0052CC]'
                    : 'text-[#6B778C] hover:text-[#172B4D]'
                }`}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-red-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#172B4D] mb-2">Failed to Load Projects</h2>
            <p className="text-[#6B778C] mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow border border-[#E4E7EB] p-12 text-center">
            <div className="text-5xl mb-4">📁</div>
            <h2 className="text-xl font-semibold text-[#172B4D] mb-2">No Projects Yet</h2>
            <p className="text-[#6B778C] mb-6">
              Create your first project to get started organizing tasks.
            </p>
            {isManager && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                onClick={() => handleViewTasks(project.projectId)}
                onEdit={() => setEditingProject(project)}
                onDelete={() => setDeletingProject(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        teams={teams}
        title="Create New Project"
        submitButtonText="Create"
      />

      {editingProject && (
        <ProjectFormModal
          isOpen={true}
          onClose={() => setEditingProject(null)}
          onSubmit={handleEditProject}
          teams={teams}
          initialData={editingProject}
          title="Edit Project"
          submitButtonText="Update"
        />
      )}

      <DeleteProjectModal
        isOpen={deletingProject !== null}
        project={deletingProject}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeletingProject(null)}
      />
    </div>
  );
}
