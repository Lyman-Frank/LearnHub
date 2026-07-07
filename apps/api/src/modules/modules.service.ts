import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  private async checkOwnership(courseId: string, authorId: string, isAdmin: boolean) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Курс не найден');
    }
    if (course.authorId !== authorId && !isAdmin) {
      throw new ForbiddenException('У вас нет прав для изменения этого курса');
    }
  }

  async create(dto: CreateModuleDto, authorId: string, isAdmin = false) {
    await this.checkOwnership(dto.courseId, authorId, isAdmin);
    const res = await this.prisma.module.create({
      data: dto,
    });
    await this.prisma.resetDraftStatus(dto.courseId);
    return res;
  }

  async update(id: string, dto: UpdateModuleDto, authorId: string, isAdmin = false) {
    const module = await this.prisma.module.findUnique({ where: { id } });
    if (!module) {
      throw new NotFoundException('Модуль не найден');
    }
    await this.checkOwnership(module.courseId, authorId, isAdmin);

    const res = await this.prisma.module.update({
      where: { id },
      data: dto,
    });
    await this.prisma.resetDraftStatus(module.courseId);
    return res;
  }

  async remove(id: string, authorId: string, isAdmin = false) {
    const module = await this.prisma.module.findUnique({ where: { id } });
    if (!module) {
      throw new NotFoundException('Модуль не найден');
    }
    await this.checkOwnership(module.courseId, authorId, isAdmin);

    const res = await this.prisma.module.delete({
      where: { id },
    });
    await this.prisma.resetDraftStatus(module.courseId);
    return res;
  }
}
