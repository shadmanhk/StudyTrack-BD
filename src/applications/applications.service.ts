
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import {
  Application,
  ApplicationStatus,
} from './entities/application.entity.js';

import { User, UserRole } from '../users/entities/user.entity.js';
import { Program } from '../programs/entities/program.entity.js';
import { StatusHistory } from '../status-history/entities/status-history.entity.js';

import { CreateApplicationDto } from './dto/create-application.dto.js';
import { UpdateApplicationDto } from './dto/update-application.dto.js';
import { AssignCounselorDto } from './dto/assign-counselor.dto.js';
import { ChangeApplicationStatusDto } from './dto/change-application-status.dto.js';

interface CurrentUser {
  userId: string;
  role: UserRole;
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,

    private readonly dataSource: DataSource,
  ) {}

  // Find an application with its related records.
  private async getApplication(id: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: {
        student: true,
        program: { university: true },
        assignedCounselor: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  // Check application ownership and access permissions.
  private assertCanAccess(
    application: Application,
    user: CurrentUser,
  ): void {
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
      'You do not have permission to access this application',
    );
  }

  // Create an application and its initial history record atomically.
  async create(
    dto: CreateApplicationDto,
    userId: string,
  ): Promise<Application> {
    const program = await this.programRepository.findOne({
      where: {
        id: dto.programId,
        isActive: true,
      },
    });

    if (!program) {
      throw new NotFoundException('Active program not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const application = manager.create(Application, {
        student: { id: userId },
        program: { id: program.id },
        intakeTerm: dto.intakeTerm,
        intakeYear: dto.intakeYear,
        applicationReference: dto.applicationReference,
        notes: dto.notes,
        status: ApplicationStatus.DRAFT,
      });

      const savedApplication = await manager.save(
        Application,
        application,
      );

      const history = manager.create(StatusHistory, {
        application: { id: savedApplication.id },
        previousStatus: null,
        newStatus: ApplicationStatus.DRAFT,
        changedBy: { id: userId } as User,
        remarks: 'Application created',
      });

      await manager.save(StatusHistory, history);

      return savedApplication;
    });
  }

  // Get applications according to user role and filters.
  async findAll(
    user: CurrentUser,
    page = 1,
    limit = 10,
    filters: {
      status?: ApplicationStatus;
      programId?: string;
      intakeYear?: number;
      intakeTerm?: string;
    } = {},
  ) {
    const query = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.student', 'student')
      .leftJoinAndSelect('application.program', 'program')
      .leftJoinAndSelect('program.university', 'university')
      .leftJoinAndSelect(
        'application.assignedCounselor',
        'counselor',
      );

    if (user.role === UserRole.STUDENT) {
      query.andWhere('student.id = :userId', {
        userId: user.userId,
      });
    } else if (user.role === UserRole.COUNSELOR) {
      query.andWhere('counselor.id = :userId', {
        userId: user.userId,
      });
    }

    if (filters.status) {
      query.andWhere('application.status = :status', {
        status: filters.status,
      });
    }

    if (filters.programId) {
      query.andWhere('program.id = :programId', {
        programId: filters.programId,
      });
    }

    if (filters.intakeYear) {
      query.andWhere('application.intakeYear = :intakeYear', {
        intakeYear: filters.intakeYear,
      });
    }

    if (filters.intakeTerm) {
      query.andWhere('application.intakeTerm = :intakeTerm', {
        intakeTerm: filters.intakeTerm,
      });
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [data, total] = await query
      .orderBy('application.createdAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

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

  // Get one application after checking access.
  async findOne(
    id: string,
    user: CurrentUser,
  ): Promise<Application> {
    const application = await this.getApplication(id);

    this.assertCanAccess(application, user);

    return application;
  }

  // Update application details.
  // Only the owner Student or an Admin can edit details.
  async update(
    id: string,
    dto: UpdateApplicationDto,
    user: CurrentUser,
  ): Promise<Application> {
    const application = await this.getApplication(id);

    this.assertCanAccess(application, user);

    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.STUDENT
    ) {
      throw new ForbiddenException(
        'Counselors cannot edit application details',
      );
    }

    Object.assign(application, dto);

    return this.applicationRepository.save(application);
  }

  // Preserve applications for audit history.
  async remove(
    id: string,
    user: CurrentUser,
  ) {
    const application = await this.getApplication(id);

    this.assertCanAccess(application, user);

    throw new ConflictException(
      'Applications are retained for audit history. Use the withdrawal status process instead of permanently deleting an application.',
    );
  }

  // Assign an active Counselor to an application.
  async assignCounselor(
    id: string,
    dto: AssignCounselorDto,
  ): Promise<Application> {
    const application = await this.getApplication(id);

    const counselor = await this.userRepository.findOne({
      where: {
        id: dto.counselorId,
        role: UserRole.COUNSELOR,
        isActive: true,
      },
    });

    if (!counselor) {
      throw new NotFoundException('Active counselor not found');
    }

    application.assignedCounselor = counselor;

    return this.applicationRepository.save(application);
  }

  // Allowed application status transitions.
  private readonly allowedTransitions: Record<
    ApplicationStatus,
    ApplicationStatus[]
  > = {
    [ApplicationStatus.DRAFT]: [
      ApplicationStatus.PLANNING,
      ApplicationStatus.WITHDRAWN,
    ],

    [ApplicationStatus.PLANNING]: [
      ApplicationStatus.DOCUMENTS_PENDING,
      ApplicationStatus.WITHDRAWN,
    ],

    [ApplicationStatus.DOCUMENTS_PENDING]: [
      ApplicationStatus.READY_TO_SUBMIT,
      ApplicationStatus.WITHDRAWN,
    ],

    [ApplicationStatus.READY_TO_SUBMIT]: [
      ApplicationStatus.SUBMITTED,
      ApplicationStatus.WITHDRAWN,
    ],

    [ApplicationStatus.SUBMITTED]: [
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.APPOINTMENT_SCHEDULED,
      ApplicationStatus.WITHDRAWN,
    ],

    [ApplicationStatus.UNDER_REVIEW]: [
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.APPOINTMENT_SCHEDULED,
    ],

    [ApplicationStatus.ACCEPTED]: [],

    [ApplicationStatus.REJECTED]: [],

    [ApplicationStatus.WITHDRAWN]: [],

    [ApplicationStatus.APPOINTMENT_SCHEDULED]: [],
  };

  // Change application status and create history atomically.
  // Only Admin or the assigned Counselor can change status.
  async changeStatus(
    id: string,
    dto: ChangeApplicationStatusDto,
    user: CurrentUser,
  ): Promise<Application> {
    const application = await this.getApplication(id);

    if (user.role !== UserRole.ADMIN) {
      if (
        user.role !== UserRole.COUNSELOR ||
        application.assignedCounselor?.id !== user.userId
      ) {
        throw new ForbiddenException(
          'Only an administrator or the assigned counselor can change application status',
        );
      }
    }

    // Appointment scheduling must use the appointment endpoint.
    if (
      dto.newStatus === ApplicationStatus.APPOINTMENT_SCHEDULED
    ) {
      throw new BadRequestException(
        'Use the appointment creation process to schedule an appointment',
      );
    }

    const allowed =
      this.allowedTransitions[application.status] ?? [];

    if (!allowed.includes(dto.newStatus)) {
      throw new BadRequestException(
        `Cannot change application status from ${application.status} to ${dto.newStatus}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const previousStatus = application.status;

      application.status = dto.newStatus;

      const savedApplication = await manager.save(
        Application,
        application,
      );

      const history = manager.create(StatusHistory, {
        application: { id },
        previousStatus,
        newStatus: dto.newStatus,
        changedBy: { id: user.userId } as User,
        remarks: dto.remarks,
      });

      await manager.save(StatusHistory, history);

      return savedApplication;
    });
  }
}
