export interface Project {

  projectId: string;

  name: string;
  description?: string;

  /**
   * Manager/admin who created the project.
   */
  createdBy: string;

  /**
   * Optional if a project belongs to a specific team.
   * If null, manager can use it across teams.
   */
  teamId?: string | null;

  /**
   * Useful counters for dashboard.
   * Optional because they can also be calculated from Tasks.
   */
  totalTasks?: number;
  completedTasks?: number;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}