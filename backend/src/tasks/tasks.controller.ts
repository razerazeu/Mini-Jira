import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { TasksService } from './tasks.service';

import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';
import { UpdateTaskStatusDto } from './update-task-status.dto';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.create(dto, req.user);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('teamId') teamId?: string,
  ) {
    return this.tasksService.findAll(req.user, teamId);
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

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.tasksService.remove(
      id,
      req.user,
    );
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.tasksService.uploadImage(id, file, req.user);
  }

  @Put(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  replaceImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.tasksService.replaceImage(id, file, req.user);
  }

  @Delete(':id/image')
  deleteImage(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.tasksService.deleteImage(id, req.user);
  }
}
