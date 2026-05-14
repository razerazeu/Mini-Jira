import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Optional: use this only if a project is team-specific.
   * If empty, manager can use the project across teams.
   */
  @IsString()
  @IsOptional()
  teamId?: string;
}