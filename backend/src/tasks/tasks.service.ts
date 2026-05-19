import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DynamoDBService } from '../aws/dynamodb.service';
import { S3Service } from '../aws/s3.service';
import { SNSService } from '../aws/sns.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { AuditLog } from '../auditlog/auditlog';
import { TaskImage } from '../taskImage/taskimage';
import { TaskPriority, TaskStatus, UserRole } from '../enums';
import { CreateTaskDto } from './create-task.dto';
import { Task } from './task';
import { UpdateTaskDto } from './update-task.dto';
import { UpdateTaskStatusDto } from './update-task-status.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly dynamoDb: DynamoDBService,
    private readonly s3: S3Service,
    private readonly sns: SNSService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: AuthenticatedUser) {
    this.assertManager(user);

    const now = new Date().toISOString();
    const task: Task = {
      taskId: uuid(),
      projectId: createTaskDto.projectId,
      title: createTaskDto.title,
      description: createTaskDto.description,
      priority: createTaskDto.priority ?? TaskPriority.MEDIUM,
      status: createTaskDto.status ?? TaskStatus.TODO,
      deadline: createTaskDto.deadline,
      assigneeId: createTaskDto.assigneeId,
      teamId: createTaskDto.teamId,
      createdBy: user.userId,
      createdByName: user.name,
      image: null,
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      inReviewAt: null,
      closedAt: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    };

    await this.dynamoDb.put({
      TableName: this.dynamoDb.table('tasks'),
      Item: task,
    });

    await this.publishAssignmentEvent(task, user);

    return task;
  }

  async findAll(user: AuthenticatedUser, teamId?: string) {
    if (this.isManager(user)) {
      if (teamId) {
        return this.queryTasksByTeam(teamId);
      }

      const result = await this.dynamoDb.scan({
        TableName: this.dynamoDb.table('tasks'),
        FilterExpression:
          'attribute_not_exists(isDeleted) OR isDeleted = :isDeleted',
        ExpressionAttributeValues: {
          ':isDeleted': false,
        },
      });

      return (result.Items ?? []) as Task[];
    }

    if (!user.teamId) {
      throw new ForbiddenException('Employee token is missing teamId');
    }

    return this.queryTasksByTeam(user.teamId);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const result = await this.dynamoDb.get({
      TableName: this.dynamoDb.table('tasks'),
      Key: { taskId: id },
    });

    const task = result.Item as Task | undefined;
    if (!task || task.isDeleted) {
      throw new NotFoundException('Task not found');
    }

    this.assertCanAccessTask(task, user);
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: AuthenticatedUser) {
    this.assertManager(user);
    const existing = await this.findOne(id, user);

    const updates = {
      ...updateTaskDto,
      updatedAt: new Date().toISOString(),
      ...this.statusTimestamps(updateTaskDto.status),
    };

    const result = await this.dynamoDb.update({
      TableName: this.dynamoDb.table('tasks'),
      Key: { taskId: id },
      ...this.toUpdateExpression(updates),
      ReturnValues: 'ALL_NEW',
    });

    const updatedTask = result.Attributes as Task;
    if (
      updateTaskDto.assigneeId &&
      updateTaskDto.assigneeId !== existing.assigneeId
    ) {
      await this.publishAssignmentEvent(updatedTask, user);
    }

    if (updateTaskDto.status && updateTaskDto.status !== existing.status) {
      await this.writeAuditLog(existing, updateTaskDto.status, user);
    }

    return updatedTask;
  }

  async updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
    user: AuthenticatedUser,
  ) {
    const existing = await this.findOne(id, user);
    if (!this.isManager(user) && existing.assigneeId !== user.userId) {
      throw new ForbiddenException('Only the assignee can update task status');
    }

    const result = await this.dynamoDb.update({
      TableName: this.dynamoDb.table('tasks'),
      Key: { taskId: id },
      ...this.toUpdateExpression({
        status: dto.status,
        updatedAt: new Date().toISOString(),
        ...this.statusTimestamps(dto.status),
      }),
      ReturnValues: 'ALL_NEW',
    });

    if (dto.status !== existing.status) {
      await this.writeAuditLog(existing, dto.status, user, dto.reason);
    }

    return result.Attributes as Task;
  }

  async remove(id: string, user: AuthenticatedUser) {
    this.assertManager(user);
    const task = await this.findOne(id, user);

    if (task.image?.isActive) {
      await this.deleteImageObjects(task.image);
    }

    const result = await this.dynamoDb.update({
      TableName: this.dynamoDb.table('tasks'),
      Key: { taskId: id },
      ...this.toUpdateExpression({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: user.userId,
        updatedAt: new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    });

    return {
      message: 'Task deleted successfully',
      task: result.Attributes as Task,
    };
  }

  async uploadImage(
    taskId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    const task = await this.findOne(taskId, user);
    if (!this.isManager(user) && task.assigneeId !== user.userId) {
      throw new ForbiddenException('Only the assignee can attach files');
    }

    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const image = await this.putImage(taskId, file, user);
    const result = await this.dynamoDb.update({
      TableName: this.dynamoDb.table('tasks'),
      Key: { taskId },
      ...this.toUpdateExpression({
        image,
        updatedAt: new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    });

    return result.Attributes as Task;
  }

  async replaceImage(
    taskId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    return this.uploadImage(taskId, file, user);
  }

  async deleteImage(taskId: string, user: AuthenticatedUser) {
    const task = await this.findOne(taskId, user);
    if (!this.isManager(user) && task.assigneeId !== user.userId) {
      throw new ForbiddenException('Only the assignee can delete attachments');
    }

    if (!task.image?.isActive) {
      throw new NotFoundException('Task image not found');
    }

    await this.deleteImageObjects(task.image);

    const result = await this.dynamoDb.update({
      TableName: this.dynamoDb.table('tasks'),
      Key: { taskId },
      ...this.toUpdateExpression({
        image: {
          ...task.image,
          isActive: false,
        },
        updatedAt: new Date().toISOString(),
      }),
      ReturnValues: 'ALL_NEW',
    });

    return result.Attributes as Task;
  }

  private async queryTasksByTeam(teamId: string) {
    const result = await this.dynamoDb.query({
      TableName: this.dynamoDb.table('tasks'),
      IndexName: process.env.TASKS_TEAM_INDEX || 'teamId-index',
      KeyConditionExpression: 'teamId = :teamId',
      FilterExpression: 'attribute_not_exists(isDeleted) OR isDeleted = :false',
      ExpressionAttributeValues: {
        ':teamId': teamId,
        ':false': false,
      },
    });

    return (result.Items ?? []) as Task[];
  }

  private async putImage(
    taskId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ): Promise<TaskImage> {
    const bucket = process.env.S3_ORIGINALS_BUCKET;
    if (!bucket) {
      throw new BadRequestException('S3_ORIGINALS_BUCKET is not configured');
    }

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `tasks/${taskId}/images/${uuid()}-${safeName}`;
    const output = await this.s3.uploadObject({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        taskId,
        uploadedBy: user.userId,
      },
    });

    return {
      originalBucket: bucket,
      originalKey: key,
      originalVersionId: output.VersionId,
      resizedBucket: process.env.S3_RESIZED_BUCKET,
      resizedKey: `tasks/${taskId}/images/resized/${safeName}`,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedBy: user.userId,
      uploadedAt: new Date().toISOString(),
      isActive: true,
    };
  }

  private async deleteImageObjects(image: TaskImage) {
    await this.s3.deleteObject({
      Bucket: image.originalBucket,
      Key: image.originalKey,
    });

    if (image.resizedBucket && image.resizedKey) {
      await this.s3.deleteObject({
        Bucket: image.resizedBucket,
        Key: image.resizedKey,
      });
    }
  }

  private async publishAssignmentEvent(task: Task, user: AuthenticatedUser) {
    if (!process.env.SNS_TASK_ASSIGNMENT_TOPIC_ARN) {
      return;
    }

    await this.sns.publish({
      TopicArn: process.env.SNS_TASK_ASSIGNMENT_TOPIC_ARN,
      Message: JSON.stringify({
        type: 'TASK_ASSIGNED',
        taskId: task.taskId,
        title: task.title,
        assigneeId: task.assigneeId,
        assigneeEmail: task.assigneeEmail,
        teamId: task.teamId,
        assignedBy: user.userId,
        assignedAt: new Date().toISOString(),
      }),
      MessageAttributes: {
        assigneeId: {
          DataType: 'String',
          StringValue: task.assigneeId,
        },
        teamId: {
          DataType: 'String',
          StringValue: task.teamId,
        },
      },
    });
  }

  private async writeAuditLog(
    task: Task,
    newStatus: TaskStatus,
    user: AuthenticatedUser,
    reason?: string,
  ) {
    const changedAt = new Date().toISOString();
    const log: AuditLog = {
      taskId: task.taskId,
      changedAt,
      auditId: uuid(),
      changedBy: user.userId,
      changedByName: user.name,
      oldStatus: task.status,
      newStatus,
      reason,
      teamId: task.teamId,
    };

    await this.dynamoDb.put({
      TableName: this.dynamoDb.table('auditLog'),
      Item: log,
    });
  }

  private statusTimestamps(status?: TaskStatus) {
    const now = new Date().toISOString();
    if (status === TaskStatus.IN_PROGRESS) {
      return { startedAt: now };
    }
    if (status === TaskStatus.IN_REVIEW) {
      return { inReviewAt: now };
    }
    if (status === TaskStatus.DONE) {
      return { closedAt: now };
    }
    return {};
  }

  private assertCanAccessTask(task: Task, user: AuthenticatedUser) {
    if (this.isManager(user)) {
      return;
    }

    if (task.teamId !== user.teamId) {
      throw new ForbiddenException('You cannot access this task');
    }
  }

  private assertManager(user: AuthenticatedUser) {
    if (!this.isManager(user)) {
      throw new ForbiddenException('Only managers can manage tasks');
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
