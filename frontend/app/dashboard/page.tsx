'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import Sidebar from '../../components/sidebar';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  assigneeId: string;
  assigneeName?: string;
  teamId: string;
  teamName?: string;
}

interface Team {
  id: string;
  name: string;
}

const columns = [
  { id: 'TODO', title: 'To Do', icon: '~_~', color: 'bg-gray-600' },
  { id: 'IN_PROGRESS', title: 'In Progress', icon: '──●────', color: 'bg-blue-600' },
  { id: 'IN_REVIEW', title: 'In Review', icon: '👁', color: 'bg-yellow-600' },
  { id: 'DONE', title: 'Done', icon: '⋆˙⟡', color: 'bg-green-600' },
];

//just for style lol
const priorityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  URGENT: {
    bg: 'bg-red-950/30',
    border: 'border-red-500/50',
    text: 'text-red-400',
    glow: 'shadow-red-500/20'
  },
  HIGH: {
    bg: 'bg-orange-950/30',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20'
  },
  MEDIUM: {
    bg: 'bg-yellow-950/30',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/20'
  },
  LOW: {
    bg: 'bg-green-950/30',
    border: 'border-green-500/50',
    text: 'text-green-400',
    glow: 'shadow-green-500/20'
  },
};

//also style
const priorityBadges: Record<string, string> = {
  URGENT: 'bg-red-600 text-white',
  HIGH: 'bg-orange-600 text-white',
  MEDIUM: 'bg-yellow-600 text-black',
  LOW: 'bg-green-600 text-white',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isManager, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }
    if (token) {
      fetchTasks();
      fetchTeams();
    }
  }, [token, authLoading, router, selectedTeam]);

  const fetchTasks = async () => {
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/tasks`;
      if (isManager && selectedTeam !== 'all') {
        url += `?teamId=${selectedTeam}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
        console.log('Task updated successfully');
      } else {
        console.error('Failed to update task:', await response.text());
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    if (taskId && draggedTask && draggedTask.status !== status) {
      await updateTaskStatus(taskId, status);
    }
    setDraggedTask(null);
  };

  const getFilteredTasks = () => {
    if (filterPriority === 'all') return tasks;
    return tasks.filter(task => task.priority === filterPriority);
  };

  const filteredTasks = getFilteredTasks();

  const getPriorityCount = (columnId: string, priority: string) => {
    return tasks.filter(t => t.status === columnId && t.priority === priority).length;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-[#0d0d0d] border-b border-gray-800 flex items-center justify-between px-6">
          <h1 className="text-white font-medium">Task Board</h1>
          <div className="flex items-center gap-4">
            {isManager && (
              <button
                onClick={() => router.push('/tasks/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-md transition flex items-center gap-2"
              >
                <span>+</span>
                New Task
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            {/* Team Filter - Only for Managers */}
            {isManager && teams.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400">Team:</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-700 rounded-md text-sm text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All teams</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Priority:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterPriority('all')}
                  className={`px-3 py-1.5 rounded-md text-sm transition ${
                    filterPriority === 'all'
                      ? 'bg-gray-700 text-white'
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterPriority('URGENT')}
                  className={`px-3 py-1.5 rounded-md text-sm transition flex items-center gap-1 ${
                    filterPriority === 'URGENT'
                      ? 'bg-red-600 text-white'
                      : 'bg-[#1a1a1a] text-red-400 hover:bg-red-950/50'
                  }`}
                >
                  🔴 Urgent
                </button>
                <button
                  onClick={() => setFilterPriority('HIGH')}
                  className={`px-3 py-1.5 rounded-md text-sm transition flex items-center gap-1 ${
                    filterPriority === 'HIGH'
                      ? 'bg-orange-600 text-white'
                      : 'bg-[#1a1a1a] text-orange-400 hover:bg-orange-950/50'
                  }`}
                >
                  🟠 High
                </button>
                <button
                  onClick={() => setFilterPriority('MEDIUM')}
                  className={`px-3 py-1.5 rounded-md text-sm transition flex items-center gap-1 ${
                    filterPriority === 'MEDIUM'
                      ? 'bg-yellow-600 text-black'
                      : 'bg-[#1a1a1a] text-yellow-400 hover:bg-yellow-950/50'
                  }`}
                >
                  🟡 Medium
                </button>
                <button
                  onClick={() => setFilterPriority('LOW')}
                  className={`px-3 py-1.5 rounded-md text-sm transition flex items-center gap-1 ${
                    filterPriority === 'LOW'
                      ? 'bg-green-600 text-white'
                      : 'bg-[#1a1a1a] text-green-400 hover:bg-green-950/50'
                  }`}
                >
                  🟢 Low
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {columns.map((column) => (
              <div
                key={column.id}
                className="bg-[#0d0d0d] rounded-md border border-gray-800 overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className={`px-4 py-3 ${column.color} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{column.icon}</span>
                    <h2 className="text-white font-semibold text-sm">{column.title}</h2>
                  </div>
                  <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                    {filteredTasks.filter(t => t.status === column.id).length}
                  </span>
                </div>

                <div className="px-3 py-2 border-b border-gray-800 flex gap-2 text-xs">
                  <span className="text-red-400">🔴</span>
                  <span className="text-orange-400">🟠</span>
                  <span className="text-yellow-400">🟡</span>
                  <span className="text-green-400">🟢</span>
                  <span className="text-gray-500 ml-auto">
                    {getPriorityCount(column.id, 'URGENT')}U / {getPriorityCount(column.id, 'HIGH')}H / {getPriorityCount(column.id, 'MEDIUM')}M / {getPriorityCount(column.id, 'LOW')}L
                  </span>
                </div>

                <div className="p-3 min-h-[calc(100vh-250px)] space-y-2">
                  {filteredTasks
                    .filter(task => task.status === column.id)
                    .map(task => {
                      const colors = priorityColors[task.priority];
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onClick={() => router.push(`/tasks/${task.id}`)}
                          className={`${colors.bg} ${colors.border} border-l-4 rounded-md p-3 cursor-grab active:cursor-grabbing hover:brightness-95 transition shadow-sm ${colors.glow}`}
                        >
                          <div className="flex items-start justify-between">
                            <h3 className="text-white text-sm font-medium line-clamp-2 flex-1">{task.title}</h3>
                            <div className={`w-2 h-2 rounded-full ${colors.border.replace('border', 'bg')}`} />
                          </div>
                          {task.description && (
                            <p className="text-gray-400 text-xs line-clamp-2 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadges[task.priority]}`}>
                              {task.priority}
                            </span>
                            <div className="flex items-center gap-2">
                              {task.deadline && (
                                <span className="text-xs text-gray-500">
                                  📅 {new Date(task.deadline).toLocaleDateString()}
                                </span>
                              )}
                              {task.assigneeName && (
                                <span className="text-xs text-gray-500">{task.assigneeName.split(' ')[0]}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  
                  {filteredTasks.filter(t => t.status === column.id).length === 0 && (
                    <div className="text-center text-gray-600 text-xs py-8">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {tasks.length === 0 && !loading && isManager && (
            <div className="text-center py-12 mt-8">
              <p className="text-gray-500 text-sm mb-3">No tasks yet</p>
              <button
                onClick={() => router.push('/tasks/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-md transition"
              >
                Create your first task
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}