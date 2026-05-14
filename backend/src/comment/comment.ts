import { TaskImage } from '../taskImage/taskimage';
import { UserRole } from '../enums';
export interface Comment {
  /**
   * Recommended DynamoDB key design:
   * PK: taskId
   * SK: commentId
   */
  taskId: string;
  commentId: string;

  userId: string;
  userName: string;
  userRole: UserRole;

  text: string;

  createdAt: string;
  updatedAt?: string;

  isDeleted?: boolean;
}