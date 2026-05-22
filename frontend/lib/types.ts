export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type UserRole = 'MANAGER' | 'EMPLOYEE';

export interface Task {
  taskId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  assigneeId?: string;
  deadline?: string;
  projectId?: string;
  teamId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  commentId: string;
  taskId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  createdAt: string;
}

export interface ActivityLog {
  activityId: string;
  taskId: string;
  userId: string;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface TaskImage {
  imageId: string;
  taskId: string;
  url: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Project {
  projectId: string;
  name: string;
  description?: string;
  createdBy: string;
  teamId?: string | null;
  teamName?: string;
  totalTasks?: number;
  completedTasks?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  teamId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}
