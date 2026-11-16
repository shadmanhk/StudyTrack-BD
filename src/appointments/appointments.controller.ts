
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

import { AppointmentsService } from './appointments.service.js';

import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { ChangeAppointmentStatusDto } from './dto/change-appointment-status.dto.js';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Post()
  @Roles(UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create an appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created' })
  @ApiResponse({ status: 409, description: 'Application status conflict' })
  create(
    @Body() dto: CreateAppointmentDto,
    @Request() req: any,
  ) {
    return this.appointmentsService.create(dto, req.user);
  }

  @Get()
  @Roles(UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get appointments with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Request() req: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.appointmentsService.findAll(
      req.user,
      page,
      limit,
    );
  }

  @Get(':id')
  @Roles(UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get appointment details' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.appointmentsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update appointment details' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @Request() req: any,
  ) {
    return this.appointmentsService.update(
      id,
      dto,
      req.user,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.COUNSELOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Change appointment status' })
  @ApiResponse({ status: 200, description: 'Appointment status updated' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeAppointmentStatusDto,
    @Request() req: any,
  ) {
    return this.appointmentsService.changeStatus(
      id,
      dto,
      req.user,
    );
  }

  @Delete(':id')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel an appointment' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    return this.appointmentsService.remove(id, req.user);
  }
}
