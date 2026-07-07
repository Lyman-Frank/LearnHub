var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
let InvitesService = class InvitesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const code = this.generateCode();
        const expiresAt = dto.expiresInDays
            ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
            : null;
        return this.prisma.inviteCode.create({
            data: {
                code,
                maxUses: dto.maxUses ?? 1,
                currentUses: 0,
                expiresAt,
                isActive: true,
            },
        });
    }
    async findAll() {
        return this.prisma.inviteCode.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async deactivate(id) {
        const invite = await this.prisma.inviteCode.findUnique({ where: { id } });
        if (!invite) {
            throw new NotFoundException('Инвайт-код не найден');
        }
        return this.prisma.inviteCode.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async validate(code) {
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
            return { isValid: false, reason: 'Лимит использования кода исчерпан' };
        }
        if (invite.expiresAt && new Date() > invite.expiresAt) {
            return { isValid: false, reason: 'Срок действия инвайт-кода истек' };
        }
        return { isValid: true, invite };
    }
    generateCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `TEACH-${segment()}-${segment()}`;
    }
};
InvitesService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], InvitesService);
export { InvitesService };
