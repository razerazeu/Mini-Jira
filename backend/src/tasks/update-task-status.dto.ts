import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from '../enums';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}