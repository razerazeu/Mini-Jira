import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';

import { ProjectService } from './project.service';

import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateProjectDto,
    @Req() req: any,
  ) {
    return this.projectService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.projectService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectService.findOne(id, req.user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: any,
  ) {
    return this.projectService.update(
      id,
      dto,
      req.user,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.projectService.remove(id, req.user);
  }
}
