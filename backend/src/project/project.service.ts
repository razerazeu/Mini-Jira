import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DynamoDBService } from '../aws/dynamodb.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from '../enums';
import { CreateProjectDto } from './create-project.dto';
import { Project } from './project';
import { UpdateProjectDto } from './update-project.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly dynamoDb: DynamoDBService) {}

  async create(createProjectDto: CreateProjectDto, user: AuthenticatedUser) {
    this.assertManager(user);

    const now = new Date().toISOString();
    const project: Project = {
      projectId: uuid(),
      name: createProjectDto.name,
      description: createProjectDto.description,
      teamId: createProjectDto.teamId ?? null,
      createdBy: user.userId,
      isActive: true,
      totalTasks: 0,
      completedTasks: 0,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamoDb.put({
      TableName: this.dynamoDb.table('projects'),
      Item: project,
    });

    return project;
  }

  async findAll(user: AuthenticatedUser) {
    const result = await this.dynamoDb.scan({
      TableName: this.dynamoDb.table('projects'),
      FilterExpression: 'attribute_not_exists(isActive) OR isActive = :active',
      ExpressionAttributeValues: {
        ':active': true,
      },
    });

    const projects = (result.Items ?? []) as Project[];
    if (this.isManager(user)) {
      return projects;
    }

    return projects.filter(
      (project) => !project.teamId || project.teamId === user.teamId,
    );
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const result = await this.dynamoDb.get({
      TableName: this.dynamoDb.table('projects'),
      Key: { projectId: id },
    });

    const project = result.Item as Project | undefined;
    if (!project || project.isActive === false) {
      throw new NotFoundException('Project not found');
    }

    if (
      !this.isManager(user) &&
      project.teamId &&
      project.teamId !== user.teamId
    ) {
      throw new ForbiddenException('You cannot access this project');
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    user: AuthenticatedUser,
  ) {
    this.assertManager(user);
    await this.findOne(id, user);

    const updates = {
      ...updateProjectDto,
      updatedAt: new Date().toISOString(),
    };

    const result = await this.dynamoDb.update({
      TableName: this.dynamoDb.table('projects'),
      Key: { projectId: id },
      ...this.toUpdateExpression(updates),
      ReturnValues: 'ALL_NEW',
    });

    return result.Attributes as Project;
  }

  async remove(id: string, user: AuthenticatedUser) {
    this.assertManager(user);
    await this.findOne(id, user);

    const result = await this.dynamoDb.update({
      TableName: this.dynamoDb.table('projects'),
      Key: { projectId: id },
      ...this.toUpdateExpression({
        isActive: false,
        updatedAt: new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    });

    return {
      message: 'Project deleted successfully',
      project: result.Attributes as Project,
    };
  }

  private assertManager(user: AuthenticatedUser) {
    if (!this.isManager(user)) {
      throw new ForbiddenException('Only managers can manage projects');
    }
  }

  private isManager(user: AuthenticatedUser) {
    return String(user.role).toUpperCase() === UserRole.MANAGER;
  }

  private toUpdateExpression(values: Record<string, unknown>) {
    const entries = Object.entries(values).filter(
      ([, value]) => value !== undefined,
    );

    return {
      UpdateExpression: `SET ${entries
        .map(([key]) => `#${key} = :${key}`)
        .join(', ')}`,
      ExpressionAttributeNames: Object.fromEntries(
        entries.map(([key]) => [`#${key}`, key]),
      ),
      ExpressionAttributeValues: Object.fromEntries(
        entries.map(([key, value]) => [`:${key}`, value]),
      ),
    };
  }
}
