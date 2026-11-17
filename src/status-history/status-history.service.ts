
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { StatusHistory } from './entities/status-history.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { UserRole } from '../users/entities/user.entity.js';

interface CurrentUser {
  userId: string;
  role: UserRole;
}

@Injectable()
export class StatusHistoryService {
  constructor(
    @InjectRepository(StatusHistory)
    private readonly historyRepository: Repository<StatusHistory>,

    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {}

  private async getApplication(id: string) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: {
        student: true,
        assignedCounselor: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  private assertCanAccess(
    application: Application,
    user: CurrentUser,
  ) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (
      user.role === UserRole.STUDENT &&
      application.student.id === user.userId
    ) {
      return;
    }

    if (
      user.role === UserRole.COUNSELOR &&
      application.assignedCounselor?.id === user.userId
    ) {
      return;
    }

    throw new ForbiddenException(
      'You cannot access this application status history',
    );
  }

  async findByApplication(
    applicationId: string,
    user: CurrentUser,
    page = 1,
    limit = 10,
  ) {
    const application = await this.getApplication(applicationId);
    this.assertCanAccess(application, user);

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [data, total] = await this.historyRepository.findAndCount({
      where: {
        application: { id: applicationId },
      },
      relations: {
        changedBy: true,
      },
      order: {
        changedAt: 'DESC',
      },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      data,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findAll(
    user: CurrentUser,
    page = 1,
    limit = 10,
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can view all status history',
      );
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [data, total] = await this.historyRepository.findAndCount({
      relations: {
        application: true,
        changedBy: true,
      },
      order: {
        changedAt: 'DESC',
      },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      data,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
}
