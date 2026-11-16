
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationDocumentsController } from './application-documents.controller.js';
import { ApplicationDocumentsService } from './application-documents.service.js';

import { ApplicationDocument } from './entities/application-document.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { DocumentType } from '../document-types/entities/document-type.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationDocument,
      Application,
      DocumentType,
    ]),
  ],
  controllers: [ApplicationDocumentsController],
  providers: [ApplicationDocumentsService],
  exports: [ApplicationDocumentsService],
})
export class ApplicationDocumentsModule {}
