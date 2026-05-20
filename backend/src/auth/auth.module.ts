import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AwsModule } from '../aws/aws.module';
import { AuthController } from './auth.controller';
import { CognitoAuthGuard } from './cognito-auth.guard';
import { CognitoService } from './cognito.service';
import { RoleGuard } from './role.guard';

const providers: any[] = [
  CognitoService,
  RoleGuard,
  {
    provide: APP_GUARD,
    useClass: CognitoAuthGuard,
  },
];

@Module({
  imports: [AwsModule],
  controllers: [AuthController],
  providers,
  exports: [CognitoService, RoleGuard],
})
export class AuthModule {}
