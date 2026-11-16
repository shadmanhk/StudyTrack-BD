
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DocumentTypesService } from './document-types.service.js';
import { DocumentTypesController } from './document-types.controller.js';
import { DocumentType } from './entities/document-type.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentType])],
  controllers: [DocumentTypesController],
  providers: [DocumentTypesService],
  exports: [TypeOrmModule],
})
export class DocumentTypesModule {}
