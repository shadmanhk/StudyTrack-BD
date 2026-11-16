
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { AppointmentStatus } from '../entities/appointment.entity.js';

export class ChangeAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
