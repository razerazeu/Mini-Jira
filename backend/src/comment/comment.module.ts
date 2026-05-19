import { Module } from '@nestjs/common';
import { AwsModule } from '../aws/aws.module';
import { TasksModule } from '../tasks/tasks.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [AwsModule, TasksModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
