import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from './aws/aws.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectModule } from './project/project.module';
import { CommentModule } from './comment/comment.module';
import { TeamModule } from './team/team.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        './.env',
        './src/.env',
      ],
    }),
    AwsModule,
    AuthModule,
    TeamModule,
    UserModule,
    TasksModule,
    ProjectModule,
    CommentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
