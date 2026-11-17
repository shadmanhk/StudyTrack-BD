import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
 
import {
  User,
  UserRole,
} from '../../users/entities/user.entity.js';
 
interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
 
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }
 
  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
        isActive: true,
      },
    });
 
    if (!user) {
      throw new UnauthorizedException(
        'Account is inactive or unavailable',
      );
    }
 
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
 