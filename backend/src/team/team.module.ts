import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';

import { TeamController } from './team.controller';
import { TeamService } from './team.service';

@Module({
  imports: [AwsModule],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
