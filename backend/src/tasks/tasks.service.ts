import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { v4 as uuid } from 'uuid';

import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';
import { UpdateTaskStatusDto } from './update-task-status.dto';

import { Task } from './task';
import { S3Service } from '../aws/s3.service';
import { DynamoDBService } from '../aws/dynamodb.service';

@Injectable()
export class TasksService {
  private tasks: any[] = [];
  private readonly tableName?: string;
  private readonly useDynamo: boolean;

  constructor(
    private readonly s3: S3Service,
    private readonly dynamo: DynamoDBService,
  ) {
    this.tableName = this.dynamo.table('tasks');
    this.useDynamo = process.env.USE_DYNAMODB === 'true' && !!this.tableName;
  }

  async create(createTaskDto: CreateTaskDto) {
    const task = this.buildTask(createTaskDto);

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: task,
      });
    } else {
      this.tasks.push(task);
    }

    return task;
  }

  async findAll(user: any) {
    const items = this.useDynamo
      ? ((await this.dynamo.scan({ TableName: this.tableName })).Items || [])
      : this.tasks;

    if (user.role === 'manager') {
      return items;
    }

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
      user.role !== 'manager' &&
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
    const task = this.findOne(id, user);

    const resolvedTask = await task;

    Object.assign(resolvedTask, updateTaskDto);

    resolvedTask.updatedAt = new Date().toISOString();

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: resolvedTask,
      });
    }

    return resolvedTask;
  }

  async updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
    user: any,
  ) {
    const task = await this.findOne(id, user);

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

    const key = `tasks/${task.id}/${uuid()}_${file.originalname}`;

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

    return {
      message: 'Task deleted successfully',
      task,
    };
  }

  private buildTask(createTaskDto: CreateTaskDto) {
    const now = new Date().toISOString();
    const id = uuid();

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
}