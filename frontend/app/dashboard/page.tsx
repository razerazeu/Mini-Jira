'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import { API_BASE } from '@/lib/apiBase';
import { Eye, Calendar, Plus, Circle, Users, X } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';

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
  { id: 'TODO', title: 'To Do', icon: '~_~', dot: 'bg-gray-400', cardBorder: 'border-l-gray-400' },
  { id: 'IN_PROGRESS', title: 'In Progress', icon: '──●────', dot: 'bg-blue-500', cardBorder: 'border-l-blue-500' },
  { id: 'IN_REVIEW', title: 'In Review', icon: <Eye className="w-3.5 h-3.5" />, dot: 'bg-yellow-500', cardBorder: 'border-l-yellow-500' },
  { id: 'DONE', title: 'Done', icon: '⋆˙⟡', dot: 'bg-green-500', cardBorder: 'border-l-green-500' },
];

const priorityBadges: Record<string, string> = {
  HIGH: 'bg-orange-600 text-white',
  MEDIUM: 'bg-yellow-600 text-black',
  LOW: 'bg-green-600 text-white',
};

function TaskCardContent({ task }: { task: Task }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[#172B4D] text-sm font-medium line-clamp-2 flex-1">{task.title}</h3>
      </div>
      {(task.image?.thumbnailUrl || task.image?.displayUrl) && (
        <img
          src={task.image.thumbnailUrl || task.image.displayUrl}
          alt={task.title}
          className="mt-3 h-24 w-full rounded-md object-cover"
        />
      )}
      {task.description && (
        <p className="text-[#6B778C] text-xs line-clamp-2 mt-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityBadges[task.priority]}`}>
            {task.priority}
          </span>
          {task.deadline && (
            <span className="text-xs text-[#6B778C] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(task.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
        {task.assigneeName && (
          <span
            title={task.assigneeName}
            className="w-5 h-5 rounded-full bg-blue-500/20 text-[#0052CC] text-[10px] font-medium flex items-center justify-center shrink-0"
          >
            {task.assigneeName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </>
  );
}

function DraggableTaskCard({
  task,
  cardBorder,
  canDrag,
  onOpen,
}: {
  task: Task;
  cardBorder: string;
  canDrag: boolean;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: !canDrag,
  });

  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
      onClick={onOpen}
      className={`bg-white border border-[#E4E7EB] ${cardBorder} border-l-4 rounded-md rounded-l-sm p-3 ${
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } hover:bg-[#F4F5F7] hover:shadow-md transition shadow-sm ${isDragging ? 'opacity-30' : ''}`}
    >
      <TaskCardContent task={task} />
    </div>
  );
}

function DroppableColumn({
  id,
  isOver: forcedOver,
  children,
}: {
  id: string;
  isOver?: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const active = forcedOver ?? isOver;

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-lg border overflow-hidden transition-colors ${
        active ? 'border-[#0052CC]/60 ring-1 ring-[#0052CC]/40' : 'border-[#E4E7EB]'
      }`}
    >
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isManager, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

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
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks.find(t => t.id === e.active.id);
    setDraggedTask(task ?? null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const task = draggedTask;
    setDraggedTask(null);

    const status = e.over?.id as string | undefined;
    if (!task || !status) return;

    // Only the assignee (or a manager) may move a task
    if (!isManager && task.assigneeId !== user?.id) return;

    if (task.status !== status) {
      await updateTaskStatus(task.id, status);
    }
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
      <div className="flex items-center justify-center h-screen bg-[#F7F8FA]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0052CC] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-[#6B778C]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA]">
      <header className="h-14 bg-white border-b border-[#E4E7EB] flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[#172B4D] font-medium">Dashboard</h1>
        <div className="flex items-center gap-4">
          {isManager && (
            <button
              onClick={() => router.push('/task/create')}
              className="bg-[#0052CC] hover:bg-[#0747A6] text-white text-sm px-4 py-1.5 rounded-md transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 p-6">
        {/* Filters Bar */}
        <div className="mb-6 bg-white border border-[#E4E7EB] rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          {/* Team Filter - Only for Managers */}
          {(isManager || (!isManager && user?.teamId)) && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#6B778C] shrink-0" />
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 bg-white border border-[#E4E7EB] rounded-md text-sm text-[#172B4D] focus:ring-1 focus:ring-[#0052CC] focus:outline-none"
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

          <div className="hidden sm:block w-px h-6 bg-[#E4E7EB]" />

          {/* Priority Filter — segmented control */}
          <div className="inline-flex items-center bg-white border border-[#E4E7EB] rounded-md p-1 gap-1 overflow-x-auto">
            <button
              onClick={() => setFilterPriority('all')}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap transition ${
                filterPriority === 'all'
                  ? 'bg-[#0052CC] text-white'
                  : 'text-[#6B778C] hover:text-[#172B4D] hover:bg-[#F4F5F7]'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilterPriority('HIGH')}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap transition flex items-center gap-1.5 ${
                filterPriority === 'HIGH'
                  ? 'bg-orange-600 text-white'
                  : 'text-orange-400 hover:bg-[#F4F5F7]'
              }`}
            >
              <Circle className="w-2 h-2 fill-orange-500 text-orange-500" />
              High ({tasks.filter(t => t.priority === 'HIGH').length})
            </button>
            <button
              onClick={() => setFilterPriority('MEDIUM')}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap transition flex items-center gap-1.5 ${
                filterPriority === 'MEDIUM'
                  ? 'bg-yellow-600 text-black'
                  : 'text-yellow-400 hover:bg-[#F4F5F7]'
              }`}
            >
              <Circle className="w-2 h-2 fill-yellow-500 text-yellow-500" />
              Medium ({tasks.filter(t => t.priority === 'MEDIUM').length})
            </button>
            <button
              onClick={() => setFilterPriority('LOW')}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap transition flex items-center gap-1.5 ${
                filterPriority === 'LOW'
                  ? 'bg-green-600 text-white'
                  : 'text-green-400 hover:bg-[#F4F5F7]'
              }`}
            >
              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
              Low ({tasks.filter(t => t.priority === 'LOW').length})
            </button>
          </div>

          {(filterPriority !== 'all' || selectedTeam !== 'all') && (
            <button
              onClick={() => {
                setFilterPriority('all');
                setSelectedTeam('all');
              }}
              className="flex items-center gap-1 text-xs text-[#6B778C] hover:text-[#172B4D] transition sm:ml-auto"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        {/* Kanban Board */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {columns.map((column) => (
              <DroppableColumn key={column.id} id={column.id}>
                <div className="px-3.5 py-3 flex items-center justify-between border-b border-[#E4E7EB]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${column.dot}`} />
                    <h2 className="text-[#172B4D] font-medium text-sm truncate">{column.title}</h2>
                    <span className="text-[#6B778C] text-xs shrink-0">{column.icon}</span>
                  </div>
                  <span className="text-xs text-[#6B778C] bg-[#F4F5F7] px-2 py-0.5 rounded-full shrink-0">
                    {filteredTasks.filter(t => t.status === column.id).length}
                  </span>
                </div>

                <div className="px-3.5 py-1.5 border-b border-[#E4E7EB] flex items-center gap-1.5 text-[11px] text-[#6B778C]">
                  <span>{getPriorityCount(column.id, 'HIGH')}H</span>
                  <span className="text-[#6B778C]">·</span>
                  <span>{getPriorityCount(column.id, 'MEDIUM')}M</span>
                  <span className="text-[#6B778C]">·</span>
                  <span>{getPriorityCount(column.id, 'LOW')}L</span>
                </div>

                <div className="p-2.5 min-h-[240px] space-y-2 bg-[#F7F8FA]">
                  {filteredTasks
                    .filter(task => task.status === column.id)
                    .map(task => {
                      const canDrag = isManager || (!isManager && task.assigneeId === user?.id);

                      return (
                        <DraggableTaskCard
                          key={task.id}
                          task={task}
                          cardBorder={column.cardBorder}
                          canDrag={canDrag}
                          onOpen={() => router.push(`/task/${task.id}`)}
                        />
                      );
                    })}

                  {filteredTasks.filter(t => t.status === column.id).length === 0 && (
                    <div className="text-center text-[#6B778C] text-xs py-8 border border-dashed border-[#E4E7EB] rounded-md">
                      No tasks
                    </div>
                  )}
                </div>
              </DroppableColumn>
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease-out' }}>
            {draggedTask ? (
              <div
                className={`bg-white border border-[#E4E7EB] ${
                  columns.find(c => c.id === draggedTask.status)?.cardBorder ?? ''
                } border-l-4 rounded-md rounded-l-sm p-3 shadow-2xl cursor-grabbing w-72`}
              >
                <TaskCardContent task={draggedTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {tasks.length === 0 && !loading && isManager && (
          <div className="text-center py-12 mt-8">
            <p className="text-[#6B778C] text-sm mb-3">No tasks yet</p>
            <button
              onClick={() => router.push('/task/create')}
              className="bg-[#0052CC] hover:bg-[#0747A6] text-white text-sm px-4 py-1.5 rounded-md transition"
            >
              Create your first task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
