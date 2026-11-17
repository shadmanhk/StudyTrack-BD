import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
 
import { UserRole } from '../entities/user.entity.js';
 
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;
 
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;
 
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}