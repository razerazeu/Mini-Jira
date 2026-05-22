'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/app/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

import type { Task, Comment, Attachment, AuditLog, TaskStatus, TaskPriority } from '../../types/task';

function toFrontendStatus(s: string): string {
  switch (s) {
    case 'TODO': return 'To Do';
    case 'IN_PROGRESS': return 'In Progress';
    case 'IN_REVIEW': return 'In Review';
    case 'DONE': return 'Done';
    default: return s;
  }
}

function toBackendStatus(s: string): string {
  switch (s) {
    case 'To Do': return 'TODO';
    case 'In Progress': return 'IN_PROGRESS';
    case 'In Review': return 'IN_REVIEW';
    case 'Done': return 'DONE';
    default: return s;
  }
}

interface TaskDetailResponse {
  task: Task;
  auditLog: AuditLog[];
  comments: Comment[];
  attachments: Attachment[];
}

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch task data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch task
        const taskRes = await apiClient.get(`/tasks/${taskId}`);
        const taskJson = taskRes.data;
        const taskData: Task = {
          ...taskJson,
          status: toFrontendStatus(taskJson.status),
        };
        setTask(taskData);

        // Fetch comments
        const commentsRes = await apiClient.get(`/tasks/${taskId}/comments`);
        const commentsData: Comment[] = commentsRes.data;
        setComments(commentsData);

        // Fetch attachments
        const attachmentsRes = await apiClient.get(`/tasks/${taskId}/attachments`);
        const attachmentsData: Attachment[] = attachmentsRes.data;
        setAttachments(attachmentsData);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchData();
    }
  }, [taskId, toast]);

  if (loading) return <div className="flex h-[60vh] items-center justify-center">Loading...</div>;
  if (error) return <div className="p-6 text-center">Error: {error}</div>;
  if (!task) return <div className="p-6 text-center">Task not found</div>;

  // Status transition logic
  const statusOrder: string[] = ['To Do', 'In Progress', 'In Review', 'Done'];
  const currentStatusIndex = statusOrder.indexOf(task.status);
  const canUpdateStatus = currentStatusIndex < statusOrder.length - 1;
  const nextStatus = canUpdateStatus ? statusOrder[currentStatusIndex + 1] : null;

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!nextStatus) return;
    try {
      await apiClient.patch(`/tasks/${taskId}/status`, {
        status: toBackendStatus(nextStatus),
      });
      // Refetch task to get updated status
      const updatedTaskRes = await apiClient.get(`/tasks/${taskId}`);
      const updatedTaskJson = updatedTaskRes.data;
      const updatedTask: Task = {
        ...updatedTaskJson,
        status: toFrontendStatus(updatedTaskJson.status),
      };
      setTask(updatedTask);
      toast({
        title: 'Success',
        description: `Status updated to ${nextStatus}`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (content: string) => {
    try {
      const res = await apiClient.post(`/tasks/${taskId}/comments`, { content });
      const newComment = res.data;
      setComments([...comments, newComment]);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Handle file upload (placeholder - would integrate with S3/Lambda)
  const handleFileUpload = async (file: File) => {
    // In a real app, this would:
    // 1. Get a signed URL from backend
    // 2. Upload file directly to S3
    // 3. Notify backend to create attachment record
    // 4. Trigger Lambda for image processing
    // For now, we'll simulate
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Refetch attachments
      const attachmentsRes = await apiClient.get(`/tasks/${taskId}/attachments`);
      const attachmentsData: Attachment[] = attachmentsRes.data;
      setAttachments(attachmentsData);
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Handle attachment deletion
  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
      // Refetch attachments
      const attachmentsRes = await apiClient.get(`/tasks/${taskId}/attachments`);
      const attachmentsData: Attachment[] = attachmentsRes.data;
      setAttachments(attachmentsData);
      toast({
        title: 'Success',
        description: 'Attachment deleted',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Task #{task.taskId} • {task.teamName}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Status Badge */}
              <span className={`px-3 py-1 text-xs font-medium rounded-full 
                ${task.status === 'To Do' ? 'bg-blue-100 text-blue-800' :
                  task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                  task.status === 'In Review' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'}`}>
                {task.status}
              </span>
              {/* Update Status Button */}
              {canUpdateStatus && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading}
                  className={`px-3 py-1 text-sm font-medium rounded 
                    ${loading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' :
                      'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {loading ? 'Updating...' : `Start ${nextStatus}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs / Sections */}
        <div className="space-y-8">
          {/* Task Info */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Details</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-gray-700">{task.description || 'No description'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded 
                  ${task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'}`}>
                  {task.priority}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Deadline</h3>
                <p className="text-gray-700">
                  {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Assignee</h3>
                <p className="text-gray-700">
                  {task.assigneeName || 'Unassigned'}
                </p>
              </div>
            </div>
          </section>

          {/* Audit Log */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Log</h2>
            {task.auditLog && task.auditLog.length > 0 ? (
              <div className="space-y-4">
                {task.auditLog.map((log: AuditLog) => (
                  <div key={log.activityId} className="border-l-2 border-blue-500 pl-4">
                    <p className="text-sm text-gray-600">
                      {log.type} by {log.actorName}{' '}
                      <span className="text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </p>
                    {log.message && <p className="text-sm text-gray-700 mt-1">{log.message}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No audit log entries</p>
            )}
          </section>

          {/* Comments */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Comments ({comments.length})</h2>
            {/* Comments List */}
            <div className="mb-6 space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.commentId} className="border p-4 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {comment.userName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{comment.userName}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-gray-700">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No comments yet</p>
              )}
            </div>
            {/* Add Comment Form */}
            <div className="border p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Add a comment</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const textarea = e.target.elements.namedItem('content') as HTMLTextAreaElement;
                  const content = textarea.value.trim();
                  if (content) {
                    handleCommentSubmit(content);
                    textarea.value = '';
                  }
                }}
              >
                <textarea
                  name="content"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write a comment..."
                  required
                ></textarea>
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Attachments */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
            {/* Upload Form */}
            <div className="mb-6 p-4 border rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Upload Attachment</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.target.elements.namedItem('file') as HTMLInputElement;
                  const file = input.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                    input.value = '';
                  }
                }}
              >
                <input
                  type="file"
                  name="file"
                  id="file-upload"
                  className="mb-3 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept="image/*,.pdf,.doc,.docx,.zip"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Upload
                </button>
              </form>
            </div>
            {/* Attachments List */}
            <div className="space-y-4">
              {attachments.length > 0 ? (
                attachments.map((attachment) => (
                  <div key={attachment.fileName} className="border p-4 rounded-lg flex items-start space-x-4">
                    {/* File Icon / Preview */}
                    <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                      {attachment.mimeType?.startsWith('image/') ? (
                        <img
                          src={attachment.displayUrl || attachment.fileName}
                          alt="Preview"
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <div className="text-gray-500">
                          {attachment.fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{attachment.fileName}</h3>
                      <p className="text-sm text-gray-500">
                        Uploaded by {attachment.uploadedBy} •
                        {attachment.uploadedAt ? new Date(attachment.uploadedAt).toLocaleString() : 'Unknown date'}
                      </p>
                      <div className="mt-2 flex items-center space-x-3">
                        <a
                          href={attachment.displayUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(attachment.fileName)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No attachments yet</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Back to Dashboard Link */}
      <div className="mx-auto max-w-7xl px-6 py-4">
        <a
          href="/dashboard"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
