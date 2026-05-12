import { TaskStatus } from '../user/user';
export interface AuditLog {
  /**
   * Recommended DynamoDB key design:
   * PK: taskId
   * SK: changedAt
   */
  taskId: string;
  changedAt: string;

  auditId: string;

  changedBy: string;
  changedByName?: string;

  oldStatus: TaskStatus;
  newStatus: TaskStatus;

  /**
   * Optional note if user adds reason.
   */
  reason?: string;

  teamId: string;
}