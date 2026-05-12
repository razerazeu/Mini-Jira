export interface Team {
  teamId: string;

  name: string;

  description?: string;

  /**
   * Optional manager/admin who created the team.
   */
  createdBy: string;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}