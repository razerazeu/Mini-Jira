import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { v4 as uuid } from 'uuid';

import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';
import { DynamoDBService } from '../aws/dynamodb.service';

@Injectable()
export class ProjectService {
  private projects: any[] = [];
  private readonly tableName?: string;
  private readonly useDynamo: boolean;

  constructor(private readonly dynamo: DynamoDBService) {
    this.tableName = this.dynamo.table('projects');
    this.useDynamo = process.env.USE_DYNAMODB === 'true' && !!this.tableName;
  }

  async create(createProjectDto: CreateProjectDto) {
    const project = this.buildProject(createProjectDto);

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

  async findAll() {
    if (this.useDynamo) {
      const result = await this.dynamo.scan({ TableName: this.tableName });
      return result.Items || [];
    }

    return this.projects;
  }

  async findOne(id: string) {
    const project = this.useDynamo
      ? await this.getProjectFromTable(id)
      : this.projects.find((p) => p.id === id);

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.findOne(id);

    Object.assign(project, updateProjectDto);

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

  private buildProject(createProjectDto: CreateProjectDto) {
    const now = new Date().toISOString();
    const id = uuid();

    return {
      id,
      projectId: id,
      ...createProjectDto,
      createdBy: 'system',
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
}