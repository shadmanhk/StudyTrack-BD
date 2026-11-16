
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ApplicationDocument,
  ApplicationDocumentStatus,
} from './entities/application-document.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { DocumentType } from '../document-types/entities/document-type.entity.js';
import { UserRole } from '../users/entities/user.entity.js';

import { CreateApplicationDocumentDto } from './dto/create-application-document.dto.js';
import { UpdateApplicationDocumentDto } from './dto/update-application-document.dto.js';
import { ChangeDocumentStatusDto } from './dto/change-document-status.dto.js';

interface CurrentUser {
  userId: string;
  role: UserRole;
}

@Injectable()
export class ApplicationDocumentsService {
  constructor(
    @InjectRepository(ApplicationDocument)
    private readonly documentRepository: Repository<ApplicationDocument>,

    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,

    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
  ) {}

  private async getApplication(id: string): Promise<Application> {
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
      'You do not have permission to access these application documents',
    );
  }

  private async getDocument(id: string): Promise<ApplicationDocument> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: {
        application: {
          student: true,
          assignedCounselor: true,
        },
        documentType: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Application document not found');
    }

    return document;
  }

  private assertCanReview(user: CurrentUser): void {
    if (
      user.role !== UserRole.ADMIN &&
      user.role !== UserRole.COUNSELOR
    ) {
      throw new ForbiddenException(
        'Only counselors and administrators can review documents',
      );
    }
  }

  async create(
    applicationId: string,
    dto: CreateApplicationDocumentDto,
    user: CurrentUser,
  ) {
    const application = await this.getApplication(applicationId);
    this.assertCanAccess(application, user);

    if (
      user.role !== UserRole.STUDENT &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only the application owner or an administrator can add documents',
      );
    }

    const documentType = await this.documentTypeRepository.findOne({
      where: {
        id: dto.documentTypeId,
        isActive: true,
      },
    });

    if (!documentType) {
      throw new NotFoundException('Active document type not found');
    }

    const document = this.documentRepository.create({
      application,
      documentType,
      isRequired: dto.isRequired ?? true,
      status: ApplicationDocumentStatus.PENDING,
    });

    try {
      return await this.documentRepository.save(document);
    } catch (error) {
      const databaseError = error as {
        driverError?: { code?: string };
      };

      if (databaseError.driverError?.code === '23505') {
        throw new ConflictException(
          'This document type is already added to the application',
        );
      }

      throw error;
    }
  }

  async findAllByApplication(
    applicationId: string,
    user: CurrentUser,
    page = 1,
    limit = 10,
  ) {
    const application = await this.getApplication(applicationId);
    this.assertCanAccess(application, user);

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    const [data, total] = await this.documentRepository.findAndCount({
      where: {
        application: { id: applicationId },
      },
      relations: {
        documentType: true,
      },
      order: {
        createdAt: 'DESC',
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

  async findOne(id: string, user: CurrentUser) {
    const document = await this.getDocument(id);
    this.assertCanAccess(document.application, user);
    return document;
  }

 
  async update(
    id: string,
    dto: UpdateApplicationDocumentDto,
    user: CurrentUser,
  ) {
    const document = await this.getDocument(id);
    this.assertCanAccess(document.application, user);

    if (document.status === ApplicationDocumentStatus.VERIFIED) {
      throw new ConflictException(
        'A verified document cannot be edited',
      );
    }

    if (dto.remarks === undefined) {
      throw new BadRequestException(
        'At least one permitted field must be provided',
      );
    }

    document.remarks = dto.remarks;

    return this.documentRepository.save(document);
  }


  async changeStatus(
    id: string,
    dto: ChangeDocumentStatusDto,
    user: CurrentUser,
  ) {
    const document = await this.getDocument(id);
    this.assertCanAccess(document.application, user);

    if (user.role === UserRole.STUDENT) {
      if (dto.status !== ApplicationDocumentStatus.SUBMITTED) {
        throw new ForbiddenException(
          'Students can only mark their documents as submitted',
        );
      }

      if (
        document.status !== ApplicationDocumentStatus.PENDING &&
        document.status !== ApplicationDocumentStatus.REJECTED
      ) {
        throw new BadRequestException(
          'This document cannot be submitted in its current status',
        );
      }
    } else {
      this.assertCanReview(user);

      if (
        dto.status === ApplicationDocumentStatus.PENDING ||
        dto.status === ApplicationDocumentStatus.SUBMITTED
      ) {
        throw new BadRequestException(
          'Reviewers can only set UNDER_REVIEW, VERIFIED or REJECTED',
        );
      }

      if (
        document.status !== ApplicationDocumentStatus.SUBMITTED &&
        document.status !== ApplicationDocumentStatus.UNDER_REVIEW
      ) {
        throw new BadRequestException(
          'Only submitted documents can be reviewed',
        );
      }
    }

    document.status = dto.status;

    if (dto.status === ApplicationDocumentStatus.SUBMITTED) {
      document.submittedAt = new Date();
      document.verifiedAt = null;
    } else if (dto.status === ApplicationDocumentStatus.VERIFIED) {
      document.verifiedAt = new Date();
    } else if (dto.status === ApplicationDocumentStatus.REJECTED) {
      document.verifiedAt = null;
    } else if (dto.status === ApplicationDocumentStatus.UNDER_REVIEW) {
      document.verifiedAt = null;
    }

    if (dto.remarks !== undefined) {
      document.remarks = dto.remarks;
    }

    return this.documentRepository.save(document);
  }

  async remove(id: string, user: CurrentUser) {
    const document = await this.getDocument(id);
    this.assertCanAccess(document.application, user);

    if (
      user.role !== UserRole.STUDENT &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only the application owner or an administrator can delete documents',
      );
    }

    if (document.status === ApplicationDocumentStatus.VERIFIED) {
      throw new ConflictException(
        'Verified documents cannot be deleted',
      );
    }

    await this.documentRepository.remove(document);

    return {
      message: 'Application document deleted successfully',
    };
  }
}
