import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { DegreeLevel } from '../entities/program.entity.js';

export class CreateProgramDto {
  @IsUUID()
  universityId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsEnum(DegreeLevel)
  degreeLevel: DegreeLevel;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fieldOfStudy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  languageOfInstruction?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  durationMonths?: number;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  officialUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;
}