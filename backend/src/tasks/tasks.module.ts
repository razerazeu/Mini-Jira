import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { ProjectModule } from '../project/project.module';
import { TeamModule } from '../team/team.module';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [AwsModule, ProjectModule, TeamModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
