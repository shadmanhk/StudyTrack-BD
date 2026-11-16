import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { University } from './entities/university.entity.js';
import { Program } from '../programs/entities/program.entity.js';
import { UniversitiesController } from './universities.controller.js';
import { UniversitiesService } from './universities.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([University, Program])],
  controllers: [UniversitiesController],
  providers: [UniversitiesService],
  exports: [UniversitiesService],
})
export class UniversitiesModule {}