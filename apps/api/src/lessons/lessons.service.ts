import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  private async checkOwnershipByModuleId(moduleId: string, authorId: string, isAdmin: boolean) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!module) {
      throw new NotFoundException('Модуль не найден');
    }
    if (module.course.authorId !== authorId && !isAdmin) {
      throw new ForbiddenException('У вас нет прав для изменения этого курса');
    }
  }

  async create(dto: CreateLessonDto, authorId: string, isAdmin = false) {
    await this.checkOwnershipByModuleId(dto.moduleId, authorId, isAdmin);
    const res = await this.prisma.lesson.create({
      data: dto,
    });
    const module = await this.prisma.module.findUnique({ where: { id: dto.moduleId } });
    if (module) await this.prisma.resetDraftStatus(module.courseId);
    return res;
  }

  async update(id: string, dto: UpdateLessonDto, authorId: string, isAdmin = false) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }
    await this.checkOwnershipByModuleId(lesson.moduleId, authorId, isAdmin);

    const res = await this.prisma.lesson.update({
      where: { id },
      data: dto,
    });
    const module = await this.prisma.module.findUnique({ where: { id: lesson.moduleId } });
    if (module) await this.prisma.resetDraftStatus(module.courseId);
    return res;
  }

  async remove(id: string, authorId: string, isAdmin = false) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }
    await this.checkOwnershipByModuleId(lesson.moduleId, authorId, isAdmin);

    const res = await this.prisma.lesson.delete({
      where: { id },
    });
    const module = await this.prisma.module.findUnique({ where: { id: lesson.moduleId } });
    if (module) await this.prisma.resetDraftStatus(module.courseId);
    return res;
  }
}
