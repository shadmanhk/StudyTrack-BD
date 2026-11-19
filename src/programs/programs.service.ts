import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Program } from './entities/program.entity.js';
import { University } from '../universities/entities/university.entity.js';
import { CreateProgramDto } from './dto/create-program.dto.js';
import { UpdateProgramDto } from './dto/update-program.dto.js';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,

    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
  ) {}

  private handleDatabaseError(error: any): never {
    if (error?.code === '23505') {
      throw new ConflictException(
        'This program already exists at the selected university',
      );
    }

    if (error?.code === '23503') {
      throw new ConflictException(
        'This program is referenced by an application and cannot be deleted or changed in this way',
      );
    }

    throw error;
  }

  private async getActiveUniversity(id: string) {
    const university = await this.universityRepository.findOne({
      where: { id, isActive: true },
    });

    if (!university) {
      throw new NotFoundException(
        'Active university not found',
      );
    }

    return university;
  }

  async create(dto: CreateProgramDto) {
    const university = await this.getActiveUniversity(dto.universityId);

    try {
      const program = this.programRepository.create({
        name: dto.name.trim(),
        degreeLevel: dto.degreeLevel,
        fieldOfStudy: dto.fieldOfStudy,
        languageOfInstruction: dto.languageOfInstruction,
        durationMonths: dto.durationMonths,
        officialUrl: dto.officialUrl,
        description: dto.description,
        university,
      });

      return await this.programRepository.save(program);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    universityId?: string,
    degreeLevel?: string,
    fieldOfStudy?: string,
    languageOfInstruction?: string,
  ) {
    const query = this.programRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.university', 'university')
      .orderBy('program.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (universityId) {
      query.andWhere('university.id = :universityId', {
        universityId,
      });
    }

    if (degreeLevel) {
      query.andWhere('program.degreeLevel = :degreeLevel', {
        degreeLevel,
      });
    }

    if (fieldOfStudy) {
      query.andWhere(
        'LOWER(program.fieldOfStudy) LIKE LOWER(:fieldOfStudy)',
        { fieldOfStudy: `%${fieldOfStudy}%` },
      );
    }

    if (languageOfInstruction) {
      query.andWhere(
        'LOWER(program.languageOfInstruction) = LOWER(:language)',
        { language: languageOfInstruction },
      );
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

  async findByUniversity(universityId: string, page = 1, limit = 10) {
    await this.getActiveUniversity(universityId);

    return this.findAll(page, limit, universityId);
  }

  async findOne(id: string) {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: { university: true },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return program;
  }

  async update(id: string, dto: UpdateProgramDto) {
    const program = await this.findOne(id);

    if (dto.universityId !== undefined) {
      program.university = await this.getActiveUniversity(
        dto.universityId,
      );
    }

    if (dto.name !== undefined) program.name = dto.name.trim();
    if (dto.degreeLevel !== undefined) {
      program.degreeLevel = dto.degreeLevel;
    }
    if (dto.fieldOfStudy !== undefined) {
      program.fieldOfStudy = dto.fieldOfStudy;
    }
    if (dto.languageOfInstruction !== undefined) {
      program.languageOfInstruction = dto.languageOfInstruction;
    }
    if (dto.durationMonths !== undefined) {
      program.durationMonths = dto.durationMonths;
    }
    if (dto.officialUrl !== undefined) {
      program.officialUrl = dto.officialUrl;
    }
    if (dto.description !== undefined) {
      program.description = dto.description;
    }

    try {
      return await this.programRepository.save(program);
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async remove(id: string) {
    const program = await this.findOne(id);

    try {
      await this.programRepository.remove(program);

      return { message: 'Program deleted successfully' };
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async setActiveStatus(id: string, isActive: boolean) {
    const program = await this.findOne(id);
    program.isActive = isActive;

    return this.programRepository.save(program);
  }
}