import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateCommentDto } from './create-comment.dto';

@Injectable()
export class CommentService {
  // store comments in memory as { taskId -> comments[] }
  private commentsMap: Record<string, any[]> = {};

  create(taskId: string, dto: CreateCommentDto, user: any) {
    const comment = {
      taskId,
      commentId: uuid(),
      userId: user?.sub || user?.userId || user?.id || 'unknown',
      userName: user?.name || user?.username || 'anonymous',
      userRole: user?.role || 'user',
      text: dto.text,
      createdAt: new Date().toISOString(),
    };

    this.commentsMap[taskId] = this.commentsMap[taskId] || [];
    this.commentsMap[taskId].push(comment);

    return comment;
  }

  findByTask(taskId: string) {
    return this.commentsMap[taskId] || [];
  }

  findOne(taskId: string, commentId: string) {
    const list = this.findByTask(taskId);
    const c = list.find((x) => x.commentId === commentId);
    if (!c) throw new NotFoundException('Comment not found');
    return c;
  }
}
