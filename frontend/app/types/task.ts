export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Task {
  taskId: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  assigneeId: string;
  assigneeName?: string;
  assigneeEmail?: string;
  teamId: string;
  teamName?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  inReviewAt?: string | null;
  closedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  auditLog: AuditLog[];
}

export interface Comment {
  taskId: string;
  commentId: string;
  userId: string;
  userName: string;
  userRole: 'MANAGER' | 'EMPLOYEE';
  text: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface Attachment {
  fileName: string;
  mimeType?: string;
  url?: string;
  displayUrl?: string;
  sizeBytes?: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface AuditLog {
  activityId: string;
  type: string;
  taskId?: string;
  projectId?: string;
  teamId?: string;
  assigneeId?: string;
  assigneeEmail?: string;
  actorId?: string;
  actorName?: string;
  oldStatus?: TaskStatus;
  newStatus?: TaskStatus;
  reason?: string;
  message: string;
  createdAt: string;
}
