'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import { API_BASE } from '@/lib/apiBase';

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
  image?: {
    displayUrl?: string;
    thumbnailUrl?: string;
  };
}

interface Team {
  teamId: string;
  name: string;
  description?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const columns = [
  { id: 'TODO', title: 'To Do', icon: '~_~', color: 'bg-gray-600' },
  { id: 'IN_PROGRESS', title: 'In Progress', icon: '──●────', color: 'bg-blue-600' },
  { id: 'IN_REVIEW', title: 'In Review', icon: '👁', color: 'bg-yellow-600' },
  { id: 'DONE', title: 'Done', icon: '⋆˙⟡', color: 'bg-green-600' },
];

const priorityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
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

const priorityBadges: Record<string, string> = {
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
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
      return;
    }
    if (token) {
      fetchTasks();
      if (isManager) {
        fetchTeams();
      }
    }
  }, [token, authLoading, router, selectedTeam, isManager]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/tasks`;
      
      if (isManager && selectedTeam && selectedTeam !== 'all') {
        url += `?teamId=${selectedTeam}`;
        console.log('🔍 Filtering tasks for teamId:', selectedTeam);
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        let allTasks = await response.json();
        
        // Apply frontend filtering for employees (backend already filters by team)
        if (!isManager && selectedTeam !== 'all' && selectedTeam !== 'all') {
          allTasks = allTasks.filter((task: Task) => task.teamId === selectedTeam);
        }
        
        setTasks(allTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${API_BASE}/teams`, {
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
      const response = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
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
        console.log('Task status updated successfully');
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    // Check if employee can drag this task (only if assigned to them)
    if (!isManager && task.assigneeId !== user?.id) {
      e.preventDefault();
      return false;
    }
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
    const task = tasks.find(t => t.id === taskId);
    
    // Check if employee can update this task (only if assigned to them)
    if (task && !isManager && task.assigneeId !== user?.id) {
      console.log('Employee cannot move task not assigned to them');
      return;
    }
    
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
          <p className="mt-4 text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="h-14 bg-[#0d0d0d] border-b border-gray-800 flex items-center justify-between px-6">
        <h1 className="text-white font-medium">Task Board</h1>
        <div className="flex items-center gap-4">
          {isManager && (
            <button
              onClick={() => router.push('/task/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-md transition flex items-center gap-2"
            >
              <span>+</span>
              New Task
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {/* Filters Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Team Filter - Only for Managers */}
          {(isManager || (!isManager && user?.teamId)) && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Team:</label>
              <select
                value={selectedTeam}
                onChange={(e) => {
                  console.log('🎯 Team filter changed to:', e.target.value);
                  setSelectedTeam(e.target.value);
                }}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-700 rounded-md text-sm text-white focus:ring-1 focus:ring-blue-500"
              >
                {isManager ? (
                  <>
                    <option value="all">All teams</option>
                    {teams.map((team) => (
                      <option key={team.teamId} value={team.teamId}>{team.name}</option>
                    ))}
                  </>
                ) : (
                  <option value="all">My team</option>
                )}
              </select>
            </div>
          )}

          {/* Priority Filter */}
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
                All ({tasks.length})
              </button>
              <button
                onClick={() => setFilterPriority('HIGH')}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  filterPriority === 'HIGH'
                    ? 'bg-orange-600 text-white'
                    : 'bg-[#1a1a1a] text-orange-400 hover:bg-orange-950/50'
                }`}
              >
                🟠 High ({tasks.filter(t => t.priority === 'HIGH').length})
              </button>
              <button
                onClick={() => setFilterPriority('MEDIUM')}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  filterPriority === 'MEDIUM'
                    ? 'bg-yellow-600 text-black'
                    : 'bg-[#1a1a1a] text-yellow-400 hover:bg-yellow-950/50'
                }`}
              >
                🟡 Medium ({tasks.filter(t => t.priority === 'MEDIUM').length})
              </button>
              <button
                onClick={() => setFilterPriority('LOW')}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  filterPriority === 'LOW'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#1a1a1a] text-green-400 hover:bg-green-950/50'
                }`}
              >
                🟢 Low ({tasks.filter(t => t.priority === 'LOW').length})
              </button>
            </div>
          </div>
        </div>

        {/* Debug info */}
        <div className="mb-4 text-xs text-gray-500 bg-[#1a1a1a] p-2 rounded">
          Debug: Showing {filteredTasks.length} of {tasks.length} tasks | Role: {isManager ? 'Manager' : 'Employee'}
        </div>

        {/* Kanban Board */}
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
                <span className="text-orange-400">🟠</span>
                <span className="text-yellow-400">🟡</span>
                <span className="text-green-400">🟢</span>
                <span className="text-gray-500 ml-auto">
                  {getPriorityCount(column.id, 'HIGH')}H / {getPriorityCount(column.id, 'MEDIUM')}M / {getPriorityCount(column.id, 'LOW')}L
                </span>
              </div>

              <div className="p-3 min-h-[calc(100vh-250px)] space-y-2">
                {filteredTasks
                  .filter(task => task.status === column.id)
                  .map(task => {
                    const colors = priorityColors[task.priority];
                    const canDrag = isManager || (!isManager && task.assigneeId === user?.id);
                    
                    return (
                      <div
                        key={task.id}
                        draggable={canDrag}
                        onDragStart={(e) => handleDragStart(e, task)}
                          onClick={() => router.push(`/task/${task.id}`)}
                        className={`${colors.bg} ${colors.border} border-l-4 rounded-md p-3 ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} hover:brightness-95 transition shadow-sm ${colors.glow}`}
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="text-white text-sm font-medium line-clamp-2 flex-1">{task.title}</h3>
                          <div className={`w-2 h-2 rounded-full ${colors.border.replace('border', 'bg')}`} />
                        </div>
                        {(task.image?.thumbnailUrl || task.image?.displayUrl) && (
                          <img
                            src={task.image.thumbnailUrl || task.image.displayUrl}
                            alt={task.title}
                            className="mt-3 h-24 w-full rounded-md object-cover"
                          />
                        )}
                        {task.description && (
                          <p className="text-gray-400 text-xs line-clamp-2 mt-2">{task.description}</p>
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
                        {!isManager && task.assigneeId === user?.id && (
                          <div className="mt-2 text-xs text-blue-400/70">
                            You can drag this task
                          </div>
                        )}
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
              onClick={() => router.push('/task/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-md transition"
            >
              Create your first task
            </button>
          </div>
        )}
      </div>
    </>
  );
}
