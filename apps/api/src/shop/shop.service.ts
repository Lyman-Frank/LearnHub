import { Injectable, OnModuleInit, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Seed default shop items if none exist
    const count = await this.prisma.shopItem.count();
    if (count === 0) {
      console.log('Seeding default shop items...');
      const defaultItems = [
        {
          title: 'Неоновая фиолетовая рамка',
          description: 'Придает вашему аватару футуристическое неоновое свечение.',
          cost: 200,
          type: 'AVATAR_FRAME',
          imageUrl: '/shop/frames/neon-violet.png',
          metadata: JSON.stringify({ borderClass: 'ring-4 ring-violet-500 ring-offset-2 ring-offset-slate-950 animate-pulse' })
        },
        {
          title: 'Океанская бирюзовая рамка',
          description: 'Освежающий аквамариновый ободок для любителей морских глубин.',
          cost: 350,
          type: 'AVATAR_FRAME',
          imageUrl: '/shop/frames/ocean-teal.png',
          metadata: JSON.stringify({ borderClass: 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-950 animate-pulse' })
        },
        {
          title: 'Золотая рамка Лидера',
          description: 'Премиальная рамка для настоящих чемпионов платформы.',
          cost: 500,
          type: 'AVATAR_FRAME',
          imageUrl: '/shop/frames/gold-champion.png',
          metadata: JSON.stringify({ borderClass: 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-amber-500/20' })
        },
        {
          title: 'Значок: Гуру Pascal',
          description: 'Уникальная медаль в профиль за освоение базового синтаксиса.',
          cost: 100,
          type: 'BADGE',
          imageUrl: '/shop/badges/pascal-guru.png',
          metadata: JSON.stringify({ icon: 'Code', color: '#8b5cf6' })
        },
        {
          title: 'Значок: Воин Кода',
          description: 'Медаль за решение сложных песочниц программирования.',
          cost: 250,
          type: 'BADGE',
          imageUrl: '/shop/badges/code-warrior.png',
          metadata: JSON.stringify({ icon: 'ShieldAlert', color: '#ec4899' })
        },
        {
          title: 'Значок: Мастер Gemini',
          description: 'Значок для тех, кто активно пользуется подсказками ИИ.',
          cost: 400,
          type: 'BADGE',
          imageUrl: '/shop/badges/gemini-master.png',
          metadata: JSON.stringify({ icon: 'Sparkles', color: '#06b6d4' })
        }
      ];

      for (const item of defaultItems) {
        await this.prisma.shopItem.create({ data: item });
      }
      console.log('Seeding default shop items completed.');
    }
  }

  async findAll(userId: string) {
    const items = await this.prisma.shopItem.findMany({
      orderBy: { cost: 'asc' }
    });

    const userPurchases = await this.prisma.userItem.findMany({
      where: { userId }
    });

    return items.map(item => {
      const purchase = userPurchases.find(p => p.itemId === item.id);
      return {
        ...item,
        isOwned: !!purchase,
        isEquipped: purchase ? purchase.isEquipped : false,
        purchaseId: purchase ? purchase.id : null
      };
    });
  }

  async buyItem(itemId: string, userId: string) {
    const item = await this.prisma.shopItem.findUnique({
      where: { id: itemId }
    });
    if (!item) {
      throw new NotFoundException('Предмет не найден в магазине');
    }

    const existingPurchase = await this.prisma.userItem.findUnique({
      where: {
        userId_itemId: { userId, itemId }
      }
    });
    if (existingPurchase) {
      throw new ConflictException('Вы уже приобрели этот предмет');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.xp < item.cost) {
      throw new BadRequestException(`Недостаточно очков опыта (XP). Требуется: ${item.cost}, у вас: ${user.xp}`);
    }

    // Check conditions
    if (item.requiredCoursesCount > 0) {
      const completedCourses = await this.prisma.certificate.count({ where: { userId } });
      if (completedCourses < item.requiredCoursesCount) {
        throw new BadRequestException(
          `Для покупки этого предмета необходимо пройти минимум ${item.requiredCoursesCount} курсов. У вас пройдено: ${completedCourses}`
        );
      }
    }

    if (item.requiredStreakDays > 0) {
      if (user.streak < item.requiredStreakDays) {
        throw new BadRequestException(
          `Для покупки этого предмета требуется ударный режим (стрик) от ${item.requiredStreakDays} дней. Ваш стрик: ${user.streak}`
        );
      }
    }

    // Deduct XP and record purchase
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { xp: { decrement: item.cost } }
      });

      const purchase = await tx.userItem.create({
        data: {
          userId,
          itemId,
          isEquipped: false
        },
        include: { item: true }
      });

      return {
        message: 'Предмет успешно приобретен',
        purchase
      };
    });
  }

  async equipItem(itemId: string, userId: string) {
    const purchase = await this.prisma.userItem.findUnique({
      where: {
        userId_itemId: { userId, itemId }
      },
      include: { item: true }
    });

    if (!purchase) {
      throw new NotFoundException('Вы еще не приобрели этот предмет');
    }

    if (purchase.isEquipped) {
      return { message: 'Предмет уже экипирован', purchase };
    }

    // Unequip all other items of the same type
    return this.prisma.$transaction(async (tx) => {
      await tx.userItem.updateMany({
        where: {
          userId,
          item: { type: purchase.item.type }
        },
        data: { isEquipped: false }
      });

      const updated = await tx.userItem.update({
        where: { id: purchase.id },
        data: { isEquipped: true },
        include: { item: true }
      });

      return {
        message: 'Предмет успешно экипирован',
        purchase: updated
      };
    });
  }

  async unequipItem(itemId: string, userId: string) {
    const purchase = await this.prisma.userItem.findUnique({
      where: {
        userId_itemId: { userId, itemId }
      }
    });

    if (!purchase) {
      throw new NotFoundException('Вы не владеете этим предметом');
    }

    const updated = await this.prisma.userItem.update({
      where: { id: purchase.id },
      data: { isEquipped: false }
    });

    return {
      message: 'Предмет снят',
      purchase: updated
    };
  }

  async createItem(dto: {
    title: string;
    description?: string;
    cost: number;
    type: string;
    imageUrl?: string;
    metadata?: string;
    requiredCoursesCount?: number;
    requiredStreakDays?: number;
  }) {
    return this.prisma.shopItem.create({
      data: {
        title: dto.title,
        description: dto.description,
        cost: dto.cost,
        type: dto.type,
        imageUrl: dto.imageUrl,
        metadata: dto.metadata,
        requiredCoursesCount: dto.requiredCoursesCount ?? 0,
        requiredStreakDays: dto.requiredStreakDays ?? 0,
      }
    });
  }

  async updateItem(id: string, dto: {
    title?: string;
    description?: string;
    cost?: number;
    type?: string;
    imageUrl?: string;
    metadata?: string;
    requiredCoursesCount?: number;
    requiredStreakDays?: number;
  }) {
    const item = await this.prisma.shopItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Предмет не найден');
    }
    return this.prisma.shopItem.update({
      where: { id },
      data: dto
    });
  }

  async deleteItem(id: string) {
    const item = await this.prisma.shopItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Предмет не найден');
    }
    await this.prisma.shopItem.delete({ where: { id } });
    return { message: 'Предмет успешно удален из магазина' };
  }
}
