'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/AuthContext';

interface Task {
  id: string;
  taskId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  assigneeId: string;
  assigneeName: string;
  assigneeEmail: string;
  teamId: string;
  teamName?: string;
  projectId: string;
  projectName?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName: string;
  image?: {
    displayUrl?: string;
    thumbnailUrl?: string;
  };
  auditLog?: AuditLog[];
}

interface Comment {
  commentId: string;
  text: string;
  userName: string;
  createdAt: string;
}

interface AuditLog {
  activityId: string;
  type: string;
  actorName?: string;
  message?: string;
  createdAt: string;
  oldStatus?: string;
  newStatus?: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user, isManager } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const taskId = params.taskId as string;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (taskId) {
      fetchTask();
      fetchComments();
      fetchAuditLog();
    }
  }, [token, taskId]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTask(data);
      } else if (response.status === 404) {
        setError('Task not found');
      } else if (response.status === 403) {
        setError('You do not have permission to view this task');
      } else {
        setError('Failed to load task');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLog = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/activities`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAuditLog(data);
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newComment }),
      });
      
      if (response.ok) {
        const comment = await response.json();
        setComments([...comments, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
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
        setTask(prev => prev ? { ...prev, status: newStatus } : null);
        await fetchAuditLog();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'TODO': return 'bg-gray-600';
      case 'IN_PROGRESS': return 'bg-blue-600';
      case 'IN_REVIEW': return 'bg-yellow-600';
      case 'DONE': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'TODO': return 'To Do';
      case 'IN_PROGRESS': return 'In Progress';
      case 'IN_REVIEW': return 'In Review';
      case 'DONE': return 'Done';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'URGENT': return 'bg-red-600';
      case 'HIGH': return 'bg-orange-600';
      case 'MEDIUM': return 'bg-yellow-600';
      case 'LOW': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const statusOrder = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  const currentIndex = task ? statusOrder.indexOf(task.status) : -1;
  const nextStatus = currentIndex >= 0 && currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-black">
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-md">
          {error}
        </div>
        <button onClick={() => router.back()} className="mt-4 text-gray-400 hover:text-white">
          Go Back
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <p className="text-gray-400">Task not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded-full text-xs text-white ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(task.status)}`}>
              {getStatusLabel(task.status)}
            </span>
          </div>
        </div>

        {/* Task Card */}
        <div className="bg-[#0d0d0d] rounded-md border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-semibold text-white">{task.title}</h1>
                <p className="text-xs text-gray-500 mt-1">ID: {task.taskId || task.id}</p>
              </div>
              {nextStatus && (isManager || task.assigneeId === user?.id) && (
                <button
                  onClick={() => handleUpdateStatus(nextStatus)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition"
                >
                  Move to {getStatusLabel(nextStatus)}
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
            <p className="text-white">{task.description || 'No description provided'}</p>
          </div>

          {/* Details */}
          {(task.image?.displayUrl || task.image?.thumbnailUrl) && (
            <div className="border-b border-gray-800">
              <img
                src={task.image.thumbnailUrl || task.image.displayUrl}
                alt={task.title}
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
          <div className="p-4 border-b border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Team</h3>
                <p className="text-white">{task.teamName || task.teamId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Project</h3>
                <p className="text-white">{task.projectName || task.projectId}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Deadline</h3>
                <p className="text-white">
                  {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Created By</h3>
                <p className="text-white">{task.createdByName || task.createdBy}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Created At</h3>
                <p className="text-white">{new Date(task.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Audit Log</h3>
            {auditLog.length > 0 ? (
              <div className="space-y-3">
                {auditLog.map((log) => (
                  <div key={log.activityId} className="bg-[#111111] p-3 rounded-md border border-gray-800">
                    <div className="flex items-center justify-between gap-4 text-xs text-gray-400">
                      <span>{log.type.replace(/_/g, ' ')}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-white mt-2">{log.message || 'Status changed'}</p>
                    {log.actorName && (
                      <p className="text-xs text-gray-500 mt-1">By {log.actorName}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No audit log entries yet</p>
            )}
          </div>

          {/* Comments */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Comments ({comments.length})</h3>
            
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.commentId} className="bg-[#1a1a1a] p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                      {comment.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-white text-sm font-medium">{comment.userName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm ml-8">{comment.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition disabled:opacity-50"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
