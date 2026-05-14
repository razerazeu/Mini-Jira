import { UserRole, NotificationStatus } from '../enums';

export interface User {
  userId: string;  // cognitoSub instead of a generated one

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