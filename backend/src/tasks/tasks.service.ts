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
@Injectable()
export class TasksService {
  private tasks: any[] = [];

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