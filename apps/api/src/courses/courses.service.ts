import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCourseDto, authorId: string) {
    return this.prisma.course.create({
      data: {
        ...dto,
        authorId,
        status: 'DRAFT',
      },
    });
  }

  async findAllForAdmin() {
    return this.prisma.course.findMany({
      where: { isDraft: true },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { modules: true, enrollments: true } },
      },
    });
  }

  async adminUpdateStatus(id: string, status: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Курс не найден');
    
    if (status === 'PUBLISHED') {
      await this.publish(id);
      await this.prisma.notification.create({
        data: {
          userId: course.authorId,
          title: `Курс "${course.title}" опубликован!`,
          message: `Поздравляем! Ваш курс успешно прошел модерацию и теперь доступен всем студентам.`,
          type: 'MODERATION'
        }
      });
      return this.prisma.course.findUnique({ where: { id } });
    } else {
      return this.prisma.course.update({ where: { id }, data: { status } });
    }
  }

  async adminRejectCourse(id: string, reason: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Курс не найден');

    const updated = await this.prisma.course.update({
      where: { id },
      data: { status: 'DRAFT' }
    });

    await this.prisma.notification.create({
      data: {
        userId: course.authorId,
        title: `Курс "${course.title}" не прошел модерацию`,
        message: reason,
        type: 'MODERATION'
      }
    });

    return updated;
  }

  async findAllByAuthor(authorId: string) {
    return this.prisma.course.findMany({
      where: { authorId, isDraft: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string, role?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        _count: {
          select: { enrollments: true },
        },
        modules: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              include: {
                steps: {
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    if (course.modules) {
      course.modules.forEach((mod) => {
        if (mod.lessons) {
          mod.lessons.forEach((les) => {
            if (les.steps) {
              les.steps.forEach((step: any) => {
                if (step.content && typeof step.content === 'string') {
                  try {
                    step.content = JSON.parse(step.content);
                  } catch (e) {
                    // ignore
                  }
                }
              });
            }
          });
        }
      });
    }

    if (role === 'STUDENT' && userId) {
      const isAuthor = course.authorId === userId;
      if (!isAuthor) {
        let courseUnlocked = false;
        if (course.password) {
          const unlockRecord = await this.prisma.userUnlockedCourse.findUnique({
            where: { userId_courseId: { userId, courseId: id } },
          });
          courseUnlocked = !!unlockRecord;
        } else {
          courseUnlocked = true;
        }

        if (!courseUnlocked) {
          return {
            id: course.id,
            title: course.title,
            description: course.description,
            coverUrl: course.coverUrl,
            status: course.status,
            xp: course.xp,
            authorId: course.authorId,
            author: course.author,
            isLocked: true,
            isPrivate: true,
            modules: [],
            _count: course._count,
          };
        }

        const activeModules = [];
        for (const mod of course.modules) {
          if (mod.isArchived) continue;

          let moduleUnlocked = false;
          if (mod.password) {
            const unlockRecord = await this.prisma.userUnlockedModule.findUnique({
              where: { userId_moduleId: { userId, moduleId: mod.id } },
            });
            moduleUnlocked = !!unlockRecord;
          } else {
            moduleUnlocked = true;
          }

          const lessons = [];
          if (moduleUnlocked) {
            for (const les of mod.lessons) {
              if (les.isArchived) continue;
              const steps = les.steps.filter(step => !step.isArchived);
              lessons.push({ ...les, steps });
            }
          }

          activeModules.push({
            id: mod.id,
            title: mod.title,
            position: mod.position,
            xp: mod.xp,
            isArchived: mod.isArchived,
            isLocked: !moduleUnlocked,
            isPrivate: mod.password !== null && mod.password !== '',
            lessons,
          });
        }

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          coverUrl: course.coverUrl,
          status: course.status,
          xp: course.xp,
          authorId: course.authorId,
          author: course.author,
          isLocked: false,
          isPrivate: course.password !== null && course.password !== '',
          modules: activeModules,
          _count: course._count,
        };
      }
    }

    return {
      ...course,
      isLocked: false,
    };
  }

  async update(id: string, dto: UpdateCourseDto, authorId: string, isAdmin = false) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    if (course.authorId !== authorId && !isAdmin) {
      throw new ForbiddenException('У вас нет прав для изменения этого курса');
    }

    if (dto.status === 'PUBLISHED' && !isAdmin) {
      throw new ForbiddenException('Только администратор может опубликовать курс');
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: dto,
    });

    if (updated.isDraft && updated.status === 'PUBLISHED' && !dto.status) {
      await this.prisma.resetDraftStatus(id);
      return this.prisma.course.findUnique({ where: { id } });
    }

    return updated;
  }

  async remove(id: string, authorId: string, isAdmin = false) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    if (course.authorId !== authorId && !isAdmin) {
      throw new ForbiddenException('У вас нет прав для удаления этого курса');
    }

    return this.prisma.course.delete({
      where: { id },
    });
  }

  // ===== ПУБЛИЧНЫЙ КАТАЛОГ =====
  async findPublished(search?: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit;
    const where: any = { status: 'PUBLISHED', isDraft: false };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          _count: {
            select: { modules: true, enrollments: true },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    const mappedCourses = courses.map((c: any) => {
      const isPrivate = c.password !== null && c.password !== '';
      const { password, ...rest } = c;
      return { ...rest, isPrivate };
    });

    return { courses: mappedCourses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ===== ЗАПИСЬ НА КУРС =====
  async enroll(courseId: string, userId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, isDraft: false },
    });
    if (!course) throw new NotFoundException('Курс не найден');
    if (course.status !== 'PUBLISHED') throw new NotFoundException('Курс недоступен');

    if (course.password) {
      const unlocked = await this.prisma.userUnlockedCourse.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (!unlocked) {
        throw new ForbiddenException('Курс защищен паролем. Сначала разблокируйте его.');
      }
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return { message: 'Вы уже записаны на этот курс', enrollment: existing };

    const enrollment = await this.prisma.enrollment.create({
      data: { userId, courseId },
    });
    return { message: 'Запись на курс выполнена успешно', enrollment };
  }

  async getEnrollment(courseId: string, userId: string) {
    return this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
  }

  async getStudentCourses(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
            _count: { select: { modules: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async publish(draftCourseId: string) {
    const draftCourse = await this.prisma.course.findUnique({
      where: { id: draftCourseId },
      include: {
        modules: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              include: {
                steps: {
                  orderBy: { position: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!draftCourse) {
      throw new NotFoundException('Черновик курса не найден');
    }

    let publishedCourseId = draftCourse.publishedId;

    if (!publishedCourseId) {
      const newPublishedCourse = await this.prisma.course.create({
        data: {
          title: draftCourse.title,
          description: draftCourse.description,
          coverUrl: draftCourse.coverUrl,
          status: 'PUBLISHED',
          xp: draftCourse.xp,
          isDraft: false,
          password: draftCourse.password,
          authorId: draftCourse.authorId,
        },
      });
      publishedCourseId = newPublishedCourse.id;

      await this.prisma.course.update({
        where: { id: draftCourseId },
        data: { publishedId: publishedCourseId },
      });
    } else {
      await this.prisma.course.update({
        where: { id: publishedCourseId },
        data: {
          title: draftCourse.title,
          description: draftCourse.description,
          coverUrl: draftCourse.coverUrl,
          status: 'PUBLISHED',
          xp: draftCourse.xp,
          password: draftCourse.password,
        },
      });
    }

    const publishedModules = await this.prisma.module.findMany({
      where: { courseId: publishedCourseId },
    });

    const draftModuleIds = draftCourse.modules.map(m => m.id);
    for (const draftMod of draftCourse.modules) {
      const pubMod = publishedModules.find(pm => pm.draftId === draftMod.id);
      if (pubMod) {
        await this.prisma.module.update({
          where: { id: pubMod.id },
          data: {
            title: draftMod.title,
            position: draftMod.position,
            xp: draftMod.xp,
            password: draftMod.password,
            isArchived: draftMod.isArchived,
          },
        });
      } else {
        await this.prisma.module.create({
          data: {
            title: draftMod.title,
            position: draftMod.position,
            xp: draftMod.xp,
            password: draftMod.password,
            isArchived: draftMod.isArchived,
            courseId: publishedCourseId,
            draftId: draftMod.id,
          },
        });
      }
    }

    const modulesToDelete = publishedModules.filter(pm => !pm.draftId || !draftModuleIds.includes(pm.draftId));
    for (const pm of modulesToDelete) {
      await this.prisma.module.delete({ where: { id: pm.id } });
    }

    const allPubModules = await this.prisma.module.findMany({
      where: { courseId: publishedCourseId },
    });

    const publishedLessons = await this.prisma.lesson.findMany({
      where: { moduleId: { in: allPubModules.map(m => m.id) } },
    });

    const draftLessons = draftCourse.modules.flatMap(m => m.lessons);
    const draftLessonIds = draftLessons.map(l => l.id);

    for (const draftLes of draftLessons) {
      const parentPubMod = allPubModules.find(pm => pm.draftId === draftLes.moduleId);
      if (!parentPubMod) continue;

      const pubLes = publishedLessons.find(pl => pl.draftId === draftLes.id);
      if (pubLes) {
        await this.prisma.lesson.update({
          where: { id: pubLes.id },
          data: {
            title: draftLes.title,
            position: draftLes.position,
            moduleId: parentPubMod.id,
            isArchived: draftLes.isArchived,
          },
        });
      } else {
        await this.prisma.lesson.create({
          data: {
            title: draftLes.title,
            position: draftLes.position,
            moduleId: parentPubMod.id,
            draftId: draftLes.id,
            isArchived: draftLes.isArchived,
          },
        });
      }
    }

    const lessonsToDelete = publishedLessons.filter(pl => !pl.draftId || !draftLessonIds.includes(pl.draftId));
    for (const pl of lessonsToDelete) {
      await this.prisma.lesson.delete({ where: { id: pl.id } });
    }

    const allPubLessons = await this.prisma.lesson.findMany({
      where: { moduleId: { in: allPubModules.map(m => m.id) } },
    });

    const publishedSteps = await this.prisma.step.findMany({
      where: { lessonId: { in: allPubLessons.map(l => l.id) } },
    });

    const draftSteps = draftLessons.flatMap(l => l.steps);
    const draftStepIds = draftSteps.map(s => s.id);

    for (const draftStep of draftSteps) {
      const parentPubLes = allPubLessons.find(pl => pl.draftId === draftStep.lessonId);
      if (!parentPubLes) continue;

      const pubStep = publishedSteps.find(ps => ps.draftId === draftStep.id);
      if (pubStep) {
        await this.prisma.step.update({
          where: { id: pubStep.id },
          data: {
            title: draftStep.title,
            content: draftStep.content,
            type: draftStep.type,
            xp: draftStep.xp,
            position: draftStep.position,
            lessonId: parentPubLes.id,
            isArchived: draftStep.isArchived,
          },
        });
      } else {
        await this.prisma.step.create({
          data: {
            title: draftStep.title,
            content: draftStep.content,
            type: draftStep.type,
            xp: draftStep.xp,
            position: draftStep.position,
            lessonId: parentPubLes.id,
            draftId: draftStep.id,
            isArchived: draftStep.isArchived,
          },
        });
      }
    }

    const stepsToDelete = publishedSteps.filter(ps => !ps.draftId || !draftStepIds.includes(ps.draftId));
    for (const ps of stepsToDelete) {
      await this.prisma.step.delete({ where: { id: ps.id } });
    }

    await this.prisma.course.update({
      where: { id: draftCourseId },
      data: { status: 'PUBLISHED' },
    });

    return this.prisma.course.findUnique({
      where: { id: publishedCourseId },
      include: {
        modules: {
          include: {
            lessons: {
              include: { steps: true },
            },
          },
        },
      },
    });
  }

  async unlockCourse(id: string, password: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Курс не найден');
    if (!course.password) return { success: true, message: 'Курс не защищен паролем' };

    if (course.password !== password) {
      throw new ForbiddenException('Неверный пароль курса');
    }

    await this.prisma.userUnlockedCourse.upsert({
      where: { userId_courseId: { userId, courseId: id } },
      create: { userId, courseId: id },
      update: {},
    });

    return { success: true };
  }

  async unlockModule(moduleId: string, password: string, userId: string) {
    const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new NotFoundException('Раздел не найден');
    if (!module.password) return { success: true, message: 'Раздел не защищен паролем' };

    if (module.password !== password) {
      throw new ForbiddenException('Неверный пароль раздела');
    }

    await this.prisma.userUnlockedModule.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: { userId, moduleId },
      update: {},
    });

    return { success: true };
  }

  async getCourseStudents(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) throw new NotFoundException('Курс не найден');

    // Если это черновик — студенты записаны на published копию
    let effectiveCourseId = courseId;
    if (course.isDraft && course.publishedId) {
      effectiveCourseId = course.publishedId;
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId: effectiveCourseId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });

    const totalStepsCount = await this.prisma.step.count({
      where: {
        lesson: {
          module: {
            courseId: effectiveCourseId
          }
        },
        isArchived: false
      }
    });

    const studentsProgress = await Promise.all(enrollments.map(async (enr) => {
      const studentId = enr.user.id;

      const completedSteps = await this.prisma.stepProgress.findMany({
        where: {
          userId: studentId,
          isCompleted: true,
          step: {
            lesson: {
              module: {
                courseId: effectiveCourseId
              }
            }
          }
        },
        select: {
          stepId: true
        }
      });

      const steps = await this.prisma.step.findMany({
        where: {
          id: {
            in: completedSteps.map(cs => cs.stepId)
          }
        },
        select: {
          xp: true,
          type: true
        }
      });

      const xpEarned = steps.reduce((sum, step) => {
        let stepXp = step.xp;
        if (stepXp === null || stepXp === undefined) {
          stepXp = 10;
          if (step.type === 'SINGLE_CHOICE' || step.type === 'MULTIPLE_CHOICE') stepXp = 20;
          else if (step.type === 'MATCHING') stepXp = 30;
          else if (step.type === 'PARSONS') stepXp = 40;
          else if (step.type === 'CODE') stepXp = 50;
        }
        return sum + stepXp;
      }, 0);

      const lastProgress = await this.prisma.stepProgress.findFirst({
        where: {
          userId: studentId,
          step: {
            lesson: {
              module: {
                courseId: effectiveCourseId
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        select: {
          updatedAt: true
        }
      });

      const percentage = totalStepsCount > 0
        ? Math.round((completedSteps.length / totalStepsCount) * 100)
        : 0;

      return {
        user: enr.user,
        enrolledAt: enr.enrolledAt,
        percentage,
        xpEarned,
        lastActivity: lastProgress?.updatedAt || enr.enrolledAt
      };
    }));

    return studentsProgress;
  }

  async getStudentProgressDetails(courseId: string, studentId: string, userId: string) {
    const originalCourse = await this.prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!originalCourse) throw new NotFoundException('Курс не найден');

    // Если это черновик — используем published копию для данных студентов
    let effectiveCourseId = courseId;
    if (originalCourse.isDraft && originalCourse.publishedId) {
      effectiveCourseId = originalCourse.publishedId;
    }

    const course = await this.prisma.course.findUnique({
      where: { id: effectiveCourseId },
      include: {
        modules: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              include: {
                steps: {
                  orderBy: { position: 'asc' }
                }
              }
            }
          }
        }
      }
    });
    if (!course) throw new NotFoundException('Опубликованная версия курса не найдена');

    const progressRecords = await this.prisma.stepProgress.findMany({
      where: {
        userId: studentId,
        step: {
          lesson: {
            module: {
              courseId: effectiveCourseId
            }
          }
        }
      }
    });

    const progressMap = new Map(progressRecords.map(r => [r.stepId, r]));

    let totalTimeSpent = 0;
    const stepsDetails = [];

    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        for (const step of les.steps) {
          const prog = progressMap.get(step.id);
          const time = prog?.timeSpent ?? 0;
          totalTimeSpent += time;

          stepsDetails.push({
            id: step.id,
            title: step.title,
            type: step.type,
            lessonTitle: les.title,
            moduleTitle: mod.title,
            isCompleted: prog?.isCompleted ?? false,
            timeSpent: time,
            answer: prog?.answer ?? null,
            isCorrect: prog?.isCorrect ?? null,
            attempts: prog?.attempts ?? 0,
            completedAt: prog?.completedAt ?? null
          });
        }
      }
    }

    const studentInfo = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
    });

    return {
      student: studentInfo,
      totalTimeSpent,
      steps: stepsDetails
    };
  }
}

