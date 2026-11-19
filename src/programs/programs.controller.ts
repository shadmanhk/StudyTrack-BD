
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ProgramsService } from './programs.service.js';
import { CreateProgramDto } from './dto/create-program.dto.js';
import { UpdateProgramDto } from './dto/update-program.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Programs')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post('programs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a program (Admin only)' })
  @ApiResponse({ status: 201, description: 'Program created successfully' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 409, description: 'Program already exists' })
  create(@Body() dto: CreateProgramDto) {
    return this.programsService.create(dto);
  }

  @Get('programs')
  @ApiOperation({ summary: 'Get programs with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'universityId', required: false, description: 'University UUID' })
  @ApiQuery({ name: 'degreeLevel', required: false, example: 'MASTERS' })
  @ApiQuery({ name: 'fieldOfStudy', required: false, example: 'Computer Science' })
  @ApiQuery({ name: 'languageOfInstruction', required: false, example: 'English' })
  @ApiResponse({ status: 200, description: 'Programs retrieved successfully' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('universityId') universityId?: string,
    @Query('degreeLevel') degreeLevel?: string,
    @Query('fieldOfStudy') fieldOfStudy?: string,
    @Query('languageOfInstruction') language?: string,
  ) {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

    return this.programsService.findAll(
      currentPage,
      pageSize,
      universityId,
      degreeLevel,
      fieldOfStudy,
      language,
    );
  }

  @Get('universities/:id/programs')
  @ApiOperation({ summary: 'Get programs belonging to a university' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'University programs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'University not found' })
  findByUniversity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

    return this.programsService.findByUniversity(
      id,
      currentPage,
      pageSize,
    );
  }

  @Get('programs/:id')
  @ApiOperation({ summary: 'Get a program by ID' })
  @ApiResponse({ status: 200, description: 'Program retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.findOne(id);
  }

  @Patch('programs/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a program (Admin only)' })
  @ApiResponse({ status: 200, description: 'Program updated successfully' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgramDto,
  ) {
    return this.programsService.update(id, dto);
  }

  @Delete('programs/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a program (Admin only)' })
  @ApiResponse({ status: 200, description: 'Program deleted successfully' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 409, description: 'Program is referenced by applications' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.remove(id);
  }

  @Patch('programs/:id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a program (Admin only)' })
  @ApiResponse({ status: 200, description: 'Program activated successfully' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.setActiveStatus(id, true);
  }

  @Patch('programs/:id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a program (Admin only)' })
  @ApiResponse({ status: 200, description: 'Program deactivated successfully' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.programsService.setActiveStatus(id, false);
  }
}
