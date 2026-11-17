
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

import { ApplicationsService } from './applications.service.js';
import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';
import { AssignCounselorDto } from './dto/assign-counselor.dto.js';
import { ChangeApplicationStatusDto } from './dto/change-application-status.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';
import { ApplicationStatus } from './entities/application.entity.js';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create an application (Student only)' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid application data' })
  @ApiResponse({ status: 403, description: 'Student role required' })
  create(@Body() dto: CreateApplicationDto, @Request() req: any) {
    return this.applicationsService.create(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get applications based on user role with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @ApiQuery({ name: 'programId', required: false, description: 'Program UUID' })
  @ApiQuery({ name: 'intakeYear', required: false, example: 2027 })
  @ApiQuery({ name: 'intakeTerm', required: false, example: 'Fall' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: ApplicationStatus,
    @Query('programId') programId?: string,
    @Query('intakeYear') intakeYear?: string,
    @Query('intakeTerm') intakeTerm?: string,
  ) {
    return this.applicationsService.findAll(
      req.user,
      Number(page),
      Number(limit),
      {
        status,
        programId,
        intakeYear: intakeYear ? Number(intakeYear) : undefined,
        intakeTerm,
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an application by ID (authorized users only)' })
  @ApiResponse({ status: 200, description: 'Application retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.applicationsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update application details (authorized users only)' })
  @ApiResponse({ status: 200, description: 'Application updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid application data' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationDto,
    @Request() req: any,
  ) {
    return this.applicationsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an eligible application' })
  @ApiResponse({ status: 200, description: 'Application deleted successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 409, description: 'Application cannot be deleted' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.applicationsService.remove(id, req.user);
  }

  @Patch(':id/assign-counselor')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Assign a counselor to an application (Admin only)' })
  @ApiResponse({ status: 200, description: 'Counselor assigned successfully' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Application or counselor not found' })
  assignCounselor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCounselorDto,
  ) {
    return this.applicationsService.assignCounselor(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COUNSELOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Change application status (Admin or Counselor)' })
  @ApiResponse({ status: 200, description: 'Application status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 403, description: 'Insufficient role or access denied' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeApplicationStatusDto,
    @Request() req: any,
  ) {
    return this.applicationsService.changeStatus(
      id,
      dto,
      req.user,
    );
  }
}
