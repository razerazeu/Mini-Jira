import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ProjectService } from './project.service';

import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';
import { RoleGuard } from '../auth/role.guard';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
  ) {}

  @Post()
  @UseGuards(RoleGuard)
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
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.projectService.findOne(id, req.user);
  }

  @Put(':id')
  @UseGuards(RoleGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(
      id,
      dto,
    );
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }
}
