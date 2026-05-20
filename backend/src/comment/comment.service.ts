import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateCommentDto } from './create-comment.dto';
import { DynamoDBService } from '../aws/dynamodb.service';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class CommentService {
  // store comments in memory as { taskId -> comments[] }
  private commentsMap: Record<string, any[]> = {};
  private readonly tableName?: string;
  private readonly taskIdIndexName?: string;
  private readonly useDynamo: boolean;

  constructor(
    private readonly dynamo: DynamoDBService,
    private readonly tasksService: TasksService,
  ) {
    this.tableName = this.dynamo.table('comments');
    this.taskIdIndexName = process.env.COMMENTS_TASK_INDEX;
    this.useDynamo = process.env.USE_DYNAMODB !== 'false' && !!this.tableName;
  }

  async create(taskId: string, dto: CreateCommentDto, user: any) {
    await this.tasksService.findOne(taskId, user);

    const comment = {
      taskId,
      commentId: randomUUID(),
      userId: user?.sub || user?.userId || user?.id || 'unknown',
      userName: user?.name || user?.username || 'anonymous',
      userRole: user?.role || 'user',
      text: dto.text,
      createdAt: new Date().toISOString(),
    };

    if (this.useDynamo) {
      await this.dynamo.put({
        TableName: this.tableName,
        Item: comment,
      });
    } else {
      this.commentsMap[taskId] = this.commentsMap[taskId] || [];
      this.commentsMap[taskId].push(comment);
    }

    return comment;
  }

  async findByTask(taskId: string) {
    if (this.useDynamo) {
      const result = await this.dynamo.query({
        TableName: this.tableName,
        ...(this.taskIdIndexName
          ? { IndexName: this.taskIdIndexName }
          : {}),
        KeyConditionExpression: 'taskId = :taskId',
        ExpressionAttributeValues: {
          ':taskId': taskId,
        },
      });

      return result.Items || [];
    }

    return this.commentsMap[taskId] || [];
  }

  async findByTaskForUser(taskId: string, user: any) {
    await this.tasksService.findOne(taskId, user);
    return this.findByTask(taskId);
  }

  async findOne(taskId: string, commentId: string) {
    const list = await this.findByTask(taskId);
    const c = list.find((x) => x.commentId === commentId);
    if (!c) throw new NotFoundException('Comment not found');
    return c;
  }
}
