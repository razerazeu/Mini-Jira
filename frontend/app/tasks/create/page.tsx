'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../AuthContext';
import Sidebar from '../../../components/sidebar';

interface Team {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
}

export default function CreateTaskPage() {
  const router = useRouter();
  const { user, token, isManager, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [deadline, setDeadline] = useState('');
  const [teamId, setTeamId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('');
  
  //for the dropdowns in creating a task
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!authLoading && (!token || !isManager)) {
      router.push('/dashboard');
    }
  }, [token, isManager, authLoading, router]);

  useEffect(() => {
    if (token && isManager) {
      fetchTeams();
      fetchProjects();
    }
  }, [token, isManager]);

  useEffect(() => {
    if (teamId) {
      fetchUsersByTeam(teamId);
    }
  }, [teamId]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        if (data.length === 1) {
          setTeamId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchUsersByTeam = async (teamId: string) => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?teamId=${teamId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const taskData = {
        title,
        description,
        priority,
        deadline: deadline || undefined,
        teamId,
        assigneeId,
        projectId: projectId || undefined,
        status: 'TODO',
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError(data.message || 'Failed to create task');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className="flex-1 overflow-auto">
        <header className="h-14 bg-[#0d0d0d] border-b border-gray-800 flex items-center px-6">
          <h1 className="text-white font-medium">Create New Task</h1>
        </header>

        <div className="p-6 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-[#0d0d0d] rounded-md border border-gray-800 p-6 space-y-5">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter task title"
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe the task..."
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-gray-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Team <span className="text-red-400">*</span>
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                disabled={loadingTeams}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Assign To <span className="text-red-400">*</span>
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                required
                disabled={!teamId || loadingUsers}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
              {teamId && !loadingUsers && users.length === 0 && (
                <p className="text-sm text-yellow-500 mt-1">No users in this team yet</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !title || !teamId || !assigneeId}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition disabled:opacity-50 font-medium"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}