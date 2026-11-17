import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  programId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  intakeTerm?: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  intakeYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  applicationReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}