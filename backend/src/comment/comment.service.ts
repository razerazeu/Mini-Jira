import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateCommentDto } from './create-comment.dto';
import { DynamoDBService } from '../aws/dynamodb.service';

@Injectable()
export class CommentService {
  // store comments in memory as { taskId -> comments[] }
  private commentsMap: Record<string, any[]> = {};
  private readonly tableName?: string;
  private readonly useDynamo: boolean;

  constructor(private readonly dynamo: DynamoDBService) {
    this.tableName = this.dynamo.table('comments');
    this.useDynamo = process.env.USE_DYNAMODB === 'true' && !!this.tableName;
  }

  async create(taskId: string, dto: CreateCommentDto, user: any) {
    const comment = {
      taskId,
      commentId: uuid(),
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
        KeyConditionExpression: 'taskId = :taskId',
        ExpressionAttributeValues: {
          ':taskId': taskId,
        },
      });

      return result.Items || [];
    }

    return this.commentsMap[taskId] || [];
  }

  async findOne(taskId: string, commentId: string) {
    const list = await this.findByTask(taskId);
    const c = list.find((x) => x.commentId === commentId);
    if (!c) throw new NotFoundException('Comment not found');
    return c;
  }
}
