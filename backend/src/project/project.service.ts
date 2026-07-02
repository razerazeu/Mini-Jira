import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';
import { DynamoDBService } from '../aws/dynamodb.service';
import { TeamService } from '../team/team.service';
import { isManager } from '../auth/role.utils';

@Injectable()
export class ProjectService {
  private projects: any[] = [];
  private readonly tableName?: string;
  private readonly useDynamo: boolean;

  constructor(
    private readonly dynamo: DynamoDBService,
    private readonly teamService: TeamService,
  ) {
    this.tableName = this.dynamo.table('projects');
    this.useDynamo = process.env.USE_DYNAMODB !== 'false' && !!this.tableName;
  }

  async create(createProjectDto: CreateProjectDto, user?: any) {
    await this.assertProjectTeamExists(createProjectDto.teamId);

    const project = this.buildProject(createProjectDto, user);

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: project,
      });
    } else {
      this.projects.push(project);
    }

    return project;
  }

  async adjustTaskCount(projectId: string, delta: number) {
    const project = await this.findOne(projectId);

    project.totalTasks = Math.max(0, (project.totalTasks || 0) + delta);
    project.updatedAt = new Date().toISOString();

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: project,
      });
    }

    return project;
  }

  async adjustCompletedTaskCount(projectId: string, delta: number) {
    const project = await this.findOne(projectId);

    project.completedTasks = Math.max(0, (project.completedTasks || 0) + delta);
    project.updatedAt = new Date().toISOString();

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: project,
      });
    }

    return project;
  }

  async findAll(user?: any) {
    const projects = this.useDynamo
      ? ((await this.dynamo.scan({ TableName: this.tableName })).Items || [])
      : this.projects;

    if (!user || isManager(user)) {
      return projects;
    }

    if (!user.teamId) {
      throw new ForbiddenException('User does not belong to a team');
    }

    return projects.filter(
      (project) => project.teamId == null || project.teamId === user.teamId,
    );
  }

  async findOne(id: string, user?: any) {
    const project = this.useDynamo
      ? await this.getProjectFromTable(id)
      : this.projects.find((p) => p.id === id || p.projectId === id);

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    if (user && !this.canAccessProject(project, user)) {
      throw new ForbiddenException('You cannot access this project');
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.findOne(id);
    const updates: Omit<Partial<UpdateProjectDto>, 'teamId'> & {
      teamId?: string | null;
    } = this.definedOnly(updateProjectDto);

    if ('teamId' in updates) {
      updates.teamId = updates.teamId || null;
    }

    await this.assertProjectTeamExists(updates.teamId);

    Object.assign(project, updates);

    project.updatedAt = new Date().toISOString();

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: project,
      });
    }

    return project;
  }

  async remove(id: string) {
    const project = await this.findOne(id);

    if (this.useDynamo) {
      await this.dynamo.delete({
        TableName: this.tableName,
        Key: { projectId: id },
      });
    } else {
      this.projects = this.projects.filter(
        (p) => p.id !== id,
      );
    }

    return {
      message: 'Project deleted successfully',
      project,
    };
  }

  private buildProject(createProjectDto: CreateProjectDto, user?: any) {
    const now = new Date().toISOString();
    const id = randomUUID();

    return {
      id,
      projectId: id,
      ...createProjectDto,
      teamId: createProjectDto.teamId || null,
      createdBy: user?.userId || user?.sub || user?.id || 'system',
      isActive: true,
      totalTasks: 0,
      completedTasks: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  private async getProjectFromTable(id: string) {
    const result = await this.dynamo.get({
      TableName: this.tableName,
      Key: { projectId: id },
    });

    return result.Item ?? null;
  }

  private async assertProjectTeamExists(teamId?: string | null) {
    if (!teamId) {
      return;
    }

    await this.teamService.findOne(teamId);
  }

  private canAccessProject(project: any, user: any) {
    if (isManager(user)) {
      return true;
    }

    return Boolean(
      project.teamId == null || (user?.teamId && project.teamId === user.teamId),
    );
  }

  private definedOnly<T extends Record<string, any>>(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
    ) as Partial<T>;
  }
}
