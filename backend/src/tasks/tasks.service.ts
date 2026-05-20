import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';
import { UpdateTaskStatusDto } from './update-task-status.dto';

import { Task } from './task';
import { S3Service } from '../aws/s3.service';
import { DynamoDBService } from '../aws/dynamodb.service';
import { ProjectService } from '../project/project.service';
import { TeamService } from '../team/team.service';
import { UserRole } from '../enums';
import { isManager, normalizeRole } from '../auth/role.utils';

@Injectable()
export class TasksService {
  private tasks: any[] = [];
  private readonly tableName?: string;
  private readonly usersTableName?: string;
  private readonly teamIndexName?: string;
  private readonly useDynamo: boolean;

  constructor(
    private readonly s3: S3Service,
    private readonly dynamo: DynamoDBService,
    private readonly projectService: ProjectService,
    private readonly teamService: TeamService,
  ) {
    this.tableName = this.dynamo.table('tasks');
    this.usersTableName = this.dynamo.table('users');
    this.teamIndexName = process.env.TASKS_TEAM_INDEX;
    this.useDynamo = process.env.USE_DYNAMODB !== 'false' && !!this.tableName;
  }

  async create(createTaskDto: CreateTaskDto, user: any) {
    this.assertManager(user);

    const resolvedTeamId = await this.validateTaskRelationships(createTaskDto);

    const task = this.buildTask(
      {
        ...createTaskDto,
        teamId: resolvedTeamId,
      },
      user,
    );

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: task,
      });
    } else {
      this.tasks.push(task);
    }

    await this.projectService.adjustTaskCount(
      createTaskDto.projectId,
      1,
    );

    return task;
  }

  async findAll(user: any) {
    if (isManager(user)) {
      const items = this.useDynamo
        ? ((await this.dynamo.scan({ TableName: this.tableName })).Items || [])
        : this.tasks;
      return items;
    }

    if (!user?.teamId) {
      throw new ForbiddenException('User does not belong to a team');
    }

    const items = this.useDynamo
      ? await this.findTasksByTeam(user.teamId)
      : this.tasks;

    return items.filter(
      (task) => task.teamId === user.teamId,
    );
  }

  async findOne(id: string, user: any) {
    const task = this.useDynamo
      ? await this.getTaskFromTable(id)
      : this.tasks.find((t) => t.id === id);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (
      !isManager(user) &&
      task.teamId !== user.teamId
    ) {
      throw new ForbiddenException(
        'You cannot access this task',
      );
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: any,
  ) {
    this.assertManager(user);

    const resolvedTask = await this.findOne(id, user);
    const previousProjectId = resolvedTask.projectId;
    const updates = this.definedOnly(updateTaskDto);
    const mergedTask = {
      ...resolvedTask,
      ...updates,
    };

    const resolvedTeamId = await this.validateTaskRelationships(mergedTask);

    Object.assign(resolvedTask, updates);
    resolvedTask.teamId = resolvedTeamId;

    resolvedTask.updatedAt = new Date().toISOString();

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: resolvedTask,
      });
    }

    if (previousProjectId !== resolvedTask.projectId) {
      await this.projectService.adjustTaskCount(previousProjectId, -1);
      await this.projectService.adjustTaskCount(resolvedTask.projectId, 1);
    }

    return resolvedTask;
  }

  async updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
    user: any,
  ) {
    const task = await this.findOne(id, user);

    if (!isManager(user) && task.assigneeId !== this.getUserId(user)) {
      throw new ForbiddenException(
        'Only the task assignee can update task status',
      );
    }

    task.status = dto.status;

    task.updatedAt = new Date().toISOString();

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: task,
      });
    }

    return task;
  }

  async uploadImage(
    id: string,
    file: any,
    user: any,
  ) {
    const task = await this.findOne(id, user);

    if (!file) {
      throw new NotFoundException('No file provided');
    }

    const bucket = process.env.S3_ORIGINALS_BUCKET ?? process.env.S3_BUCKET;
    if (!bucket) {
      throw new Error('S3 bucket not configured (S3_ORIGINALS_BUCKET)');
    }

    const key = `tasks/${task.id}/${randomUUID()}_${file.originalname}`;

    const res: any = await this.s3.uploadObject({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    const image = {
      originalBucket: bucket,
      originalKey: key,
      originalVersionId: res?.VersionId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: user?.sub || user?.userId || user?.id || 'unknown',
      uploadedAt: new Date().toISOString(),
      isActive: true,
    };

    // keep previous active image as history
    if (task.image) {
      task.previousImages = task.previousImages || [];
      task.previousImages.push(task.image);
      task.image.isActive = false;
    }

    task.image = image;
    task.updatedAt = new Date().toISOString();

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: task,
      });
    }

    return image;
  }

  async replaceImage(
    id: string,
    file: any,
    user: any,
  ) {
    return this.uploadImage(id, file, user);
  }

  async deleteImage(id: string, user: any) {
    const task = await this.findOne(id, user);

    if (!task.image) {
      throw new NotFoundException('No image attached to this task');
    }

    // mark current image inactive and keep it in history
    task.previousImages = task.previousImages || [];
    task.previousImages.push(task.image);
    task.image.isActive = false;
    task.image = null;
    task.updatedAt = new Date().toISOString();

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: task,
      });
    }

    return { message: 'Image detached from task' };
  }

  async remove(id: string, user: any) {
    this.assertManager(user);

    const task = await this.findOne(id, user);

    if (this.useDynamo) {
      await this.dynamo.delete({
        TableName: this.tableName,
        Key: { taskId: id },
      });
    } else {
      this.tasks = this.tasks.filter(
        (t) => t.id !== id,
      );
    }

    await this.projectService.adjustTaskCount(
      task.projectId,
      -1,
    );

    return {
      message: 'Task deleted successfully',
      task,
    };
  }

  private buildTask(createTaskDto: CreateTaskDto, user: any) {
    const now = new Date().toISOString();
    const id = randomUUID();

    return {
      id,
      taskId: id,
      projectId: createTaskDto.projectId,
      title: createTaskDto.title,
      description: createTaskDto.description,
      priority: createTaskDto.priority,
      status: createTaskDto.status,
      deadline: createTaskDto.deadline,
      assigneeId: createTaskDto.assigneeId,
      teamId: createTaskDto.teamId,
      imageUrl: createTaskDto.imageUrl,
      createdBy: this.getUserId(user) || 'system',
      createdByName: user?.name,
      createdAt: now,
      updatedAt: now,
    };
  }

  private async getTaskFromTable(id: string) {
    const result = await this.dynamo.get({
      TableName: this.tableName,
      Key: { taskId: id },
    });

    return result.Item ?? null;
  }

  private async findTasksByTeam(teamId: string) {
    if (this.teamIndexName) {
      const result = await this.dynamo.query({
        TableName: this.tableName,
        IndexName: this.teamIndexName,
        KeyConditionExpression: 'teamId = :teamId',
        ExpressionAttributeValues: {
          ':teamId': teamId,
        },
      });

      return result.Items || [];
    }

    const result = await this.dynamo.scan({ TableName: this.tableName });
    return result.Items || [];
  }

  private async validateTaskRelationships(task: {
    projectId: string;
    teamId?: string | null;
    assigneeId: string;
  }) {
    const project = await this.projectService.findOne(task.projectId);
    const projectTeamId = project.teamId ?? null;

    if (projectTeamId && task.teamId && projectTeamId !== task.teamId) {
      throw new BadRequestException(
        'Task team must match the project team',
      );
    }

    const resolvedTeamId = projectTeamId ?? task.teamId;
    if (!resolvedTeamId) {
      throw new BadRequestException('Task team is required');
    }

    await this.teamService.findOne(resolvedTeamId);

    const assignee = await this.findUser(task.assigneeId);

    if (!assignee) {
      throw new BadRequestException('Assignee not found');
    }

    if (assignee.isActive === false) {
      throw new BadRequestException('Assignee is inactive');
    }

    if (normalizeRole(assignee.role) !== UserRole.EMPLOYEE) {
      throw new BadRequestException('Assignee must be an employee');
    }

    if (assignee.teamId !== resolvedTeamId) {
      throw new BadRequestException(
        'Assignee must belong to the selected team',
      );
    }

    return resolvedTeamId;
  }

  private async findUser(userId: string) {
    if (!this.usersTableName) {
      return null;
    }

    const result = await this.dynamo.get({
      TableName: this.usersTableName,
      Key: { userId },
    });

    return result.Item ?? null;
  }

  private assertManager(user: any) {
    if (!isManager(user)) {
      throw new ForbiddenException('Manager access required');
    }
  }

  private getUserId(user: any) {
    return user?.userId || user?.sub || user?.id;
  }

  private definedOnly<T extends Record<string, any>>(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
    ) as Partial<T>;
  }
}
