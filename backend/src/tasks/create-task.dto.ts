import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../enums';

const US_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const normalizeDeadline = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  const match = US_DATE_REGEX.exec(trimmed);
  if (!match) {
    return trimmed;
  }

  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
};

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