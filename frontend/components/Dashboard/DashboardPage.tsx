'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/AuthContext';
import { Button } from '@/components/ui/button';
import { API_BASE } from '@/lib/apiBase';

export function DashboardPage() {
  const { user, isManager, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const [tasksRes, projectsRes] = await Promise.all([
          fetch(`${API_BASE}/tasks`),
          fetch(`${API_BASE}/projects`),
        ]);

        if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
        if (!projectsRes.ok) throw new Error('Failed to fetch projects');

        const [tasksData, projectsData] = await Promise.all([
          tasksRes.json(),
          projectsRes.json(),
        ]);

        setTasks(tasksData);
        setProjects(projectsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  if (authLoading || loading) {
    return <div className="flex h-[60vh] items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6 text-center">Please log in to view the dashboard.</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-2xl font-bold text-[#172B4D] mb-2">Welcome, {user.name}</h1>
        <p className="text-sm text-[#6B778C] mb-8">
          {isManager ? 'Manager Dashboard' : 'Employee Dashboard'}
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="bg-white p-6 rounded-xl shadow border border-[#E4E7EB]">
            <h2 className="text-sm font-medium text-[#6B778C]">Total Tasks</h2>
            <p className="text-3xl font-bold text-[#172B4D] mt-2">{tasks.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-[#E4E7EB]">
            <h2 className="text-sm font-medium text-[#6B778C]">Total Projects</h2>
            <p className="text-3xl font-bold text-[#172B4D] mt-2">{projects.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-[#E4E7EB]">
            <h2 className="text-sm font-medium text-[#6B778C]">Role</h2>
            <p className="text-3xl font-bold text-[#172B4D] mt-2">{user.role}</p>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#172B4D]">Your Tasks</h2>
            {isManager && <Button>Create Task</Button>}
          </div>
          {tasks.length === 0 ? (
            <p className="text-[#6B778C]">No tasks yet.</p>
          ) : (
            <div className="space-y-4">
              {(tasks as any[]).map((task) => (
                <div key={task.id || task.taskId} className="bg-white p-4 rounded-lg border border-[#E4E7EB]">
                  <h3 className="font-medium text-[#172B4D]">{task.title}</h3>
                  <p className="text-sm text-[#6B778C]">
                    Status: {task.status || 'N/A'} • Priority: {task.priority || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
