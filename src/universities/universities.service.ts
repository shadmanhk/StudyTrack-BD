import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { University } from './entities/university.entity.js';
import { Program } from '../programs/entities/program.entity.js';
import { CreateUniversityDto } from './dto/create-university.dto.js';
import { UpdateUniversityDto } from './dto/update-university.dto.js';

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,

    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {}

  private handleDatabaseError(error: any): never {
    if (error?.code === '23505') {
      throw new ConflictException(
        'A university with this name and country already exists',
      );
    }
    throw error;
  }

  async create(dto: CreateUniversityDto) {
    try {
      const university = this.universityRepository.create({
        ...dto,
        name: dto.name.trim(),
        country: dto.country.trim(),
      });

      return await this.universityRepository.save(university);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    country?: string,
    city?: string,
    isActive?: boolean,
  ) {
    const query = this.universityRepository
      .createQueryBuilder('university')
      .orderBy('university.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (country) {
      query.andWhere('LOWER(university.country) = LOWER(:country)', {
        country,
      });
    }

    if (city) {
      query.andWhere('LOWER(university.city) = LOWER(:city)', { city });
    }

    if (isActive !== undefined) {
      query.andWhere('university.isActive = :isActive', { isActive });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const university = await this.universityRepository.findOne({
      where: { id },
    });

    if (!university) {
      throw new NotFoundException('University not found');
    }

    return university;
  }

  async update(id: string, dto: UpdateUniversityDto) {
    const university = await this.findOne(id);

    Object.assign(university, dto);

    if (dto.name !== undefined) {
      university.name = dto.name.trim();
    }

    if (dto.country !== undefined) {
      university.country = dto.country.trim();
    }

    try {
      return await this.universityRepository.save(university);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    const university = await this.findOne(id);

    const programCount = await this.programRepository.count({
      where: { university: { id } },
    });

    if (programCount > 0) {
      throw new ConflictException(
        'Cannot delete a university that has programs. Deactivate it instead.',
      );
    }

    await this.universityRepository.remove(university);

    return {
      message: 'University deleted successfully',
    };
  }

  async setActiveStatus(id: string, isActive: boolean) {
    const university = await this.findOne(id);
    university.isActive = isActive;
    return this.universityRepository.save(university);
  }
}