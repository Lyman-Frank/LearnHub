import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Default fallback XP rewards per level
const FALLBACK_XP_CONFIG: Record<string, number> = {
  ROBOT_ESCAPE: 25,
  MINECRAFT_CRAFTING: 30,
};

@Injectable()
export class MinigamesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all progress records for a user in a specific game type
   */
  async getProgress(userId: string, gameType: string) {
    return this.prisma.minigameProgress.findMany({
      where: { userId, gameType },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Complete a minigame level. Awards XP only on first completion.
   */
  async completeLevel(
    userId: string,
    gameType: string,
    levelId: string,
    stars: number = 0,
  ) {
    // Check if already completed
    const existing = await this.prisma.minigameProgress.findUnique({
      where: {
        userId_gameType_levelId: { userId, gameType, levelId },
      },
    });

    if (existing?.isCompleted) {
      // Already completed — update stars if better, but no additional XP
      if (stars > existing.stars) {
        return this.prisma.minigameProgress.update({
          where: { id: existing.id },
          data: { stars },
        });
      }
      return existing;
    }

    const config = await this.getXpConfig();
    const xpReward = config[gameType] ?? FALLBACK_XP_CONFIG[gameType] ?? 20;

    // Use transaction to award XP and save progress atomically
    const [progress] = await this.prisma.$transaction([
      this.prisma.minigameProgress.upsert({
        where: {
          userId_gameType_levelId: { userId, gameType, levelId },
        },
        create: {
          userId,
          gameType,
          levelId,
          isCompleted: true,
          stars,
          xpEarned: xpReward,
          completedAt: new Date(),
        },
        update: {
          isCompleted: true,
          stars,
          xpEarned: xpReward,
          completedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xpReward } },
      }),
    ]);

    return { ...progress, xpAwarded: xpReward };
  }

  /**
   * Get XP config
   */
  async getXpConfig() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'MINIGAMES_XP_CONFIG' }
    });
    if (setting) {
      try {
        return JSON.parse(setting.value);
      } catch (e) {}
    }
    return FALLBACK_XP_CONFIG;
  }

  /**
   * Update XP config
   */
  async updateXpConfig(config: Record<string, number>) {
    const setting = await this.prisma.systemSetting.upsert({
      where: { key: 'MINIGAMES_XP_CONFIG' },
      create: {
        key: 'MINIGAMES_XP_CONFIG',
        value: JSON.stringify(config)
      },
      update: {
        value: JSON.stringify(config)
      }
    });
    return JSON.parse(setting.value);
  }
}
