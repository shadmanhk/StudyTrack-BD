
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StatusHistoryService } from './status-history.service.js';
import { StatusHistoryController } from './status-history.controller.js';

import { StatusHistory } from './entities/status-history.entity.js';
import { Application } from '../applications/entities/application.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StatusHistory,
      Application,
    ]),
  ],
  controllers: [StatusHistoryController],
  providers: [StatusHistoryService],
  exports: [StatusHistoryService],
})
export class StatusHistoryModule {}
