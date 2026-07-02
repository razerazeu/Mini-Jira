'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../AuthContext';
import { AccessDenied } from '@/components/AccessDenied';
import { API_BASE } from '@/lib/apiBase';

interface Team {
  id: string;
  teamId?: string;
  name: string;
  description?: string;
}

interface User {
  id: string;
  userId?: string;
  name: string;
  email: string;
  teamId?: string;
  role?: string;
}

interface Project {
  id: string;
  projectId?: string;
  name: string;
  teamId?: string;
  description?: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const { user, token, isManager, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [deadline, setDeadline] = useState('');
  const [teamId, setTeamId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);

    if (!file) {
      setImagePreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // For the dropdowns in creating a task
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    }
  }, [token, isManager, authLoading, router]);

  useEffect(() => {
    if (token && isManager) {
      fetchTeams();
      fetchProjects();
    }
  }, [token, isManager]);

  useEffect(() => {
    if (token && isManager && teamId) {
      fetchTeamUsers(teamId);
    } else {
      setUsers([]);
      setAssigneeId('');
    }
  }, [token, isManager, teamId]);

  // Filter projects when team changes
  useEffect(() => {
    if (teamId) {
      const filtered = projects.filter(p => p.teamId == null || p.teamId === teamId);
      setFilteredProjects(filtered);
      if (projectId && !filtered.find(p => getProjectId(p) === projectId)) {
        setProjectId('');
      }
    } else {
      setFilteredProjects([]);
      setProjectId('');
    }
  }, [teamId, projects, projectId]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE}/teams`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        if (data.length === 1) {
          const firstTeamId = data[0].id || data[0].teamId;
          setTeamId(String(firstTeamId));
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchTeamUsers = async (selectedTeamId: string) => {
    setLoadingUsers(true);
    setAssigneeId('');
    try {
      const response = await fetch(`${API_BASE}/users?teamId=${encodeURIComponent(selectedTeamId)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Map users to ensure we have the correct ID format
        const mappedUsers = data.map((userData: any) => ({
          id: userData.userId || userData.id || userData.email,
          userId: userData.userId,
          name: userData.name,
          email: userData.email,
          teamId: userData.teamId,
          role: userData.role,
        })).filter((userData: User) => (
          userData.teamId === selectedTeamId &&
          (!userData.role || userData.role.toUpperCase() === 'EMPLOYEE')
        ));
        setUsers(mappedUsers);
        console.log('Users loaded:', mappedUsers);
      } else {
        console.error('Failed to fetch users:', response.status);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        setFilteredProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Extra validation
    if (!teamId) {
      setError('Please select a team');
      setLoading(false);
      return;
    }
    
    if (!assigneeId) {
      setError('Please select an assignee');
      setLoading(false);
      return;
    }
    
    if (!projectId) {
      setError('Please select a project');
      setLoading(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('priority', priority);
      if (deadline) formData.append('deadline', deadline);
      formData.append('teamId', String(teamId));
      formData.append('assigneeId', String(assigneeId));
      formData.append('projectId', projectId);
      formData.append('status', 'TODO');
      if (imageFile) {
        formData.append('file', imageFile);
      }
      
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to create task');
        console.error('Task creation error:', data);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get team display ID
  const getTeamId = (team: Team) => team.id || team.teamId;
  const getProjectId = (project: Project) => project.id || project.projectId || '';

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#F7F8FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0052CC]"></div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  if (!isManager) {
    return <AccessDenied title="Managers only" message="Only managers can create tasks." />;
  }

  return (
    <main className="overflow-auto">
      <header className="h-14 bg-white border-b border-[#E4E7EB] flex items-center px-6">
        <h1 className="text-[#172B4D] font-medium">Create New Task</h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-md border border-[#E4E7EB] p-6 space-y-5">

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter task title"
              className="w-full px-3 py-2 bg-white border border-[#E4E7EB] rounded-md focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-[#172B4D] placeholder-[#6B778C]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the task..."
              className="w-full px-3 py-2 bg-white border border-[#E4E7EB] rounded-md focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-[#172B4D] placeholder-[#6B778C] resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4E7EB] rounded-md text-[#172B4D] focus:ring-1 focus:ring-[#0052CC]"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E4E7EB] rounded-md focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-[#172B4D]"
            />
          </div>

          {/* Team */}
          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Team <span className="text-red-400">*</span>
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
              disabled={loadingTeams}
              className="w-full px-3 py-2 bg-white border border-[#E4E7EB] rounded-md text-[#172B4D] focus:ring-1 focus:ring-[#0052CC] disabled:opacity-50"
            >
              <option value="">Select a team</option>
              {teams.map((team) => {
                const teamIdentifier = getTeamId(team);
                return (
                  <option key={teamIdentifier} value={teamIdentifier}>
                    {team.name}
                  </option>
                );
              })}
            </select>
            {loadingTeams && (
              <p className="text-sm text-[#6B778C] mt-1">Loading teams...</p>
            )}
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Assign To <span className="text-red-400">*</span>
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              required
              disabled={!teamId || loadingUsers}
              className="w-full px-3 py-2 bg-white border border-[#E4E7EB] rounded-md text-[#172B4D] focus:ring-1 focus:ring-[#0052CC] disabled:opacity-50"
            >
              <option value="">Select a user</option>
              {users.map((userItem) => (
                <option key={userItem.id} value={userItem.id}>
                  {userItem.name} ({userItem.email})
                </option>
              ))}
            </select>
            {!teamId && (
              <p className="text-sm text-[#6B778C] mt-1">Select a team first to see assignable users.</p>
            )}
            {teamId && !loadingUsers && users.length === 0 && (
              <p className="text-sm text-yellow-500 mt-1">No users found in this team.</p>
            )}
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Project <span className="text-red-400">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              disabled={!teamId}
              className="w-full px-3 py-2 bg-white border border-[#E4E7EB] rounded-md text-[#172B4D] focus:ring-1 focus:ring-[#0052CC] disabled:opacity-50"
            >
              <option value="">Select a project</option>
              {filteredProjects.map((project) => (
                <option key={getProjectId(project)} value={getProjectId(project)}>
                  {project.name}
                </option>
              ))}
            </select>
            {teamId && filteredProjects.length === 0 && (
              <p className="text-sm text-yellow-500 mt-1">
                No projects available for this team. Create a project first.
              </p>
            )}
            {!teamId && (
              <p className="text-sm text-[#6B778C] mt-1">
                Select a team first to see available projects.
              </p>
            )}
          </div>

          {/* Task Image */}
          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1">
              Task Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="w-full text-sm text-[#172B4D] file:rounded-md file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium file:bg-[#F4F5F7] file:text-[#172B4D]"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-3 h-36 w-full rounded-md object-cover border border-[#E4E7EB]"
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !title || !teamId || !assigneeId || !projectId}
              className="flex-1 bg-[#0052CC] hover:bg-[#0747A6] text-white py-2 rounded-md transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-white border border-[#E4E7EB] rounded-md text-[#6B778C] hover:bg-[#F4F5F7] transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
