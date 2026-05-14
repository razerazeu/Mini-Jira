export enum UserRole {
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export type NotificationStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'TASK_STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'IMAGE_UPLOADED'
  | 'IMAGE_REPLACED'
  | 'IMAGE_DELETED';
