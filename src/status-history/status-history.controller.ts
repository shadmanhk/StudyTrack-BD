
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { StatusHistoryService } from './status-history.service.js';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Status History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class StatusHistoryController {
  constructor(
    private readonly statusHistoryService: StatusHistoryService,
  ) {}

  @Get('applications/:id/status-history')
  @Roles(UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get status history for a specific application',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByApplication(
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Request() req: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.statusHistoryService.findByApplication(
      applicationId,
      req.user,
      page,
      limit,
    );
  }

  @Get('status-history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all application status history (Admin only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Request() req: any,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.statusHistoryService.findAll(
      req.user,
      page,
      limit,
    );
  }
}
