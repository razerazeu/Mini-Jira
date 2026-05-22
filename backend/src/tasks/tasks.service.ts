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
import { SNSService } from '../aws/sns.service';
import { CloudWatchService } from '../aws/cloudwatch.service';
import { ActivityLogService } from '../activitylog/activitylog.service';
import { ProjectService } from '../project/project.service';
import { TeamService } from '../team/team.service';
import { ActivityType, TaskStatus, UserRole } from '../enums';
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
    private readonly sns: SNSService,
    private readonly cloudWatch: CloudWatchService,
    private readonly activityLog: ActivityLogService,
    private readonly projectService: ProjectService,
    private readonly teamService: TeamService,
  ) {
    this.tableName = this.dynamo.table('tasks');
    this.usersTableName = this.dynamo.table('users');
    this.teamIndexName = process.env.TASKS_TEAM_INDEX;
    this.useDynamo = process.env.USE_DYNAMODB !== 'false' && !!this.tableName;
  }

  async create(createTaskDto: CreateTaskDto, user: any, file?: any) {
    this.assertManager(user);

    const { resolvedTeamId, assignee } =
      await this.validateTaskRelationships(createTaskDto);

    const task = this.buildTask(
      {
        ...createTaskDto,
        teamId: resolvedTeamId,
      },
      user,
      assignee,
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

    await this.activityLog.write({
      type: 'TASK_CREATED',
      taskId: task.taskId,
      projectId: task.projectId,
      teamId: task.teamId,
      assigneeId: task.assigneeId,
      assigneeEmail: task.assigneeEmail,
      actorId: this.getUserId(user),
      actorName: this.getActorLabel(user),
      message: `${this.getActorLabel(user)} created task ${this.getTaskLabel(task)}`,
    });

    await this.recordMetric('recordTaskCreated', () =>
      this.cloudWatch.recordTaskCreated(String(task.teamId)),
    );

    await this.publishTaskAssignedEvent(task, user);

    if (file) {
      await this.handleImageUpload(
        task.taskId,
        file,
        user,
        'IMAGE_UPLOADED',
      );
      return this.withImageUrls(task);
    }

    return this.withImageUrls(task);
  }

  async findAll(user: any, teamId?: string) {
    if (isManager(user)) {
      if (teamId && teamId !== 'all') {
        const items = this.useDynamo
          ? await this.findTasksByTeam(teamId)
          : this.tasks.filter((task) => task.teamId === teamId);

        return Promise.all(items.map((task) => this.withImageUrls(task)));
      }

      const items = this.useDynamo
        ? ((await this.dynamo.scan({ TableName: this.tableName })).Items || [])
        : this.tasks;
      return Promise.all(items.map((task) => this.withImageUrls(task)));
    }

    if (!user?.teamId) {
      throw new ForbiddenException('User does not belong to a team');
    }

    const items = this.useDynamo
      ? await this.findTasksByTeam(user.teamId)
      : this.tasks;

    return Promise.all(
      items
        .filter((task) => task.teamId === user.teamId)
        .map((task) => this.withImageUrls(task)),
    );
  }

  async findOne(id: string, user: any) {
    const task = await this.findOneRaw(id, user);
    return this.withImageUrls(task);
  }

  async findActivityByTask(id: string, user: any) {
    await this.findOneRaw(id, user);
    return this.activityLog.findByTask(id);
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: any,
  ) {
    this.assertManager(user);

    const resolvedTask = await this.findOneRaw(id, user);
    const previousProjectId = resolvedTask.projectId;
    const previousAssigneeId = resolvedTask.assigneeId;
    const updates = this.definedOnly(updateTaskDto);
    const mergedTask = {
      ...resolvedTask,
      ...updates,
    };

    const { resolvedTeamId, assignee } =
      await this.validateTaskRelationships(mergedTask);

    Object.assign(resolvedTask, updates);
    resolvedTask.teamId = resolvedTeamId;
    resolvedTask.assigneeName = assignee.name ?? null;
    resolvedTask.assigneeEmail = assignee.email ?? null;

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

    if (previousAssigneeId !== resolvedTask.assigneeId) {
      await this.publishTaskAssignedEvent(resolvedTask, user);
    }

    await this.activityLog.write({
      type: 'TASK_UPDATED',
      taskId: resolvedTask.taskId,
      projectId: resolvedTask.projectId,
      teamId: resolvedTask.teamId,
      assigneeId: resolvedTask.assigneeId,
      assigneeEmail: resolvedTask.assigneeEmail,
      actorId: this.getUserId(user),
      actorName: this.getActorLabel(user),
      message: `${this.getActorLabel(user)} updated task ${this.getTaskLabel(resolvedTask)}`,
      metadata: {
        updatedFields: Object.keys(updates),
      },
    });

    return this.withImageUrls(resolvedTask);
  }

  async updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
    user: any,
  ) {
    const task = await this.findOneRaw(id, user);
    const previousStatus = task.status;

    if (!isManager(user) && dto.status === TaskStatus.DONE) {
      throw new ForbiddenException(
        'Only a manager can mark a task as done',
      );
    }

    const now = new Date().toISOString();
    task.status = dto.status;

    if (previousStatus !== TaskStatus.DONE && dto.status === TaskStatus.DONE) {
      task.closedAt = now;
    }

    task.updatedAt = now;

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: task,
      });
    }

    await this.activityLog.write({
      type: 'TASK_STATUS_CHANGED',
      taskId: task.taskId,
      projectId: task.projectId,
      teamId: task.teamId,
      assigneeId: task.assigneeId,
      assigneeEmail: task.assigneeEmail,
      actorId: this.getUserId(user),
      actorName: this.getActorLabel(user),
      oldStatus: previousStatus,
      newStatus: dto.status,
      reason: dto.reason,
      message: `${this.getActorLabel(user)} moved task ${this.getTaskLabel(task)} from ${previousStatus} to ${dto.status}`,
    });

    if (previousStatus !== TaskStatus.DONE && dto.status === TaskStatus.DONE) {
      await this.recordMetric('recordTaskClosed', () =>
        this.cloudWatch.recordTaskClosed(String(task.teamId)),
      );

      const timeToCloseSeconds = this.getTimeToCloseSeconds(task);
      if (timeToCloseSeconds !== null) {
        await this.recordMetric('recordTaskTimeToClose', () =>
          this.cloudWatch.recordTaskTimeToClose(
            String(task.teamId),
            timeToCloseSeconds,
          ),
        );
      }
    }

    return this.withImageUrls(task);
  }

  async uploadImage(
    id: string,
    file: any,
    user: any,
  ) {
    return this.handleImageUpload(id, file, user, 'IMAGE_UPLOADED');
  }

  async replaceImage(
    id: string,
    file: any,
    user: any,
  ) {
    return this.handleImageUpload(id, file, user, 'IMAGE_REPLACED');
  }

  async deleteImage(id: string, user: any) {
    const task = await this.findOneRaw(id, user);

    if (!task.image) {
      throw new NotFoundException('No image attached to this task');
    }

    // Mark the current image inactive and keep its version metadata in history.
    task.previousImages = task.previousImages || [];
    task.previousImages.push(this.toPreviousImage(task.image, 'deletedAt'));
    task.image.isActive = false;
    task.image = null;
    task.imageOriginalKey = null;
    task.imageOriginalVersionId = null;
    task.imageResizedKey = null;
    task.updatedAt = new Date().toISOString();

    await this.deleteCurrentS3Image(task.previousImages.at(-1));

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: task,
      });
    }

    await this.activityLog.write({
      type: 'IMAGE_DELETED',
      taskId: task.taskId,
      projectId: task.projectId,
      teamId: task.teamId,
      assigneeId: task.assigneeId,
      assigneeEmail: task.assigneeEmail,
      actorId: this.getUserId(user),
      actorName: this.getActorLabel(user),
      message: `${this.getActorLabel(user)} removed an image from task ${this.getTaskLabel(task)}`,
    });

    return { message: 'Image detached from task' };
  }

  async remove(id: string, user: any) {
    this.assertManager(user);

    const task = await this.findOneRaw(id, user);

    await this.deleteTaskImagesFromS3(task);

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

    await this.activityLog.write({
      type: 'TASK_DELETED',
      taskId: task.taskId,
      projectId: task.projectId,
      teamId: task.teamId,
      assigneeId: task.assigneeId,
      assigneeEmail: task.assigneeEmail,
      actorId: this.getUserId(user),
      actorName: this.getActorLabel(user),
      message: `${this.getActorLabel(user)} deleted task ${this.getTaskLabel(task)}`,
    });

    return {
      message: 'Task deleted successfully',
      task,
    };
  }

  private async handleImageUpload(
    id: string,
    file: any,
    user: any,
    logType: ActivityType,
  ) {
    const task = await this.findOneRaw(id, user);

    if (!file) {
      throw new NotFoundException('No file provided');
    }

    const bucket = process.env.S3_ORIGINALS_BUCKET ?? process.env.S3_BUCKET;
    if (!bucket) {
      throw new Error('S3 bucket not configured (S3_ORIGINALS_BUCKET)');
    }

    const key = task.image?.originalKey ?? `tasks/${task.taskId || task.id}/image/original`;

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
      versionLabel: 'CURRENT',
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
      task.previousImages.push(this.toPreviousImage(task.image, 'replacedAt'));
    }

    task.image = image;
    task.imageOriginalKey = key;
    task.imageOriginalVersionId = res?.VersionId ?? null;
    task.imageResizedKey = null;
    task.updatedAt = new Date().toISOString();

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: task,
      });
    }

    const verb = logType === 'IMAGE_REPLACED' ? 'replaced' : 'uploaded';
    await this.activityLog.write({
      type: logType,
      taskId: task.taskId,
      projectId: task.projectId,
      teamId: task.teamId,
      assigneeId: task.assigneeId,
      assigneeEmail: task.assigneeEmail,
      actorId: this.getUserId(user),
      actorName: this.getActorLabel(user),
      message: `${this.getActorLabel(user)} ${verb} an image for task ${this.getTaskLabel(task)}`,
    });

    return this.withImageUrl(image);
  }

  private async findOneRaw(id: string, user: any) {
    const task = this.useDynamo
      ? await this.getTaskFromTable(id)
      : this.tasks.find((t) => t.id === id);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!this.canAccessTask(task, user)) {
      throw new ForbiddenException(
        'You cannot access this task',
      );
    }

    return task;
  }

  private buildTask(createTaskDto: CreateTaskDto, user: any, assignee: any) {
    const now = new Date().toISOString();
    const id = randomUUID();

    return {
      id,
      taskId: id,
      projectId: createTaskDto.projectId,
      title: createTaskDto.title,
      description: createTaskDto.description,
      priority: createTaskDto.priority,
      status: createTaskDto.status ?? TaskStatus.TODO,
      deadline: createTaskDto.deadline,
      assigneeId: createTaskDto.assigneeId,
      assigneeName: assignee.name ?? null,
      assigneeEmail: assignee.email ?? null,
      teamId: createTaskDto.teamId,
      imageUrl: createTaskDto.imageUrl,
      image: null,
      previousImages: [],
      imageOriginalKey: null,
      imageOriginalVersionId: null,
      imageResizedKey: null,
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

    return { resolvedTeamId, assignee };
  }

  private async publishTaskAssignedEvent(task: any, user: any) {
    const topicArn = process.env.SNS_TASK_ASSIGNMENT_TOPIC_ARN;

    if (!topicArn) {
      return;
    }

    const occurredAt = new Date().toISOString();
    const event = {
      eventId: randomUUID(),
      eventType: 'TASK_ASSIGNED',
      occurredAt,
      task: {
        id: task.id,
        taskId: task.taskId,
        title: task.title,
        projectId: task.projectId,
        teamId: task.teamId,
        priority: task.priority,
        deadline: task.deadline,
      },
      assignee: {
        userId: task.assigneeId,
        name: task.assigneeName,
        email: task.assigneeEmail,
      },
      actor: {
        userId: this.getUserId(user) || 'system',
        name: user?.name,
        email: user?.email,
      },
    };

    const messageAttributes: Record<string, any> = {
      eventType: {
        DataType: 'String',
        StringValue: 'TASK_ASSIGNED',
      },
      assigneeId: {
        DataType: 'String',
        StringValue: task.assigneeId,
      },
    };

    if (task.assigneeEmail) {
      messageAttributes.assigneeEmail = {
        DataType: 'String',
        StringValue: task.assigneeEmail,
      };
    }

    try {
      await this.sns.publish({
        TopicArn: topicArn,
        Subject: `Task assigned: ${task.title}`.slice(0, 100),
        MessageStructure: 'json',
        Message: JSON.stringify({
          default: JSON.stringify(event),
          email: this.buildTaskAssignmentEmail(task, user),
        }),
        MessageAttributes: messageAttributes,
      });
    } catch (error) {
      console.error('Failed to publish TASK_ASSIGNED event', {
        taskId: task.taskId,
        topicArn,
        region: process.env.AWS_REGION,
        error,
      });
    }
  }

  private buildTaskAssignmentEmail(task: any, user: any) {
    const assigneeName = task.assigneeName || 'there';
    const actorName = user?.name || user?.email || 'A manager';

    return [
      `Hi ${assigneeName},`,
      '',
      `${actorName} assigned you a task in Mini Jira.`,
      '',
      `Task: ${task.title}`,
      `Priority: ${task.priority}`,
      `Status: ${task.status || 'TODO'}`,
      `Deadline: ${task.deadline}`,
      '',
      task.description ? `Description: ${task.description}` : null,
      '',
      'Please sign in to Mini Jira to view the task.',
    ]
      .filter((line) => line !== null)
      .join('\n');
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

  private canAccessTask(task: any, user: any) {
    if (isManager(user)) {
      return true;
    }

    const userId = this.getUserId(user);

    return (
      Boolean(userId && task.assigneeId === userId) ||
      Boolean(user?.teamId && task.teamId === user.teamId)
    );
  }

  private getUserId(user: any) {
    return user?.userId || user?.sub || user?.id;
  }

  private getActorLabel(user: any) {
    return user?.name || user?.email || this.getUserId(user) || 'system';
  }

  private getTaskLabel(task: any) {
    return task?.title || task?.taskId || task?.id || 'task';
  }

  private getTimeToCloseSeconds(task: any) {
    const createdAtMs = Date.parse(task.createdAt);
    const closedAtMs = Date.parse(task.closedAt);

    if (Number.isNaN(createdAtMs) || Number.isNaN(closedAtMs)) {
      return null;
    }

    return Math.max(0, Math.round((closedAtMs - createdAtMs) / 1000));
  }

  private async recordMetric(
    metricName: string,
    record: () => Promise<unknown>,
  ) {
    try {
      await record();
    } catch (error) {
      console.error('Failed to publish CloudWatch metric', {
        metricName,
        error,
      });
    }
  }

  private async withImageUrls(task: any) {
    const previous = await Promise.all(
      (task.previousImages || []).map((image) => this.withImageUrl(image)),
    );
    const current = task.image ? await this.withImageUrl(task.image) : null;

    return {
      ...task,
      image: current,
      previousImages: previous,
      imageVersions: {
        current,
        previous,
      },
    };
  }

  private async withImageUrl(image: any) {
    if (!image?.originalBucket || !image?.originalKey) {
      return image;
    }

    const displayUrl = await this.s3.getPresignedGetUrl(
      image.originalBucket,
      image.originalKey,
      3600,
      image.originalVersionId,
    );

    const thumbnailUrl = image.resizedBucket && image.resizedKey
      ? await this.s3.getPresignedGetUrl(
          image.resizedBucket,
          image.resizedKey,
          3600,
        )
      : null;

    return {
      ...image,
      displayUrl,
      thumbnailUrl: thumbnailUrl || undefined,
    };
  }

  private toPreviousImage(image: any, timestampField: 'replacedAt' | 'deletedAt') {
    return {
      ...image,
      isActive: false,
      versionLabel: 'PREVIOUS',
      [timestampField]: new Date().toISOString(),
    };
  }

  private async deleteCurrentS3Image(image: any) {
    if (!image?.originalBucket || !image?.originalKey) {
      return;
    }

    try {
      await this.s3.deleteObject({
        Bucket: image.originalBucket,
        Key: image.originalKey,
      });
    } catch (error) {
      console.error('Failed to delete current task image from S3', {
        bucket: image.originalBucket,
        key: image.originalKey,
        error,
      });
    }
  }

  private async deleteTaskImagesFromS3(task: any) {
    const images = [
      task.image,
      ...(task.previousImages || []),
    ].filter(Boolean);
    const uniqueKeys = new Set<string>();

    for (const image of images) {
      const bucket = image.originalBucket;
      const key = image.originalKey;

      if (!bucket || !key) {
        continue;
      }

      const uniqueKey = `${bucket}/${key}`;
      if (uniqueKeys.has(uniqueKey)) {
        continue;
      }

      uniqueKeys.add(uniqueKey);
      await this.deleteCurrentS3Image(image);
    }
  }

  private definedOnly<T extends Record<string, any>>(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
    ) as Partial<T>;
  }
}
