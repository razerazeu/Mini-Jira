import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DynamoDBService } from '../aws/dynamodb.service';
import { SNSService } from '../aws/sns.service';
import { CognitoService } from '../auth/cognito.service';
import { normalizeRole } from '../auth/role.utils';
import { NotificationStatus, UserRole } from '../enums';
import { TeamService } from '../team/team.service';

@Injectable()
export class UserService {
  private readonly tableName?: string;

  constructor(
    private readonly dynamo: DynamoDBService,
    private readonly snsService: SNSService,
    private readonly cognitoService: CognitoService,
    private readonly teamService: TeamService,
  ) {
    this.tableName = this.dynamo.table('users');
  }

  async findAll() {
    if (!this.tableName) {
      throw new NotFoundException('Users table not configured');
    }

    const result = await this.dynamo.scan({
      TableName: this.tableName,
    });

    return result.Items || [];
  }

  async findByTeam(teamId: string) {
    if (!this.tableName) {
      throw new NotFoundException('Users table not configured');
    }

    const result = await this.dynamo.scan({
      TableName: this.tableName,
      FilterExpression: 'teamId = :teamId',
      ExpressionAttributeValues: {
        ':teamId': teamId,
      },
    });

    return result.Items || [];
  }

  async findOne(userId: string) {
    if (!this.tableName) {
      throw new NotFoundException('Users table not configured');
    }

    const result = await this.dynamo.get({
      TableName: this.tableName,
      Key: { userId },
    });

    if (!result.Item) {
      throw new NotFoundException('User not found');
    }

    return result.Item;
  }

  async assignTeam(userId: string, teamId: string) {
    const user = await this.findOne(userId);
    const team = await this.teamService.findOne(teamId);

    if (normalizeRole(user.role) !== UserRole.EMPLOYEE) {
      throw new BadRequestException('Only employees can be assigned to a team');
    }

    if (user.teamId) {
      throw new BadRequestException('User already in a team');
    }

    const updatedUser = {
      ...user,
      teamId: team.teamId || team.id,
      teamName: team.name,
      updatedAt: new Date().toISOString(),
    };

    Object.assign(
      updatedUser,
      await this.ensureEmployeeNotificationSubscriptions(updatedUser),
    );

    await this.cognitoService.updateMembership(
      user.email || user.userId,
      UserRole.EMPLOYEE,
      updatedUser.teamId,
    );

    await this.dynamo.put({
      TableName: this.tableName,
      Item: updatedUser,
    });

    return updatedUser;
  }

  private async ensureEmployeeNotificationSubscriptions(user: any) {
    const notification = {
      snsSubscriptionArn: user.snsSubscriptionArn ?? null,
      taskAssignmentSubscriptionArn:
        user.taskAssignmentSubscriptionArn ?? user.snsSubscriptionArn ?? null,
      dailyDigestSubscriptionArn: user.dailyDigestSubscriptionArn ?? null,
      notificationStatus:
        (user.notificationStatus as NotificationStatus | undefined) ??
        ('PENDING' satisfies NotificationStatus),
    };

    if (process.env.USE_DYNAMODB === 'false') {
      return notification;
    }

    try {
      if (!notification.taskAssignmentSubscriptionArn) {
        const taskAssignmentSubscription =
          await this.snsService.subscribeEmailToTaskAssignments(user.email);
        notification.taskAssignmentSubscriptionArn =
          taskAssignmentSubscription.SubscriptionArn ?? null;
        notification.snsSubscriptionArn =
          taskAssignmentSubscription.SubscriptionArn ?? null;
        await this.trySetAssigneeFilter(
          taskAssignmentSubscription.SubscriptionArn,
          user.email,
        );
      }

      if (!notification.dailyDigestSubscriptionArn) {
        const dailyDigestSubscription =
          await this.snsService.subscribeEmailToDailyDigest(user.email);
        notification.dailyDigestSubscriptionArn =
          dailyDigestSubscription.SubscriptionArn ?? null;
        await this.trySetAssigneeFilter(
          dailyDigestSubscription.SubscriptionArn,
          user.email,
        );
      }

      notification.notificationStatus = 'PENDING';
    } catch (error) {
      notification.notificationStatus = 'FAILED';
      console.error('Failed to subscribe employee to SNS notifications', {
        userId: user.userId,
        email: user.email,
        error,
      });
    }

    return notification;
  }

  private async trySetAssigneeFilter(
    subscriptionArn: string | undefined,
    email: string,
  ) {
    if (!subscriptionArn || subscriptionArn === 'pending confirmation') {
      return;
    }

    try {
      await this.snsService.setEmailFilterPolicy(subscriptionArn, email);
    } catch (error) {
      console.error('Failed to set SNS assignee filter policy', {
        subscriptionArn,
        email,
        error,
      });
    }
  }
}