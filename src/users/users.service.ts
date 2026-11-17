import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
 
import { User, UserRole } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
 
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
 
  private safeUser(user: User) {
    const { passwordHash, ...safeData } = user;
    return safeData;
  }
 
  private handleDatabaseError(error: any): never {
    if (error?.code === '23505') {
      throw new ConflictException('Email is already registered');
    }
    throw error;
  }
 
  async findAll(page = 1, limit = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
 
    return {
      data: users.map((user) => this.safeUser(user)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
 
  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
 
    if (!user) {
      throw new NotFoundException('User not found');
    }
 
    return this.safeUser(user);
  }
 
  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
 
    const existing = await this.userRepository.findOne({
      where: { email },
    });
 
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
 
    try {
      const user = this.userRepository.create({
        fullName: dto.fullName.trim(),
        email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        role: dto.role,
      });
 
      return this.safeUser(await this.userRepository.save(user));
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
 
  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id } });
 
    if (!user) {
      throw new NotFoundException('User not found');
    }
 
    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }
 
    if (dto.email !== undefined) {
      user.email = dto.email.trim().toLowerCase();
    }
 
    try {
      return this.safeUser(await this.userRepository.save(user));
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
 
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
 
    if (!user) {
      throw new NotFoundException('User not found');
    }
 
    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }
 
    if (dto.email !== undefined) {
      user.email = dto.email.trim().toLowerCase();
    }
 
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
 
    try {
      return this.safeUser(await this.userRepository.save(user));
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
 
  async setActiveStatus(id: string, isActive: boolean) {
    const user = await this.userRepository.findOne({ where: { id } });
 
    if (!user) {
      throw new NotFoundException('User not found');
    }
 
    user.isActive = isActive;
 
    return this.safeUser(await this.userRepository.save(user));
  }
}