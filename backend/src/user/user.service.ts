import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DynamoDBService } from '../aws/dynamodb.service';
import { CognitoService } from '../auth/cognito.service';
import { normalizeRole } from '../auth/role.utils';
import { UserRole } from '../enums';
import { TeamService } from '../team/team.service';

@Injectable()
export class UserService {
  private readonly tableName?: string;

  constructor(
    private readonly dynamo: DynamoDBService,
    private readonly cognitoService: CognitoService,
    private readonly teamService: TeamService,
  ) {
    this.tableName = this.dynamo.table('users');
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

    const updatedUser = {
      ...user,
      teamId: team.teamId || team.id,
      teamName: team.name,
      updatedAt: new Date().toISOString(),
    };

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
}
