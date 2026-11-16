
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ApplicationDocumentsService } from './application-documents.service.js';

import { CreateApplicationDocumentDto } from './dto/create-application-document.dto.js';
import { UpdateApplicationDocumentDto } from './dto/update-application-document.dto.js';
import { ChangeDocumentStatusDto } from './dto/change-document-status.dto.js';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Application Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ApplicationDocumentsController {
  constructor(
    private readonly applicationDocumentsService: ApplicationDocumentsService,
  ) {}

  @Post('applications/:id/documents')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a document to an application' })
  @ApiResponse({ status: 201, description: 'Document added successfully' })
  @ApiResponse({ status: 409, description: 'Document already exists' })
  create(
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Body() dto: CreateApplicationDocumentDto,
    @Request() req: any,
  ) {
    return this.applicationDocumentsService.create(
      applicationId,
      dto,
      req.user,
    );
  }

  @Get('applications/:id/documents')
  @Roles(UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'List documents for an application' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllByApplication(
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Request() req: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.applicationDocumentsService.findAllByApplication(
      applicationId,
      req.user,
      page,
      limit,
    );
  }

  @Get('application-documents/:id')
  @Roles(UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get an application document' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.applicationDocumentsService.findOne(id, req.user);
  }

  @Patch('application-documents/:id')
  @Roles(UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update document remarks' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationDocumentDto,
    @Request() req: any,
  ) {
    return this.applicationDocumentsService.update(
      id,
      dto,
      req.user,
    );
  }

  @Patch('application-documents/:id/status')
  @Roles(UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Submit or review an application document' })
  @ApiResponse({ status: 200, description: 'Document status updated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeDocumentStatusDto,
    @Request() req: any,
  ) {
    return this.applicationDocumentsService.changeStatus(
      id,
      dto,
      req.user,
    );
  }

  @Delete('application-documents/:id')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an application document' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.applicationDocumentsService.remove(id, req.user);
  }
}
