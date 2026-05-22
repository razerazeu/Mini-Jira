import { useEffect, useState } from 'react';
import { apiClient } from '../apiClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface UserWithTeam {
  userId: string;
  id?: string;
  name: string;
  email: string;
  role: 'MANAGER' | 'EMPLOYEE';
  teamId?: string | null;
  teamName?: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
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

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithTeam[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<UserWithTeam[]>(`/users`);
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await apiClient.get<Team[]>(`/teams`);
      setTeams(response.data);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
    }
  };

  const assignUserToTeam = async (userId: string, teamId: string) => {
    try {
      const response = await apiClient.patch<UserWithTeam>(
        `/users/${userId}/team`,
        { teamId }
      );
      
      // Update users list
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId || u.id === userId ? response.data : u))
      );
      
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to assign user to team');
    }
  };

  const removeUserFromTeam = async (userId: string) => {
    try {
      const response = await apiClient.patch<UserWithTeam>(
        `/users/${userId}/team`,
        { teamId: null }
      );
      
      // Update users list
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId || u.id === userId ? response.data : u))
      );
      
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to remove user from team');
    }
  };

  const reassignUserToTeam = async (userId: string, newTeamId: string) => {
    try {
      const response = await apiClient.patch<UserWithTeam>(
        `/users/${userId}/team`,
        { teamId: newTeamId }
      );
      
      // Update users list
      setUsers((prev) =>
        prev.map((u) => (u.userId === userId || u.id === userId ? response.data : u))
      );
      
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to reassign user to team');
    }
  };

  const refreshUsers = fetchUsers;
  const refreshTeams = fetchTeams;

  return {
    users,
    teams,
    loading,
    error,
    assignUserToTeam,
    removeUserFromTeam,
    reassignUserToTeam,
    refreshUsers,
    refreshTeams,
  };
};
