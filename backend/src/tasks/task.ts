import { TaskImage } from '../taskImage/taskimage';
import { TaskStatus } from '../enums';
import { TaskPriority } from '../enums';
export interface Task {
  /**
   * DynamoDB PK
   */
  taskId: string;

  projectId: string;

  title: string;
  description?: string;

  /**
   * Kanban columns:
   * TODO → IN_PROGRESS → IN_REVIEW → DONE
   */
  status: TaskStatus;

  priority: TaskPriority;

  deadline: string;

  /**
   * Required by assignment requirement.
   */
  assigneeId: string;
  assigneeName?: string;
  assigneeEmail?: string;

  /**
   * Required for server-side team isolation.
   * Tasks table should have GSI: teamId-index.
   */
  teamId: string;
  teamName?: string;

  /**
   * Manager/admin who created the task.
   */
  createdBy: string;
  createdByName?: string;

  /**
   * Optional image attachment.
   * Stores S3 references only, not the image itself.
   */
  image?: TaskImage | null;
  previousImages?: TaskImage[];
  imageOriginalKey?: string | null;
  imageOriginalVersionId?: string | null;
  imageResizedKey?: string | null;

  /**
   * Useful for dashboard and average time-to-close metric.
   */
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  inReviewAt?: string | null;
  closedAt?: string | null;

  /**
   * Optional soft delete.
   * This is safer than immediately removing from DynamoDB during development.
   */
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}
