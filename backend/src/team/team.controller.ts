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

import { TeamService } from './team.service';

import { CreateTeamDto } from './create-team.dto';
import { UpdateTeamDto } from './update-team.dto';
import { RoleGuard } from '../auth/role.guard';

@Controller('teams')
export class TeamController {
  constructor(
    private readonly teamService: TeamService,
  ) {}

  @Post()
  @UseGuards(RoleGuard)
  create(
    @Body() dto: CreateTeamDto,
    @Req() req: any,
  ) {
    return this.teamService.create(dto, req.user);
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
  @UseGuards(RoleGuard)
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
  @UseGuards(RoleGuard)
  remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}
