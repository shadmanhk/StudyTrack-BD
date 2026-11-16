
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  Repository,
} from 'typeorm';

import {
  Appointment,
  AppointmentStatus,
} from './entities/appointment.entity.js';

import {
  Application,
  ApplicationStatus,
} from '../applications/entities/application.entity.js';

import { StatusHistory } from '../status-history/entities/status-history.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';

import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { ChangeAppointmentStatusDto } from './dto/change-appointment-status.dto.js';

interface CurrentUser {
  userId: string;
  role: UserRole;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,

    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,

    @InjectRepository(StatusHistory)
    private readonly statusHistoryRepository: Repository<StatusHistory>,

    private readonly dataSource: DataSource,
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

  private assertCanAccess(application: Application, user: CurrentUser) {
    if (user.role === UserRole.ADMIN) return;

    if (
      user.role === UserRole.STUDENT &&
      application.student.id === user.userId
    ) return;

    if (
      user.role === UserRole.COUNSELOR &&
      application.assignedCounselor?.id === user.userId
    ) return;

    throw new ForbiddenException(
      'You cannot access appointments for this application',
    );
  }

  private async getAppointment(id: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: {
        application: {
          student: true,
          assignedCounselor: true,
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

 
async create(dto: CreateAppointmentDto, user: CurrentUser) {
  const application = await this.getApplication(dto.applicationId);
  this.assertCanAccess(application, user);

  const appointmentDate = new Date(dto.appointmentAt);

  if (Number.isNaN(appointmentDate.getTime())) {
    throw new BadRequestException('Invalid appointment date');
  }

  return this.dataSource.transaction(async (manager) => {
    const applicationRepo = manager.getRepository(Application);
    const appointmentRepo = manager.getRepository(Appointment);
    const historyRepo = manager.getRepository(StatusHistory);

    // Lock the application during appointment creation.
    const lockedApplication = await applicationRepo.findOne({
      where: { id: dto.applicationId },
      relations: {
        student: true,
        assignedCounselor: true,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (!lockedApplication) {
      throw new NotFoundException('Application not found');
    }

    this.assertCanAccess(lockedApplication, user);

    const currentStatus = lockedApplication.status;

    const canSchedule =
      currentStatus === ApplicationStatus.SUBMITTED ||
      currentStatus === ApplicationStatus.UNDER_REVIEW ||
      currentStatus === ApplicationStatus.APPOINTMENT_SCHEDULED;

    if (!canSchedule) {
      throw new ConflictException(
        'Appointments can only be scheduled for submitted or under-review applications',
      );
    }

    // Prevent multiple active appointments for one application.
    const activeAppointment = await appointmentRepo.findOne({
      where: {
        application: { id: dto.applicationId },
        status: AppointmentStatus.SCHEDULED,
      },
    });

    if (activeAppointment) {
      throw new ConflictException(
        'This application already has an active scheduled appointment',
      );
    }

    // A replacement appointment is allowed after cancellation or rescheduling.
    if (currentStatus === ApplicationStatus.APPOINTMENT_SCHEDULED) {
      const previousAppointmentCount = await appointmentRepo.count({
        where: {
          application: { id: dto.applicationId },
          status: In([
            AppointmentStatus.CANCELLED,
            AppointmentStatus.RESCHEDULED,
          ]),
        },
      });

      if (previousAppointmentCount === 0) {
        throw new ConflictException(
          'A replacement appointment requires a previously cancelled or rescheduled appointment',
        );
      }
    }

    const appointment = appointmentRepo.create({
      application: lockedApplication,
      appointmentType: dto.appointmentType,
      embassyName: dto.embassyName ?? null,
      country: dto.country,
      city: dto.city ?? null,
      appointmentAt: appointmentDate,
      timeZone: dto.timeZone ?? null,
      referenceNumber: dto.referenceNumber ?? null,
      status: AppointmentStatus.SCHEDULED,
      notes: dto.notes ?? null,
    });

    const savedAppointment = await appointmentRepo.save(appointment);

    // Update application status and history only when its status changes.
    if (currentStatus !== ApplicationStatus.APPOINTMENT_SCHEDULED) {
      lockedApplication.status =
        ApplicationStatus.APPOINTMENT_SCHEDULED;

      await applicationRepo.save(lockedApplication);

      const history = historyRepo.create({
        application: lockedApplication,
        previousStatus: currentStatus,
        newStatus: ApplicationStatus.APPOINTMENT_SCHEDULED,
        changedBy: { id: user.userId } as User,
        remarks: 'Application appointment scheduled',
      });

      await historyRepo.save(history);
    }

    return savedAppointment;
  });
}


  async findAll(
    user: CurrentUser,
    page = 1,
    limit = 10,
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.application', 'application')
      .leftJoinAndSelect('application.student', 'student')
      .leftJoinAndSelect('application.assignedCounselor', 'counselor')
      .orderBy('appointment.appointmentAt', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    if (user.role === UserRole.STUDENT) {
      query.andWhere('student.id = :userId', {
        userId: user.userId,
      });
    } else if (user.role === UserRole.COUNSELOR) {
      query.andWhere('counselor.id = :userId', {
        userId: user.userId,
      });
    }

    const [data, total] = await query.getManyAndCount();

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

  async findOne(id: string, user: CurrentUser) {
    const appointment = await this.getAppointment(id);
    this.assertCanAccess(appointment.application, user);
    return appointment;
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
    user: CurrentUser,
  ) {
    const appointment = await this.getAppointment(id);
    this.assertCanAccess(appointment.application, user);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new ConflictException(
        'Only scheduled appointments can be edited',
      );
    }

    if (dto.country !== undefined) appointment.country = dto.country;
    if (dto.appointmentAt !== undefined) {
      appointment.appointmentAt = new Date(dto.appointmentAt);
    }
    if (dto.embassyName !== undefined) appointment.embassyName = dto.embassyName;
    if (dto.city !== undefined) appointment.city = dto.city;
    if (dto.timeZone !== undefined) appointment.timeZone = dto.timeZone;
    if (dto.referenceNumber !== undefined) {
      appointment.referenceNumber = dto.referenceNumber;
    }
    if (dto.notes !== undefined) appointment.notes = dto.notes;

    return this.appointmentRepository.save(appointment);
  }

  async changeStatus(
    id: string,
    dto: ChangeAppointmentStatusDto,
    user: CurrentUser,
  ) {
    const appointment = await this.getAppointment(id);
    this.assertCanAccess(appointment.application, user);

    if (
      user.role !== UserRole.COUNSELOR &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only counselors and administrators can change appointment status',
      );
    }

    const allowedTransitions: Record<string, AppointmentStatus[]> = {
      [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.RESCHEDULED,
        AppointmentStatus.MISSED,
      ],
    };

    if (
      !allowedTransitions[appointment.status]?.includes(dto.status)
    ) {
      throw new BadRequestException(
        'Invalid appointment status transition',
      );
    }

    appointment.status = dto.status;

    if (dto.notes !== undefined) {
      appointment.notes = dto.notes;
    }

    return this.appointmentRepository.save(appointment);
  }

  async remove(id: string, user: CurrentUser) {
    const appointment = await this.getAppointment(id);
    this.assertCanAccess(appointment.application, user);

    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.STUDENT
    ) {
      throw new ForbiddenException(
        'Only the application owner or an administrator can cancel appointments',
      );
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new ConflictException(
        'Only scheduled appointments can be cancelled',
      );
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepository.save(appointment);

    return {
      message: 'Appointment cancelled successfully',
    };
  }
}
