
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DocumentType } from './entities/document-type.entity.js';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto.js';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto.js';

@Injectable()
export class DocumentTypesService {
  constructor(
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
  ) {}

  private handleDatabaseError(error: unknown): never {
    const databaseError = error as {
      driverError?: { code?: string };
    };

    if (databaseError.driverError?.code === '23505') {
      throw new ConflictException(
        'A document type with this name already exists',
      );
    }

    if (databaseError.driverError?.code === '23503') {
      throw new ConflictException(
        'This document type is being used by application documents',
      );
    }

    throw error;
  }

  async create(dto: CreateDocumentTypeDto) {
    try {
      const documentType = this.documentTypeRepository.create(dto);
      return await this.documentTypeRepository.save(documentType);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(page = 1, limit = 10, category?: string, isActive?: boolean) {
    const query = this.documentTypeRepository
      .createQueryBuilder('documentType')
      .orderBy('documentType.name', 'ASC');

    if (category) {
      query.andWhere('documentType.category = :category', { category });
    }

    if (isActive !== undefined) {
      query.andWhere('documentType.isActive = :isActive', { isActive });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const documentType = await this.documentTypeRepository.findOne({
      where: { id },
    });

    if (!documentType) {
      throw new NotFoundException('Document type not found');
    }

    return documentType;
  }

  async update(id: string, dto: UpdateDocumentTypeDto) {
    const documentType = await this.findOne(id);

    Object.assign(documentType, dto);

    try {
      return await this.documentTypeRepository.save(documentType);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    const documentType = await this.findOne(id);

    try {
      await this.documentTypeRepository.remove(documentType);

      return {
        message: 'Document type deleted successfully',
      };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async setActiveStatus(id: string, isActive: boolean) {
    const documentType = await this.findOne(id);

    documentType.isActive = isActive;

    return this.documentTypeRepository.save(documentType);
  }
}
