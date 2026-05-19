import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './create-comment.dto';

@Controller('tasks/:taskId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.commentService.create(taskId, dto, req.user);
  }

  @Get()
  findByTask(@Param('taskId') taskId: string) {
    return this.commentService.findByTask(taskId);
  }
}
