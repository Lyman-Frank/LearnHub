import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodeSandboxService } from './code-sandbox.service';
import { BadgesService } from '../badges/badges.service';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private codeSandboxService: CodeSandboxService,
    private badgesService: BadgesService
  ) {}

  async completeStep(userId: string, stepId: string, answer?: string, isCorrect?: boolean, timeSpent?: number) {
    // 1. Находим существующий прогресс
    const existingProgress = await this.prisma.stepProgress.findUnique({
      where: { userId_stepId: { userId, stepId } }
    });

    // 2. Находим информацию о шаге с его уроком, модулем и курсом
    const step = await this.prisma.step.findUnique({
      where: { id: stepId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    if (!step) {
      throw new Error('Step not found');
    }

    let finalIsCorrect = isCorrect;
    let testCaseResults: any[] = [];

    // Если это кодовый шаг, бэкенд САМ прогоняет тест-кейсы
    if (step.type === 'CODE') {
      const code = answer || '';
      let parsedContent: any = {};
      try {
        parsedContent = typeof step.content === 'string' ? JSON.parse(step.content) : step.content;
      } catch (e) {
        // ignore
      }

      const testCases = parsedContent?.testCases || [];
      const language = parsedContent?.language || 'pascal';

      let allPassed = true;
      for (const tc of testCases) {
        const result = await this.codeSandboxService.runCode(code, language, tc.input);
        const cleanStdout = (result.stdout || '').trim().replace(/\r\n/g, '\n');
        const cleanExpected = (tc.expected || '').trim().replace(/\r\n/g, '\n');
        const passed = (result.status === 0) && (cleanStdout === cleanExpected);

        if (!passed) {
          allPassed = false;
        }

        testCaseResults.push({
          input: tc.input,
          expected: tc.expected,
          output: result.stdout,
          error: result.stderr || result.compilerMessage,
          passed,
        });
      }

      finalIsCorrect = testCases.length > 0 ? allPassed : false;
    }

    // Будет ли шаг считаться пройденным?
    // Для TEXT шагов: да, сразу.
    // Для квизов/тестов: только если ответ верный (finalIsCorrect === true).
    const willBeCompleted = step.type === 'TEXT' ? true : (finalIsCorrect === true);

    // Если шаг уже пройден (isCompleted === true), мы не начисляем опыт повторно
    const wasAlreadyCompleted = existingProgress?.isCompleted === true;

    // Выполняем апсерт прогресса шага
    const progress = await this.prisma.stepProgress.upsert({
      where: { userId_stepId: { userId, stepId } },
      update: {
        isCompleted: wasAlreadyCompleted ? true : willBeCompleted,
        completedAt: willBeCompleted ? new Date() : (existingProgress?.completedAt ?? null),
        answer: answer ?? null,
        isCorrect: finalIsCorrect ?? null,
        attempts: { increment: 1 },
        timeSpent: { increment: timeSpent || 0 },
      },
      create: {
        userId,
        stepId,
        isCompleted: willBeCompleted,
        completedAt: willBeCompleted ? new Date() : null,
        answer: answer ?? null,
        isCorrect: finalIsCorrect ?? null,
        attempts: 1,
        timeSpent: timeSpent || 0,
      },
    });

    let xpEarned = 0;
    let newStreak = 0;
    let totalXp = 0;
    let moduleBonusXp = 0;
    let courseBonusXp = 0;
    let completedModuleTitle = '';
    let completedCourseTitle = '';

    // 3. Начисление опыта и обновление стрика, если шаг пройден ВПЕРВЫЕ
    if (willBeCompleted && !wasAlreadyCompleted) {
      // Базовый XP шага (используем custom xp если задан, иначе fallback по типам)
      let baseXp = step.xp;
      if (baseXp === undefined || baseXp === null) {
        baseXp = 10;
        if (step.type === 'SINGLE_CHOICE' || step.type === 'MULTIPLE_CHOICE') {
          baseXp = 20;
        } else if (step.type === 'MATCHING') {
          baseXp = 30;
        } else if (step.type === 'PARSONS') {
          baseXp = 40;
        } else if (step.type === 'CODE') {
          baseXp = 50;
        }
      }

      // --- Расчет бонуса за закрытие модуля ---
      const moduleId = step.lesson.moduleId;
      const moduleXpSetting = step.lesson.module.xp || 0;

      if (moduleXpSetting > 0) {
        // Находим все шаги в этом модуле
        const moduleSteps = await this.prisma.step.findMany({
          where: { lesson: { moduleId } },
          select: { id: true }
        });
        const moduleStepIds = moduleSteps.map(s => s.id);

        // Проверяем, сколько из них завершено пользователем
        const completedModuleStepsCount = await this.prisma.stepProgress.count({
          where: {
            userId,
            stepId: { in: moduleStepIds },
            isCompleted: true
          }
        });

        // Так как мы только что апсертнули текущий шаг как завершенный,
        // если completedModuleStepsCount === moduleStepIds.length, то этот шаг был последним!
        if (completedModuleStepsCount === moduleStepIds.length) {
          moduleBonusXp = moduleXpSetting;
          completedModuleTitle = step.lesson.module.title;
        }
      }

      // --- Расчет бонуса за закрытие курса и выдача сертификата ---
      const courseId = step.lesson.module.courseId;

      // Находим все шаги в этом курсе
      const courseSteps = await this.prisma.step.findMany({
        where: { lesson: { module: { courseId } } },
        select: { id: true }
      });
      const courseStepIds = courseSteps.map(s => s.id);

      if (courseStepIds.length > 0) {
        // Проверяем, сколько завершено
        const completedCourseStepsCount = await this.prisma.stepProgress.count({
          where: {
            userId,
            stepId: { in: courseStepIds },
            isCompleted: true
          }
        });

        if (completedCourseStepsCount === courseStepIds.length) {
          const courseXpSetting = step.lesson.module.course.xp || 0;
          if (courseXpSetting > 0) {
            courseBonusXp = courseXpSetting;
          }
          completedCourseTitle = step.lesson.module.course.title;

          // Выдаем сертификат в базе данных
          const existingCert = await this.prisma.certificate.findUnique({
            where: { userId_courseId: { userId, courseId } }
          });
          if (!existingCert) {
            await this.prisma.certificate.create({
              data: {
                userId,
                courseId,
              }
            });
          }
        }
      }

      // Получаем информацию о пользователе
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (user) {
        newStreak = user.streak;
        
        // Вычисляем стрик
        if (!user.lastActiveAt) {
          newStreak = 1;
        } else {
          const lastDate = new Date(user.lastActiveAt);
          lastDate.setHours(0, 0, 0, 0);
          
          const currDate = new Date();
          currDate.setHours(0, 0, 0, 0);
          
          const diffTime = currDate.getTime() - lastDate.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newStreak = user.streak + 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          }
          // Если diffDays === 0, стрик не меняется
        }

        // Бонус за стрик: +5 XP за каждый день серии (макс +25)
        const streakBonus = Math.min(newStreak * 5, 25);
        xpEarned = baseXp + streakBonus + moduleBonusXp + courseBonusXp;

        const updatedUser = await this.prisma.user.update({
          where: { id: userId },
          data: {
            xp: { increment: xpEarned },
            streak: newStreak,
            lastActiveAt: new Date(),
          }
        });

        totalXp = updatedUser.xp;
        newStreak = updatedUser.streak;
      }
    } else {
      // Если шаг уже был пройден или не завершился успешно, получаем текущие показатели пользователя
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      if (user) {
        newStreak = user.streak;
        totalXp = user.xp;
      }
    }

    let newEarnedBadges = [];
    if (willBeCompleted && !wasAlreadyCompleted) {
      newEarnedBadges = await this.badgesService.evaluateBadges(userId);
    }

    return {
      progress,
      xpEarned,
      newStreak,
      totalXp,
      moduleBonusXp,
      courseBonusXp,
      completedModuleTitle,
      completedCourseTitle,
      testCaseResults,
      newEarnedBadges,
    };
  }

  async runCodeForStep(stepId: string, code: string, stdin?: string) {
    const step = await this.prisma.step.findUnique({ where: { id: stepId } });
    if (!step) {
      throw new Error('Step not found');
    }
    let language = 'pascal';
    if (step.content) {
      try {
        const parsed = typeof step.content === 'string' ? JSON.parse(step.content) : step.content;
        if (parsed.language) {
          language = parsed.language;
        }
      } catch (e) {
        // ignore
      }
    }
    return this.codeSandboxService.runCode(code, language, stdin);
  }

  async getCourseProgress(userId: string, courseId: string) {
    // Получаем все шаги курса
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              include: { steps: { select: { id: true } } },
            },
          },
        },
      },
    });

    if (!course) return null;

    const allStepIds = course.modules.flatMap(m =>
      m.lessons.flatMap(l => l.steps.map(s => s.id))
    );

    if (allStepIds.length === 0) {
      return { total: 0, completed: 0, percentage: 0, completedStepIds: [] };
    }

    const completed = await this.prisma.stepProgress.findMany({
      where: { userId, stepId: { in: allStepIds }, isCompleted: true },
      select: { stepId: true },
    });

    return {
      total: allStepIds.length,
      completed: completed.length,
      percentage: Math.round((completed.length / allStepIds.length) * 100),
      completedStepIds: completed.map(p => p.stepId),
    };
  }

  async getUserStats(userId: string, role?: string) {
    if (role === 'TEACHER' || role === 'ADMIN') {
      const [coursesCount, enrollmentsCount] = await Promise.all([
        this.prisma.course.count({ where: { authorId: userId } }),
        this.prisma.enrollment.count({ where: { course: { authorId: userId } } }),
      ]);
      return { enrollments: enrollmentsCount, completedSteps: 0, coursesCount, xp: 0, streak: 0 };
    }

    const [user, enrollments, completedSteps] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { xp: true, streak: true } }),
      this.prisma.enrollment.count({ where: { userId } }),
      this.prisma.stepProgress.count({ where: { userId, isCompleted: true } }),
    ]);

    return {
      enrollments,
      completedSteps,
      coursesCount: 0,
      xp: user?.xp ?? 0,
      streak: user?.streak ?? 0,
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        xp: true,
        streak: true,
        subscriptionExpiresAt: true,
        ownedItems: {
          where: { isEquipped: true },
          include: { item: true }
        }
      }
    });
    if (!user) throw new Error('Пользователь не найден');

    const stats = await this.getUserStats(userId, user.role);

    const badges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      }
    });

    return {
      user,
      stats,
      badges: badges.map(ub => ub.badge)
    };
  }

  async getLeaderboard() {
    return this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        xp: true,
        streak: true,
        ownedItems: {
          where: { isEquipped: true },
          include: { item: true }
        }
      },
      orderBy: {
        xp: 'desc',
      },
      take: 10,
    });
  }
}

