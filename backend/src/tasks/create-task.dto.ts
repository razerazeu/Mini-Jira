import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../enums';
import { IsTodayOrFutureDate, normalizeDeadline } from './deadline.validation';

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

  @Transform(({ value }) => normalizeDeadline(value))
  @IsDateString()
  @IsTodayOrFutureDate()
  deadline!: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  assigneeId!: string;

  @IsString()
  @IsOptional()
  teamId?: string;
}
