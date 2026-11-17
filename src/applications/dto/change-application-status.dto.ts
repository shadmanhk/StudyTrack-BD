import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity.js';

export class ChangeApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  newStatus: ApplicationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}