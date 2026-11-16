
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { AppointmentType } from '../entities/appointment.entity.js';

export class CreateAppointmentDto {
  @IsUUID()
  applicationId: string;

  @IsEnum(AppointmentType)
  appointmentType: AppointmentType;

  @IsString()
  @MaxLength(100)
  country: string;

  @IsDateString()
  appointmentAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  embassyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  timeZone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
