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

@Injectable()
export class TasksService {
  private tasks: any[] = [];

  constructor(private readonly s3: S3Service) {}

  create(createTaskDto: CreateTaskDto) {
    const task: any = {
      id: uuid(),

      title: createTaskDto.title,
      description: createTaskDto.description,

      priority: createTaskDto.priority,
      status: createTaskDto.status,

      // deadline is provided as an ISO date string by the DTO
      deadline: createTaskDto.deadline,

      assigneeId: createTaskDto.assigneeId,
      teamId: createTaskDto.teamId,

      imageUrl: createTaskDto.imageUrl,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.push(task);

    return task;
  }

  findAll(user: any) {
    if (user.role === 'manager') {
      return this.tasks;
    }

    return this.tasks.filter(
      (task) => task.teamId === user.teamId,
    );
  }

  findOne(id: string, user: any) {
    const task = this.tasks.find((t) => t.id === id);

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

  update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: any,
  ) {
    const task = this.findOne(id, user);

    Object.assign(task, updateTaskDto);

    task.updatedAt = new Date().toISOString();

    return task;
  }

  updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
    user: any,
  ) {
    const task = this.findOne(id, user);

    task.status = dto.status;

    task.updatedAt = new Date().toISOString();

    return task;
  }

  async uploadImage(
    id: string,
    file: any,
    user: any,
  ) {
    const task = this.findOne(id, user);

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

    return image;
  }

  async replaceImage(
    id: string,
    file: any,
    user: any,
  ) {
    return this.uploadImage(id, file, user);
  }

  deleteImage(id: string, user: any) {
    const task = this.findOne(id, user);

    if (!task.image) {
      throw new NotFoundException('No image attached to this task');
    }

    // mark current image inactive and keep it in history
    task.previousImages = task.previousImages || [];
    task.previousImages.push(task.image);
    task.image.isActive = false;
    task.image = null;
    task.updatedAt = new Date().toISOString();

    return { message: 'Image detached from task' };
  }

  remove(id: string, user: any) {
    const task = this.findOne(id, user);

    this.tasks = this.tasks.filter(
      (t) => t.id !== id,
    );

    return {
      message: 'Task deleted successfully',
      task,
    };
  }
}