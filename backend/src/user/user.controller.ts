import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleGuard } from '../auth/role.guard';
import { AssignUserTeamDto } from './assign-user-team.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(RoleGuard)
  async findAll(@Query('teamId') teamId?: string) {
    if (teamId) {
      return this.userService.findByTeam(teamId);
    }
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':userId/team')
  @UseGuards(RoleGuard)
  assignTeam(
    @Param('userId') userId: string,
    @Body() dto: AssignUserTeamDto,
  ) {
    return this.userService.assignTeam(userId, dto.teamId);
  }
}