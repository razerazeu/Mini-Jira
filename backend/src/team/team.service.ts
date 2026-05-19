import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { v4 as uuid } from 'uuid';

import { CreateTeamDto } from './create-team.dto';
import { UpdateTeamDto } from './update-team.dto';

@Injectable()
export class TeamService {
  private teams: any[] = [];

  create(createTeamDto: CreateTeamDto) {
    const team = {
      id: uuid(),
      ...createTeamDto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.teams.push(team);

    return team;
  }

  findAll() {
    return this.teams;
  }

  findOne(id: string) {
    const team = this.teams.find(
      (t) => t.id === id,
    );

    if (!team) {
      throw new NotFoundException(
        'Team not found',
      );
    }

    return team;
  }

  update(
    id: string,
    updateTeamDto: UpdateTeamDto,
  ) {
    const team = this.findOne(id);

    Object.assign(team, updateTeamDto);

    return team;
  }

  remove(id: string) {
    const team = this.findOne(id);

    this.teams = this.teams.filter(
      (t) => t.id !== id,
    );

    return {
      message: 'Team deleted successfully',
      team,
    };
  }
}