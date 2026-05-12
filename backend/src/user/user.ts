export type UserRole = 'MANAGER' | 'EMPLOYEE' | 'ADMIN';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

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

export interface User {
  userId: string;

  cognitoSub: string;

  name: string;
  email: string;

  /**
   * MANAGER sees all teams.
   * EMPLOYEE belongs to exactly one team.
   * ADMIN is optional and can be treated like manager.
   */
  role: UserRole;

  /**
   * Required for EMPLOYEE.
   * Optional/null for MANAGER or ADMIN.
   */
  teamId?: string | null;

  /**
   * Useful for UI display without another lookup.
   */
  teamName?: string | null;

  /**
   * Optional SNS email subscription tracking.
   */
  snsSubscriptionArn?: string | null;
  notificationStatus?: NotificationStatus;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}