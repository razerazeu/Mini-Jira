import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaskPriority } from '../enums';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @IsDateString()
  deadline!: string;

  @IsString()
  @IsNotEmpty()
  assigneeId!: string;

  @IsString()
  @IsNotEmpty()
  teamId!: string;
}