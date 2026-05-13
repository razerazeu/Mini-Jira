import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  teamId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}