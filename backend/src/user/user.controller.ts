import {
  Body,
  Controller,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { RoleGuard } from '../auth/role.guard';
import { AssignUserTeamDto } from './assign-user-team.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch(':userId/team')
  @UseGuards(RoleGuard)
  assignTeam(
    @Param('userId') userId: string,
    @Body() dto: AssignUserTeamDto,
  ) {
    return this.userService.assignTeam(userId, dto.teamId);
  }
}
