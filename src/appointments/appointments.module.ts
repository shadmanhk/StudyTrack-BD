
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentsService } from './appointments.service.js';
import { AppointmentsController } from './appointments.controller.js';

import { Appointment } from './entities/appointment.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { StatusHistory } from '../status-history/entities/status-history.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Application,
      StatusHistory,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
