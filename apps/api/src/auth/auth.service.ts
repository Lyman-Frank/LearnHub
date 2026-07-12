import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@repo/database';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Пользователь с такой электронной почтой уже зарегистрирован');
    }

    const role = dto.role || UserRole.STUDENT;

    let subscriptionExpiresAt: Date | undefined = undefined;

    if (role === UserRole.TEACHER) {
      if (!dto.inviteCode) {
        throw new BadRequestException('Для регистрации в качестве преподавателя требуется инвайт-код');
      }

      const inviteValidation = await this.validateInviteCode(dto.inviteCode);
      if (!inviteValidation.isValid) {
        throw new BadRequestException(inviteValidation.reason);
      }

      const durationDays = inviteValidation.invite.durationDays ?? 30;
      subscriptionExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      // Увеличиваем счетчик использований инвайт-кода
      await this.prisma.inviteCode.update({
        where: { id: inviteValidation.invite.id },
        data: { currentUses: { increment: 1 } },
      });
    } else if (role === UserRole.ADMIN) {
      throw new ForbiddenException('Регистрация администраторов через общую форму невозможна');
    }

    // Хэшируем пароль
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role,
      institutionType: dto.institutionType,
      institutionName: dto.institutionName,
      subscriptionExpiresAt,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.excludePassword(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Неверный адрес электронной почты или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный адрес электронной почты или пароль');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Ваш аккаунт заблокирован или деактивирован');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.excludePassword(user),
      ...tokens,
    };
  }

  async refreshToken(tokenStr: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenStr },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Недействительный refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Срок действия refresh token истек');
    }

    // Удаляем старый токен (one-time use)
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Генерируем новые токены
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    return tokens;
  }

  async logout(tokenStr: string) {
    try {
      await this.prisma.refreshToken.deleteMany({
        where: { token: tokenStr },
      });
    } catch (e) {
      // Игнорируем ошибки при удалении
    }
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return this.excludePassword(user);
  }

  private async validateInviteCode(code: string) {
    const invite = await this.prisma.inviteCode.findUnique({
      where: { code },
    });

    if (!invite) {
      return { isValid: false, reason: 'Инвайт-код не существует' };
    }

    if (!invite.isActive) {
      return { isValid: false, reason: 'Инвайт-код деактивирован' };
    }

    if (invite.currentUses >= invite.maxUses) {
      return { isValid: false, reason: 'Лимит использований инвайт-кода исчерпан' };
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return { isValid: false, reason: 'Срок действия инвайт-кода истек' };
    }

    return { isValid: true, invite };
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '15m') as any,
    });

    // Создаем Refresh token
    const refreshTokenStr =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36);

    const refreshDays = parseInt(this.configService.get<string>('JWT_REFRESH_EXPIRES_DAYS') || '7', 10);
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenStr,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenStr,
    };
  }

  async activateKey(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    if (user.role !== UserRole.TEACHER) {
      throw new BadRequestException('Активация инвайт-кодов доступна только для преподавателей');
    }

    const inviteValidation = await this.validateInviteCode(code);
    if (!inviteValidation.isValid) {
      throw new BadRequestException(inviteValidation.reason);
    }

    const durationDays = inviteValidation.invite.durationDays ?? 30;
    const currentExpiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).getTime() : Date.now();
    const baseTime = Math.max(currentExpiry, Date.now());
    const newExpiry = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { subscriptionExpiresAt: newExpiry }
      }),
      this.prisma.inviteCode.update({
        where: { id: inviteValidation.invite.id },
        data: { currentUses: { increment: 1 } }
      })
    ]);

    return {
      message: 'Ключ доступа успешно активирован',
      subscriptionExpiresAt: newExpiry
    };
  }

  private excludePassword<T extends { passwordHash: string }>(user: T) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
