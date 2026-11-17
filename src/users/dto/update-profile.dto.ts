import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
 
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;
 
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;
}