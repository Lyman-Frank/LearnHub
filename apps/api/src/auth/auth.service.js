var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
import { Injectable, ConflictException, BadRequestException, ForbiddenException, UnauthorizedException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@repo/shared';
let AuthService = class AuthService {
    usersService;
    jwtService;
    configService;
    prisma;
    constructor(usersService, jwtService, configService, prisma) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
    }
    async register(dto) {
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException('Пользователь с такой электронной почтой уже зарегистрирован');
        }
        const role = dto.role || UserRole.STUDENT;
        if (role === UserRole.TEACHER) {
            if (!dto.inviteCode) {
                throw new BadRequestException('Для регистрации в качестве преподавателя требуется инвайт-код');
            }
            const inviteValidation = await this.validateInviteCode(dto.inviteCode);
            if (!inviteValidation.isValid) {
                throw new BadRequestException(inviteValidation.reason);
            }
            // Увеличиваем счетчик использований инвайт-кода
            await this.prisma.inviteCode.update({
                where: { id: inviteValidation.invite.id },
                data: { currentUses: { increment: 1 } },
            });
        }
        else if (role === UserRole.ADMIN) {
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
        });
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return {
            user: this.excludePassword(user),
            ...tokens,
        };
    }
    async login(dto) {
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
    async refreshToken(tokenStr) {
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
        const tokens = await this.generateTokens(storedToken.user.id, storedToken.user.email, storedToken.user.role);
        return tokens;
    }
    async logout(tokenStr) {
        try {
            await this.prisma.refreshToken.deleteMany({
                where: { token: tokenStr },
            });
        }
        catch (e) {
            // Игнорируем ошибки при удалении
        }
        return { success: true };
    }
    async getMe(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('Пользователь не найден');
        }
        return this.excludePassword(user);
    }
    async validateInviteCode(code) {
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
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET') || 'cyber_purple_secret_key',
            expiresIn: (this.configService.get('JWT_EXPIRES_IN') || '15m'),
        });
        // Создаем Refresh token
        const refreshTokenStr = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) +
            Date.now().toString(36);
        const refreshDays = parseInt(this.configService.get('JWT_REFRESH_EXPIRES_DAYS') || '7', 10);
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
    excludePassword(user) {
        const { passwordHash, ...rest } = user;
        return rest;
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [UsersService, typeof (_a = typeof JwtService !== "undefined" && JwtService) === "function" ? _a : Object, typeof (_b = typeof ConfigService !== "undefined" && ConfigService) === "function" ? _b : Object, PrismaService])
], AuthService);
export { AuthService };
