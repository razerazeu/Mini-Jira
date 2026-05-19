import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';

import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [AwsModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}