import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller.js';

@Module({
  controllers: [ProgramsController]
})
export class ProgramsModule {}
