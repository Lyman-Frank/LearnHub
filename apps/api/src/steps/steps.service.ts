import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';

@Injectable()
export class StepsService {
  constructor(private prisma: PrismaService) {}

  private async checkOwnershipByLessonId(lessonId: string, authorId: string, isAdmin: boolean) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: { course: true },
        },
      },
    });
    if (!lesson) {
      throw new NotFoundException('Урок не найден');
    }
    if (lesson.module.course.authorId !== authorId && !isAdmin) {
      throw new ForbiddenException('У вас нет прав для изменения этого курса');
    }
  }

  private parseStepContent(step: any) {
    if (step && step.content && typeof step.content === 'string') {
      try {
        step.content = JSON.parse(step.content);
      } catch (e) {
        // Оставляем как строку, если не парсится
      }
    }
    return step;
  }

  async create(dto: CreateStepDto, authorId: string, isAdmin = false) {
    await this.checkOwnershipByLessonId(dto.lessonId, authorId, isAdmin);

    const step = await this.prisma.step.create({
      data: {
        ...dto,
        content: dto.content ? JSON.stringify(dto.content) : null,
      },
    });

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: { module: true },
    });
    if (lesson?.module) await this.prisma.resetDraftStatus(lesson.module.courseId);

    return this.parseStepContent(step);
  }

  async update(id: string, dto: UpdateStepDto, authorId: string, isAdmin = false) {
    const step = await this.prisma.step.findUnique({ where: { id } });
    if (!step) {
      throw new NotFoundException('Шаг не найден');
    }
    await this.checkOwnershipByLessonId(step.lessonId, authorId, isAdmin);

    const updatedStep = await this.prisma.step.update({
      where: { id },
      data: {
        ...dto,
        content: dto.content !== undefined ? (dto.content ? JSON.stringify(dto.content) : null) : undefined,
      },
    });

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: step.lessonId },
      include: { module: true },
    });
    if (lesson?.module) await this.prisma.resetDraftStatus(lesson.module.courseId);

    return this.parseStepContent(updatedStep);
  }

  async remove(id: string, authorId: string, isAdmin = false) {
    const step = await this.prisma.step.findUnique({ where: { id } });
    if (!step) {
      throw new NotFoundException('Шаг не найден');
    }
    await this.checkOwnershipByLessonId(step.lessonId, authorId, isAdmin);

    const deletedStep = await this.prisma.step.delete({
      where: { id },
    });

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: step.lessonId },
      include: { module: true },
    });
    if (lesson?.module) await this.prisma.resetDraftStatus(lesson.module.courseId);

    return this.parseStepContent(deletedStep);
  }
}
