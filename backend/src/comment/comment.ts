import { TaskImage } from '../taskImage/taskimage';
import { UserRole } from '../user/user';
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

  /**
   * Optional if you allow attachments in comments later.
   * Not required, but okay to keep optional.
   */
  attachment?: TaskImage | null;

  createdAt: string;
  updatedAt?: string;

  isDeleted?: boolean;
}