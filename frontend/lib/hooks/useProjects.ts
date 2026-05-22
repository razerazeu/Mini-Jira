import { useEffect, useState } from 'react';
import { apiClient } from '../apiClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Project {
  projectId: string;
  name: string;
  description?: string;
  createdBy: string;
  teamId?: string | null;
  teamName?: string;
  totalTasks?: number;
  completedTasks?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Project[]>(`/projects`);
      setProjects(response.data);
    } catch (err: any) {
      const status = err.response?.status;
      setError(
        status === 403 ? 'You do not have permission to view projects.' : err.response?.data?.message || 'Failed to load projects'
      );
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (data: {
    name: string;
    description?: string;
    teamId?: string;
  }) => {
    try {
      const response = await apiClient.post<Project>(`/projects`, data);
      setProjects((prev) => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create project');
    }
  };

  const updateProject = async (
    projectId: string,
    data: {
      name?: string;
      description?: string;
      teamId?: string;
    }
  ) => {
    try {
      const response = await apiClient.put<Project>(`/projects/${projectId}`, data);
      setProjects((prev) =>
        prev.map((p) => (p.projectId === projectId ? response.data : p))
      );
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update project');
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await apiClient.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const refreshProjects = fetchProjects;

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
  };
};
