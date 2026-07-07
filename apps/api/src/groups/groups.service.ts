import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGroupDto, teacherId: string) {
    const code = await this.generateUniqueCode();

    return this.prisma.group.create({
      data: {
        name: dto.name,
        code,
        teacherId,
        courseId: dto.courseId || null,
      },
      include: {
        course: {
          select: { id: true, title: true }
        }
      }
    });
  }

  async join(code: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { code },
    });
    if (!group) {
      throw new NotFoundException('Группа с таким инвайт-кодом не найдена');
    }

    const existingMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId,
        },
      },
    });

    if (existingMembership) {
      return { message: 'Вы уже состоите в этой группе', group };
    }

    const membership = await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
      },
    });

    // Auto-enroll student into group's course if assigned
    if (group.courseId) {
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: group.courseId,
          },
        },
      });

      if (!existingEnrollment) {
        await this.prisma.enrollment.create({
          data: {
            userId,
            courseId: group.courseId,
          },
        });
      }
    }

    return { message: 'Вы успешно присоединились к группе', group };
  }

  async findAllForTeacher(teacherId: string) {
    return this.prisma.group.findMany({
      where: { teacherId },
      include: {
        course: {
          select: { id: true, title: true }
        },
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOneForTeacher(groupId: string, teacherId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        course: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                xp: true,
                institutionType: true,
                institutionName: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      throw new NotFoundException('Группа не найдена');
    }

    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('У вас нет доступа к этой группе');
    }

    // Process progress and stats for each member on group's course
    const processedMembers = await Promise.all(
      group.members.map(async (member) => {
        let percentage = 0;
        let lastActivity = member.joinedAt;

        if (group.courseId) {
          const totalStepsCount = await this.prisma.step.count({
            where: {
              lesson: { module: { courseId: group.courseId } },
              isArchived: false
            }
          });

          const completedStepsCount = await this.prisma.stepProgress.count({
            where: {
              userId: member.user.id,
              isCompleted: true,
              step: {
                lesson: { module: { courseId: group.courseId } }
              }
            }
          });

          percentage = totalStepsCount > 0 
            ? Math.round((completedStepsCount / totalStepsCount) * 100) 
            : 0;

          const lastProgress = await this.prisma.stepProgress.findFirst({
            where: {
              userId: member.user.id,
              step: {
                lesson: { module: { courseId: group.courseId } }
              }
            },
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true }
          });

          if (lastProgress) {
            lastActivity = lastProgress.updatedAt;
          }
        }

        return {
          id: member.id,
          joinedAt: member.joinedAt,
          user: member.user,
          percentage,
          lastActivity
        };
      })
    );

    return {
      id: group.id,
      name: group.name,
      code: group.code,
      course: group.course,
      createdAt: group.createdAt,
      members: processedMembers
    };
  }

  async getRealtimeActivity(groupId: string, teacherId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              }
            }
          }
        }
      }
    });

    if (!group) {
      throw new NotFoundException('Группа не найдена');
    }

    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('У вас нет доступа к этой группе');
    }

    const memberIds = group.members.map(m => m.userId);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const activeProgress = await this.prisma.stepProgress.findMany({
      where: {
        userId: { in: memberIds },
        updatedAt: { gte: twoHoursAgo }
      },
      include: {
        step: {
          include: {
            lesson: {
              include: {
                module: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const userActivityMap = new Map<string, any>();

    for (const prog of activeProgress) {
      if (!userActivityMap.has(prog.userId)) {
        const memberInfo = group.members.find(m => m.userId === prog.userId);
        
        let status = 'working';
        if (prog.isCompleted) {
          status = 'completed';
        } else if (prog.attempts >= 3 && !prog.isCorrect) {
          status = 'stuck';
        }

        userActivityMap.set(prog.userId, {
          user: memberInfo?.user,
          stepTitle: prog.step.title,
          stepType: prog.step.type,
          lessonTitle: prog.step.lesson.title,
          moduleTitle: prog.step.lesson.module.title,
          timeSpent: prog.timeSpent,
          attempts: prog.attempts,
          isCompleted: prog.isCompleted,
          status,
          updatedAt: prog.updatedAt
        });
      }
    }

    const result = group.members.map(member => {
      const active = userActivityMap.get(member.userId);
      if (active) return active;
      return {
        user: member.user,
        status: 'inactive',
        updatedAt: null
      };
    });

    return result;
  }

  async findAllForStudent(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            teacher: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            course: {
              select: { id: true, title: true }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    return memberships.map(m => ({
      id: m.id,
      joinedAt: m.joinedAt,
      group: m.group
    }));
  }

  async delete(groupId: string, teacherId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      throw new NotFoundException('Группа не найдена');
    }

    if (group.teacherId !== teacherId) {
      throw new ForbiddenException('Вы не являетесь владельцем этой группы');
    }

    return this.prisma.group.delete({
      where: { id: groupId }
    });
  }

  async getGroupsLeaderboard() {
    const groups = await this.prisma.group.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { xp: true }
            }
          }
        }
      }
    });

    const leaderboard = groups.map(group => {
      const memberCount = group.members.length;
      const totalXp = group.members.reduce((sum, member) => sum + member.user.xp, 0);
      const averageXp = memberCount > 0 ? Math.round(totalXp / memberCount) : 0;

      return {
        id: group.id,
        name: group.name,
        memberCount,
        totalXp,
        averageXp
      };
    });

    return leaderboard.sort((a, b) => b.averageXp - a.averageXp);
  }

  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let exists = true;

    while (exists) {
      let part1 = '';
      let part2 = '';
      for (let i = 0; i < 4; i++) {
        part1 += chars.charAt(Math.floor(Math.random() * chars.length));
        part2 += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `GRP-${part1}-${part2}`;

      const group = await this.prisma.group.findUnique({ where: { code } });
      if (!group) {
        exists = false;
      }
    }

    return code;
  }
}
