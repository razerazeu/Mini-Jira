import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { TeamModule } from '../team/team.module';

import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [AwsModule, TeamModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
