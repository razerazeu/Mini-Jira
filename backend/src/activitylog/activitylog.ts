import { ActivityType } from '../enums';
export interface ActivityLog {
  /**
   * DynamoDB PK
   */
  logId: string;

  type: ActivityType;

  taskId?: string;
  projectId?: string;

  teamId?: string;
  assigneeId?: string;
  assigneeEmail?: string;

  actorId?: string;
  actorName?: string;

  message: string;

  /**
   * Raw event from SNS/SQS if needed for debugging/demo.
   */
  metadata?: Record<string, unknown>;

  createdAt: string;
}