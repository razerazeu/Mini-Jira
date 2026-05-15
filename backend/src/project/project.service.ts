import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { v4 as uuid } from 'uuid';

import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';

@Injectable()
export class ProjectService {
  private projects: any[] = [];

  create(createProjectDto: CreateProjectDto) {
    const project = {
      id: uuid(),
      ...createProjectDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.push(project);

    return project;
  }

  findAll() {
    return this.projects;
  }

  findOne(id: string) {
    const project = this.projects.find(
      (p) => p.id === id,
    );

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    return project;
  }

  update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const project = this.findOne(id);

    Object.assign(project, updateProjectDto);

    project.updatedAt = new Date();

    return project;
  }

  remove(id: string) {
    const project = this.findOne(id);

    this.projects = this.projects.filter(
      (p) => p.id !== id,
    );

    return {
      message: 'Project deleted successfully',
      project,
    };
  }
}