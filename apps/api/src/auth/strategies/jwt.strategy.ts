import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@repo/database';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'cyber_purple_secret_key',
    });
  }

  async validate(payload: { sub: string; email: string; role: UserRole }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!user) {
      return null;
    }

    const isExpired = user.role === 'TEACHER' && 
      (!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) < new Date());

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      isSubscriptionExpired: isExpired,
    };
  }
}
