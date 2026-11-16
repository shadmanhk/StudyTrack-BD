
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { DocumentTypesService } from './document-types.service.js';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto.js';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Document Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('document-types')
export class DocumentTypesController {
  constructor(
    private readonly documentTypesService: DocumentTypesService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a document type (Admin only)' })
  @ApiResponse({ status: 201, description: 'Document type created' })
  @ApiResponse({ status: 409, description: 'Duplicate document type name' })
  create(@Body() dto: CreateDocumentTypeDto) {
    return this.documentTypesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all document types with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: [
    'IDENTITY', 'ACADEMIC', 'LANGUAGE', 'FINANCIAL', 'APPLICATION', 'OTHER',
  ] })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('category') category?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
  ) {
    return this.documentTypesService.findAll(
      page,
      Math.min(limit, 100),
      category,
      isActive,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document type by ID' })
  @ApiResponse({ status: 404, description: 'Document type not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentTypesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a document type (Admin only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentTypeDto,
  ) {
    return this.documentTypesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a document type (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentTypesService.remove(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a document type (Admin only)' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentTypesService.setActiveStatus(id, true);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a document type (Admin only)' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentTypesService.setActiveStatus(id, false);
  }
}
