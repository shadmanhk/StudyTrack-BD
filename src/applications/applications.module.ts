import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Application } from './entities/application.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Program } from '../programs/entities/program.entity.js';
import { StatusHistory } from '../status-history/entities/status-history.entity.js';

import { ApplicationsController } from './applications.controller.js';
import { ApplicationsService } from './applications.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      User,
      Program,
      StatusHistory,
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}