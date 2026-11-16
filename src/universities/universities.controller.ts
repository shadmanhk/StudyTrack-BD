
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

import { UniversitiesService } from './universities.service.js';
import { CreateUniversityDto } from './dto/create-university.dto.js';
import { UpdateUniversityDto } from './dto/update-university.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Universities')
@ApiBearerAuth()
@Controller('universities')
@UseGuards(JwtAuthGuard)
export class UniversitiesController {
  constructor(
    private readonly universitiesService: UniversitiesService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a university (Admin only)' })
  @ApiResponse({ status: 201, description: 'University created successfully' })
  @ApiResponse({ status: 409, description: 'University already exists' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  create(@Body() dto: CreateUniversityDto) {
    return this.universitiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get universities with pagination and filters' })
  @ApiQuery({ name: 'page', required: fal******ample: 1 })
  @ApiQuery({ name: 'limit', required: fal******ample: 10 })
  @ApiQuery({ name: 'country', required: fal******ample: 'Germany' })
  @ApiQuery({ name: 'city', required: fal******ample: 'Berlin' })
  @ApiQuery({ name: 'isActive', required: fal******ample: true })
  @ApiResponse({ status: 200, description: 'Universities retrieved successfully' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('isActive') isActive?: string,
  ) {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

    const activeFilter =
      isActive === 'true' ? true :
      isActive === 'false' ? false :
      undefined;

    return this.universitiesService.findAll(
      currentPage,
      pageSize,
      country,
      city,
      activeFilter,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a university by ID' })
  @ApiResponse({ status: 200, description: 'University retrieved successfully' })
  @ApiResponse({ status: 404, description: 'University not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.universitiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a university (Admin only)' })
  @ApiResponse({ status: 200, description: 'University updated successfully' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'University not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUniversityDto,
  ) {
    return this.universitiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a university (Admin only)' })
  @ApiResponse({ status: 200, description: 'University deleted successfully' })
  @ApiResponse({ status: 409, description: 'University has related programs' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.universitiesService.remove(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a university (Admin only)' })
  @ApiResponse({ status: 200, description: 'University activated successfully' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.universitiesService.setActiveStatus(id, true);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a university (Admin only)' })
  @ApiResponse({ status: 200, description: 'University deactivated successfully' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.universitiesService.setActiveStatus(id, false);
  }
}
