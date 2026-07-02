'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import { API_BASE } from '@/lib/apiBase';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle, ListChecks } from 'lucide-react';

interface Task {
  taskId: string;
  status: string;
  priority: string;
  deadline: string;
  assigneeId: string;
  assigneeName?: string;
  createdAt: string;
  closedAt?: string | null;
}

const STATUS_COLUMNS = [
  { id: 'TODO', label: 'To Do', bar: 'bg-gray-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', bar: 'bg-blue-500' },
  { id: 'IN_REVIEW', label: 'In Review', bar: 'bg-yellow-500' },
  { id: 'DONE', label: 'Done', bar: 'bg-green-500' },
];

const PRIORITIES = [
  { id: 'HIGH', label: 'High', dot: 'bg-orange-600', stroke: '#ea580c' },
  { id: 'MEDIUM', label: 'Medium', dot: 'bg-yellow-600', stroke: '#ca8a04' },
  { id: 'LOW', label: 'Low', dot: 'bg-green-600', stroke: '#16a34a' },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function AnalyticsPage() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    }
  }, [authLoading, token, router]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setTasks(await response.json());
        } else {
          setTasks([]);
        }
      } catch {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const stats = useMemo(() => {
    const now = Date.now();

    const statusCounts = STATUS_COLUMNS.map((c) => ({
      ...c,
      count: tasks.filter((t) => t.status === c.id).length,
    }));
    const totalTasks = tasks.length;
    const maxStatusCount = Math.max(1, ...statusCounts.map((c) => c.count));

    const priorityCounts = PRIORITIES.map((p) => ({
      ...p,
      count: tasks.filter((t) => t.priority === p.id).length,
    }));
    const priorityTotal = Math.max(1, priorityCounts.reduce((sum, p) => sum + p.count, 0));

    const overdueCount = tasks.filter(
      (t) => t.status !== 'DONE' && t.deadline && new Date(t.deadline).getTime() < now
    ).length;

    const doneTasks = tasks.filter((t) => t.status === 'DONE' && t.closedAt);
    const avgCycleTime = doneTasks.length
      ? (
          doneTasks.reduce(
            (sum, t) => sum + (new Date(t.closedAt!).getTime() - new Date(t.createdAt).getTime()),
            0
          ) /
          doneTasks.length /
          (24 * 60 * 60 * 1000)
        ).toFixed(1)
      : '0.0';

    // Bucket completed tasks into the last 8 weeks by closedAt.
    const weeklyCompleted = Array.from({ length: 8 }, (_, i) => {
      const weeksAgo = 7 - i;
      const bucketStart = now - (weeksAgo + 1) * WEEK_MS;
      const bucketEnd = now - weeksAgo * WEEK_MS;
      return doneTasks.filter((t) => {
        const closedTime = new Date(t.closedAt!).getTime();
        return closedTime >= bucketStart && closedTime < bucketEnd;
      }).length;
    });
    const maxWeekly = Math.max(1, ...weeklyCompleted);
    const completedThisWeek = weeklyCompleted[weeklyCompleted.length - 1];
    const completedLastWeek = weeklyCompleted[weeklyCompleted.length - 2];
    const weekDelta = completedThisWeek - completedLastWeek;

    const assigneeMap = new Map<string, number>();
    doneTasks.forEach((t) => {
      const name = t.assigneeName || 'Unassigned';
      assigneeMap.set(name, (assigneeMap.get(name) || 0) + 1);
    });
    const topAssignees = Array.from(assigneeMap.entries())
      .map(([name, completed]) => ({ name, completed }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);
    const maxAssigneeCompleted = Math.max(1, ...topAssignees.map((a) => a.completed));

    // Build a smooth SVG line for the weekly trend.
    const chartWidth = 560;
    const chartHeight = 160;
    const points = weeklyCompleted.map((v, i) => {
      const x = (i / (weeklyCompleted.length - 1)) * chartWidth;
      const y = chartHeight - (v / maxWeekly) * (chartHeight - 20) - 10;
      return { x, y, v };
    });
    const linePath = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const midX = (prev.x + p.x) / 2;
      return `${acc} Q ${prev.x} ${prev.y} ${midX} ${(prev.y + p.y) / 2} T ${p.x} ${p.y}`;
    }, '');

    // Conic-gradient donut for priority mix.
    let cumulative = 0;
    const gradientStops = priorityCounts
      .map((p) => {
        const start = (cumulative / priorityTotal) * 360;
        cumulative += p.count;
        const end = (cumulative / priorityTotal) * 360;
        return `${p.stroke} ${start}deg ${end}deg`;
      })
      .join(', ');

    return {
      statusCounts, totalTasks, maxStatusCount,
      priorityCounts, priorityTotal,
      weeklyCompleted, maxWeekly, completedThisWeek, weekDelta,
      avgCycleTime, overdueCount,
      topAssignees, maxAssigneeCompleted,
      chartWidth, chartHeight, points, linePath,
      gradientStops,
    };
  }, [tasks]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#6B778C] text-sm">Loading...</p>
      </div>
    );
  }

  const {
    statusCounts, totalTasks, maxStatusCount,
    priorityCounts, priorityTotal,
    weeklyCompleted, completedThisWeek, weekDelta,
    avgCycleTime, overdueCount,
    topAssignees, maxAssigneeCompleted,
    chartWidth, chartHeight, points, linePath,
    gradientStops,
  } = stats;

  if (totalTasks === 0) {
    return (
      <div className="min-h-screen">
        <header className="h-14 bg-white border-b border-[#E4E7EB] flex items-center px-6 shrink-0">
          <h1 className="text-[#172B4D] font-medium">Analytics</h1>
        </header>
        <div className="p-6">
          <p className="text-[#6B778C] text-sm">No tasks yet — analytics will appear once tasks are created.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="h-14 bg-white border-b border-[#E4E7EB] flex items-center px-6 shrink-0">
        <h1 className="text-[#172B4D] font-medium">Analytics</h1>
      </header>

      <div className="p-6 space-y-6">
        {/* Stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E4E7EB] rounded-md p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B778C]">Total Tasks</span>
              <ListChecks className="w-4 h-4 text-[#6B778C]" />
            </div>
            <p className="text-2xl font-semibold text-[#172B4D] mt-2">{totalTasks}</p>
          </div>

          <div className="bg-white border border-[#E4E7EB] rounded-md p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B778C]">Completed This Week</span>
              <CheckCircle2 className="w-4 h-4 text-[#6B778C]" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-semibold text-[#172B4D]">{completedThisWeek}</p>
              <span className={`text-xs flex items-center gap-0.5 ${weekDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {weekDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(weekDelta)}
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#E4E7EB] rounded-md p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B778C]">Avg Cycle Time</span>
              <Clock className="w-4 h-4 text-[#6B778C]" />
            </div>
            <p className="text-2xl font-semibold text-[#172B4D] mt-2">{avgCycleTime}<span className="text-sm text-[#6B778C] ml-1">days</span></p>
          </div>

          <div className="bg-white border border-[#E4E7EB] rounded-md p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6B778C]">Overdue</span>
              <AlertTriangle className="w-4 h-4 text-[#6B778C]" />
            </div>
            <p className="text-2xl font-semibold text-[#172B4D] mt-2">{overdueCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tasks by status */}
          <div className="bg-white border border-[#E4E7EB] rounded-md p-4">
            <h2 className="text-sm font-medium text-[#172B4D] mb-4">Tasks by Status</h2>
            <div className="flex items-end gap-4 h-40">
              {statusCounts.map((s) => (
                <div key={s.id} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-xs text-[#6B778C] mb-1">{s.count}</span>
                  <div
                    className={`${s.bar} w-full rounded-t-sm transition-all`}
                    style={{ height: `${(s.count / maxStatusCount) * 100}%` }}
                  />
                  <span className="text-xs text-[#6B778C] mt-2 text-center">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks by priority */}
          <div className="bg-white border border-[#E4E7EB] rounded-md p-4">
            <h2 className="text-sm font-medium text-[#172B4D] mb-4">Tasks by Priority</h2>
            <div className="flex items-center gap-6">
              <div
                className="w-28 h-28 rounded-full shrink-0 relative"
                style={{ background: `conic-gradient(${gradientStops})` }}
              >
                <div className="absolute inset-2.5 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-lg font-semibold text-[#172B4D]">{priorityTotal}</span>
                  <span className="text-[10px] text-[#6B778C]">tasks</span>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {priorityCounts.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />
                    <span className="text-[#6B778C] flex-1">{p.label}</span>
                    <span className="text-[#172B4D] font-medium">{p.count}</span>
                    <span className="text-[#6B778C] text-xs w-10 text-right">
                      {Math.round((p.count / priorityTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly trend */}
        <div className="bg-white border border-[#E4E7EB] rounded-md p-4">
          <h2 className="text-sm font-medium text-[#172B4D] mb-4">Completed Tasks — Last 8 Weeks</h2>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-40"
            onMouseLeave={() => setHoverPoint(null)}
          >
            <line x1="0" y1={chartHeight - 10} x2={chartWidth} y2={chartHeight - 5} stroke="#E4E7EB" strokeWidth="1" />
            <path d={linePath} fill="none" stroke="#3987e5" strokeWidth="2" />
            {points.map((p, i) => (
              <g key={i}>
                <rect
                  x={p.x - (chartWidth / weeklyCompleted.length) / 2}
                  y="0"
                  width={chartWidth / weeklyCompleted.length}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoverPoint(i)}
                />
                <circle cx={p.x} cy={p.y} r={hoverPoint === i ? 5 : 3.5} fill="#3987e5" stroke="#ffffff" strokeWidth="1.5" />
                {hoverPoint === i && (
                  <g>
                    <rect x={p.x - 16} y={p.y - 28} width="32" height="18" rx="4" fill="#172B4D" stroke="#E4E7EB" />
                    <text x={p.x} y={p.y - 15} textAnchor="middle" fontSize="10" fill="#ffffff">
                      {p.v}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </svg>
          <div className="flex justify-between text-xs text-[#6B778C] mt-1">
            {weeklyCompleted.map((_, i) => (
              <span key={i}>W{i + 1}</span>
            ))}
          </div>
        </div>

        {/* Top assignees */}
        <div className="bg-white border border-[#E4E7EB] rounded-md p-4">
          <h2 className="text-sm font-medium text-[#172B4D] mb-4">Top Assignees — Completed Tasks</h2>
          {topAssignees.length === 0 ? (
            <p className="text-[#6B778C] text-sm">No completed tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {topAssignees.map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <span className="text-sm text-[#172B4D] w-20 shrink-0 truncate">{a.name}</span>
                  <div className="flex-1 bg-[#F4F5F7] rounded-sm h-3 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-sm"
                      style={{ width: `${(a.completed / maxAssigneeCompleted) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-[#172B4D] w-6 text-right">{a.completed}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
