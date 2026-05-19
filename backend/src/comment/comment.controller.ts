import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './create-comment.dto';
import { UpdateCommentDto } from './update-comment.dto';

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
  findAll(@Param('taskId') taskId: string, @Req() req: any) {
    return this.commentService.findAll(taskId, req.user);
  }

  @Get(':commentId')
  findOne(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    return this.commentService.findOne(taskId, commentId, req.user);
  }

  @Put(':commentId')
  update(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: any,
  ) {
    return this.commentService.update(taskId, commentId, dto, req.user);
  }

  @Delete(':commentId')
  remove(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    return this.commentService.remove(taskId, commentId, req.user);
  }
}
