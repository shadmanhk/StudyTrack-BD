
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { UniversitiesModule } from './universities/universities.module.js';
import { ProgramsModule } from './programs/programs.module.js';
import { ApplicationsModule } from './applications/applications.module.js';
import { DocumentTypesModule } from './document-types/document-types.module.js';
import { ApplicationDocumentsModule } from './application-documents/application-documents.module.js';
import { ProgramsModule } from './programs/programs.module.js';
import { ProgramsService } from './programs/programs.service.js';
import { UniversitiesModule } from './universities/universities.module.js';
import { UniversitiesService } from './universities/universities.service.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { StatusHistoryModule } from './status-history/status-history.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ApplicationDocumentsModule } from './application-documents/application-documents.module.js';
import { DocumentTypesModule } from './document-types/document-types.module.js';
import { DocumentTypesController } from './document-types/document-types.controller.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { ApplicationDocumentsModule } from './application-documents/application-documents.module.js';
import { ApplicationDocumentsModule } from './application-documents/application-documents.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    UsersModule,

    UniversitiesModule,

    ProgramsModule,

    ApplicationsModule,

    DocumentTypesModule,

    ApplicationDocumentsModule,

    AppointmentsModule,

    StatusHistoryModule,

    AuthModule,
  ],
  controllers: [AppController, DocumentTypesController],
  providers: [AppService, UniversitiesService, ProgramsService],
})
export class AppModule {}
