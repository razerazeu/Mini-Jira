import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { CreateTeamDto } from './create-team.dto';
import { UpdateTeamDto } from './update-team.dto';
import { DynamoDBService } from '../aws/dynamodb.service';

@Injectable()
export class TeamService {
  private teams: any[] = [];
  private readonly tableName?: string;
  private readonly useDynamo: boolean;

  constructor(private readonly dynamo: DynamoDBService) {
    this.tableName = this.dynamo.table('teams');
    this.useDynamo = process.env.USE_DYNAMODB !== 'false' && !!this.tableName;
  }

  async create(createTeamDto: CreateTeamDto, user?: any) {
    await this.assertTeamNameAvailable(createTeamDto.name);

    const now = new Date().toISOString();
    const id = randomUUID();
    const team = {
      id,
      teamId: id,
      ...createTeamDto,
      createdBy: user?.userId || user?.sub || user?.id || 'system',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: team,
      });
    } else {
      this.teams.push(team);
    }

    return team;
  }

  async findAll() {
    if (this.useDynamo) {
      const result = await this.dynamo.scan({ TableName: this.tableName });
      return result.Items || [];
    }

    return this.teams;
  }

  async findOne(id: string) {
    const team = this.useDynamo
      ? await this.getTeamFromTable(id)
      : this.teams.find(
          (t) => t.id === id || t.teamId === id,
        );

    if (!team) {
      throw new NotFoundException(
        'Team not found',
      );
    }

    return team;
  }

  update(
    id: string,
    updateTeamDto: UpdateTeamDto,
  ) {
    return this.updateAsync(id, updateTeamDto);
  }

  private async updateAsync(
    id: string,
    updateTeamDto: UpdateTeamDto,
  ) {
    const team = await this.findOne(id);
    const updates = this.definedOnly(updateTeamDto);

    if (updates.name) {
      await this.assertTeamNameAvailable(updates.name, team.teamId || team.id);
    }

    Object.assign(team, updates);
    team.updatedAt = new Date().toISOString();

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: team,
      });
    }

    return team;
  }

  async remove(id: string) {
    const team = await this.findOne(id);

    if (this.useDynamo) {
      await this.dynamo.delete({
        TableName: this.tableName,
        Key: { teamId: id },
      });
    } else {
      this.teams = this.teams.filter(
        (t) => t.id !== id && t.teamId !== id,
      );
    }

    return {
      message: 'Team deleted successfully',
      team,
    };
  }

  private async getTeamFromTable(id: string) {
    const result = await this.dynamo.get({
      TableName: this.tableName,
      Key: { teamId: id },
    });

    return result.Item ?? null;
  }

  private async assertTeamNameAvailable(name: string, currentTeamId?: string) {
    const normalizedName = this.normalizeName(name);
    const teams = await this.findAll();
    const existingTeam = teams.find(
      (team) =>
        this.normalizeName(team.name) === normalizedName &&
        team.teamId !== currentTeamId &&
        team.id !== currentTeamId,
    );

    if (existingTeam) {
      throw new BadRequestException('Team name already exists');
    }
  }

  private normalizeName(name: string) {
    return name.trim().toLowerCase();
  }

  private definedOnly<T extends Record<string, any>>(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
    ) as Partial<T>;
  }
}
