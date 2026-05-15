import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { TeamService } from './team.service';

import { CreateTeamDto } from './create-team.dto';
import { UpdateTeamDto } from './update-team.dto';

@Controller('teams')
export class TeamController {
  constructor(
    private readonly teamService: TeamService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateTeamDto,
  ) {
    return this.teamService.create(dto);
  }

  @Get()
  findAll() {
    return this.teamService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamService.update(
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}