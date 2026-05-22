import { useEffect, useState } from 'react';
import { apiClient } from '../apiClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'EMPLOYEE';
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  teamId: string;
  id?: string;
  name: string;
  description?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Team[]>(`/teams`);
      setTeams(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const response = await apiClient.get<TeamMember[]>(`/teams/${teamId}/members`);
      setTeamMembers((prev) => ({
        ...prev,
        [teamId]: response.data,
      }));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to load team members');
    }
  };

  const createTeam = async (data: {
    name: string;
    description?: string;
  }) => {
    try {
      const response = await apiClient.post<Team>(`/teams`, data);
      setTeams((prev) => [...prev, response.data]);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create team');
    }
  };

  const updateTeam = async (
    teamId: string,
    data: {
      name?: string;
      description?: string;
    }
  ) => {
    try {
      const response = await apiClient.put<Team>(`/teams/${teamId}`, data);
      setTeams((prev) =>
        prev.map((t) => (t.teamId === teamId || t.id === teamId ? response.data : t))
      );
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update team');
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      await apiClient.delete(`/teams/${teamId}`);
      setTeams((prev) => prev.filter((t) => t.teamId !== teamId && t.id !== teamId));
      setTeamMembers((prev) => {
        const newMembers = { ...prev };
        delete newMembers[teamId];
        return newMembers;
      });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete team');
    }
  };

  const refreshTeams = fetchTeams;

  return {
    teams,
    teamMembers,
    loading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    fetchTeamMembers,
    refreshTeams,
  };
};
