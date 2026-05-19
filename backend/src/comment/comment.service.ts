import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DynamoDBService } from '../aws/dynamodb.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from '../enums';
import { TasksService } from '../tasks/tasks.service';
import { Comment } from './comment';
import { CreateCommentDto } from './create-comment.dto';
import { UpdateCommentDto } from './update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly dynamoDb: DynamoDBService,
    private readonly tasksService: TasksService,
  ) {}

  async create(
    taskId: string,
    dto: CreateCommentDto,
    user: AuthenticatedUser,
  ) {
    await this.tasksService.findOne(taskId, user);

    const now = new Date().toISOString();
    const comment: Comment = {
      taskId,
      commentId: uuid(),
      userId: user.userId,
      userName: user.name ?? user.email ?? user.userId,
      userRole: user.role ?? UserRole.EMPLOYEE,
      text: dto.text,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    await this.dynamoDb.put({
      TableName: this.dynamoDb.table('comments'),
      Item: comment,
    });

    return comment;
  }

  async findAll(taskId: string, user: AuthenticatedUser) {
    await this.tasksService.findOne(taskId, user);

    const result = await this.dynamoDb.query({
      TableName: this.dynamoDb.table('comments'),
      KeyConditionExpression: 'taskId = :taskId',
      FilterExpression: 'attribute_not_exists(isDeleted) OR isDeleted = :false',
      ExpressionAttributeValues: {
        ':taskId': taskId,
        ':false': false,
      },
    });

    return (result.Items ?? []) as Comment[];
  }

  async findOne(taskId: string, commentId: string, user: AuthenticatedUser) {
    await this.tasksService.findOne(taskId, user);

    const result = await this.dynamoDb.get({
      TableName: this.dynamoDb.table('comments'),
      Key: { taskId, commentId },
    });

    const comment = result.Item as Comment | undefined;
    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(
    taskId: string,
    commentId: string,
    dto: UpdateCommentDto,
    user: AuthenticatedUser,
  ) {
    const comment = await this.findOne(taskId, commentId, user);
    this.assertCanModifyComment(comment, user);

    const result = await this.dynamoDb.update({
      TableName: this.dynamoDb.table('comments'),
      Key: { taskId, commentId },
      UpdateExpression: 'SET #text = :text, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#text': 'text',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':text': dto.text,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    return result.Attributes as Comment;
  }

  async remove(taskId: string, commentId: string, user: AuthenticatedUser) {
    const comment = await this.findOne(taskId, commentId, user);
    this.assertCanModifyComment(comment, user);

    const result = await this.dynamoDb.update({
      TableName: this.dynamoDb.table('comments'),
      Key: { taskId, commentId },
      UpdateExpression: 'SET #isDeleted = :true, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#isDeleted': 'isDeleted',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':true': true,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    return {
      message: 'Comment deleted successfully',
      comment: result.Attributes as Comment,
    };
  }

  private assertCanModifyComment(comment: Comment, user: AuthenticatedUser) {
    if (
      comment.userId === user.userId ||
      String(user.role).toUpperCase() === UserRole.MANAGER
    ) {
      return;
    }

    throw new ForbiddenException('You cannot modify this comment');
  }
}
