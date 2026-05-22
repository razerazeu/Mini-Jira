'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Loader2, Search } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { apiClient } from '@/lib/apiClient';
import type { Task, TaskStatus } from '@/lib/types';

function toFrontendStatus(status: TaskStatus | string) {
  switch (status) {
    case 'TODO':
      return 'To Do';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'IN_REVIEW':
      return 'In Review';
    case 'DONE':
      return 'Done';
    default:
      return status;
  }
}

export default function MyTasksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'MANAGER' && !user.teamId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get<Task[]>('/tasks');
        setTasks(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [authLoading, router, user]);

  const myTasks = useMemo(() => {
    if (!user) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const isAssignedToMe = task.assigneeId === user.id;
      const matchesQuery = !normalizedQuery
        || task.title.toLowerCase().includes(normalizedQuery)
        || (task.description || '').toLowerCase().includes(normalizedQuery)
        || task.taskId.toLowerCase().includes(normalizedQuery);

      return isAssignedToMe && matchesQuery;
    });
  }, [query, tasks, user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your tasks...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-600" />
        <h2 className="text-xl font-semibold text-red-900">Failed to load tasks</h2>
        <p className="mt-2 text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Workload</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">My Tasks</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tasks currently assigned to {user?.name || 'you'}.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </div>
      </div>

      {myTasks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">No assigned tasks</h2>
          <p className="mt-2 text-sm text-slate-600">
            There are no tasks assigned to you yet, or nothing matches your search.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {myTasks.map((task) => (
            <button
              key={task.taskId}
              type="button"
              onClick={() => router.push(`/tasks/${task.taskId}`)}
              className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                    {task.priority}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">{task.title}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {toFrontendStatus(task.status)}
                </span>
              </div>

              {task.description ? (
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{task.description}</p>
              ) : null}

              <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                <span>Task #{task.taskId}</span>
                <span className="inline-flex items-center gap-1 text-sky-700">
                  Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}