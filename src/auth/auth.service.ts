import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
 
import { User, UserRole } from '../users/entities/user.entity.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
 
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
 
    private readonly jwtService: JwtService,
  ) {}
 
  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();
 
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
 
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }
 
    const passwordHash = await bcrypt.hash(registerDto.password, 12);
 
    const user = this.userRepository.create({
      fullName: registerDto.fullName.trim(),
      email,
      passwordHash,
      role: UserRole.STUDENT,
    });
 
    const savedUser = await this.userRepository.save(user);
 
    const accessToken = await this.jwtService.signAsync({
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    });
 
    return {
      message: 'Registration successful',
      accessToken,
      user: {
        id: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        role: savedUser.role,
      },
    };
  }
 
 
async login(loginDto: LoginDto) {
  const email = loginDto.email.trim().toLowerCase();
 
  const user = await this.userRepository
    .createQueryBuilder('user')
    .addSelect('user.passwordHash')
    .where('user.email = :email', { email })
    .getOne();
 
  if (
    !user ||
    !(await bcrypt.compare(loginDto.password, user.passwordHash))
  ) {
    throw new UnauthorizedException('Invalid email or password');
  }
 
  if (!user.isActive) {
    throw new UnauthorizedException('This account is inactive');
  }
 
  const accessToken = await this.jwtService.signAsync({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
 
  return {
    message: 'Login successful',
    accessToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
}
 
}