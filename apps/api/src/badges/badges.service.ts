import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(private prisma: PrismaService) {}

  async getUserBadges(userId: string) {
    try {
      // Самолечение: автоматически вычисляем и выдаем ачивки, если условия выполнены
      await this.evaluateBadges(userId);
    } catch (err) {
      this.logger.error(`Ошибка при авто-начислении ачивок (самолечении): ${err.message}`);
    }

    return this.prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    });
  }

  async getAllBadges() {
    return this.prisma.badge.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // Called to evaluate if user earned any new badges
  async evaluateBadges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: true,
        progress: true,
        enrollments: {
          include: {
            course: {
              include: {
                modules: {
                  include: { lessons: { include: { steps: true } } }
                }
              }
            }
          }
        }
      }
    });

    if (!user) return [];

    const allBadges = await this.prisma.badge.findMany();
    const earnedBadgeIds = new Set(user.badges.map(b => b.badgeId));
    
    const newBadges = [];

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      let earned = false;
      
      switch (badge.requirementType) {
        case 'STREAK':
          if (user.streak >= badge.requirementValue) earned = true;
          break;
        case 'XP_EARNED':
          if (user.xp >= badge.requirementValue) earned = true;
          break;
        case 'STEPS_COMPLETED':
          const completedSteps = user.progress.filter(p => p.isCompleted).length;
          if (completedSteps >= badge.requirementValue) earned = true;
          break;
        case 'COURSE_COMPLETED':
          let completedCourses = 0;
          for (const enrollment of user.enrollments) {
            const course = enrollment.course;
            let totalSteps = 0;
            let completedStepsInCourse = 0;
            for (const mod of course.modules) {
              for (const les of mod.lessons) {
                totalSteps += les.steps.length;
                for (const stp of les.steps) {
                  if (user.progress.find(p => p.stepId === stp.id && p.isCompleted)) {
                    completedStepsInCourse++;
                  }
                }
              }
            }
            if (totalSteps > 0 && totalSteps === completedStepsInCourse) {
              completedCourses++;
            }
          }
          if (completedCourses >= badge.requirementValue) earned = true;
          break;
      }

      if (earned) {
        await this.prisma.userBadge.create({
          data: {
            userId: user.id,
            badgeId: badge.id,
          }
        });
        newBadges.push(badge);
        this.logger.log(`User ${user.id} earned badge ${badge.name}`);
      }
    }

    return newBadges;
  }
}
