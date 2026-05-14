import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  cognitoSub!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @IsOptional()
  teamId?: string;
}
