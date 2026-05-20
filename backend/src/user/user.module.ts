import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { AuthModule } from '../auth/auth.module';
import { TeamModule } from '../team/team.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AwsModule, AuthModule, TeamModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
