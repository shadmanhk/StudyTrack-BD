import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
 
import { UserRole } from '../entities/user.entity.js';
 
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;
 
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;
 
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
 
  @IsIn([UserRole.COUNSELOR, UserRole.ADMIN])
  role: UserRole;
}