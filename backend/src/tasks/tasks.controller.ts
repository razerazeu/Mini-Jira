import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { TasksService } from './tasks.service';

import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';
import { UpdateTaskStatusDto } from './update-task-status.dto';
import { RoleGuard } from '../auth/role.guard';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  @UseGuards(RoleGuard)
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() dto: CreateTaskDto,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    return this.tasksService.create(dto, req.user, file);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.tasksService.findAll(req.user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.tasksService.findOne(
      id,
      req.user,
    );
  }

  @Put(':id')
  @UseGuards(RoleGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.update(
      id,
      dto,
      req.user,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: any,
  ) {
    return this.tasksService.updateStatus(
      id,
      dto,
      req.user,
    );
  }

  @Post(':id/image')
  @UseGuards(RoleGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    return this.tasksService.uploadImage(id, file, req.user);
  }

  @Put(':id/image')
  @UseGuards(RoleGuard)
  @UseInterceptors(FileInterceptor('file'))
  replaceImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    return this.tasksService.replaceImage(id, file, req.user);
  }

  @Delete(':id/image')
  @UseGuards(RoleGuard)
  removeImage(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.tasksService.deleteImage(id, req.user);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.tasksService.remove(
      id,
      req.user,
    );
  }
}
