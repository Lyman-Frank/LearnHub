import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInviteDto) {
    const code = this.generateCode();
    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.inviteCode.create({
      data: {
        code,
        maxUses: dto.maxUses ?? 1,
        currentUses: 0,
        durationDays: dto.durationDays ?? 30,
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

  async deactivate(id: string) {
    const invite = await this.prisma.inviteCode.findUnique({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Инвайт-код не найден');
    }

    return this.prisma.inviteCode.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async validate(code: string) {
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

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `TEACH-${segment()}-${segment()}`;
  }
}
