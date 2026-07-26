import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Простой список запрещенных слов (для примера)
const PROFANITY_LIST = ['дурак', 'идиот', 'дебил', 'придурок', 'сука', 'блять', 'бля', 'хрен'];

function filterProfanity(text: string): string {
  let filteredText = text;
  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '***');
  }
  return filteredText;
}

@Injectable()
export class ChatService {
  private lastMessageTime = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  private checkCooldown(userId: string) {
    const lastTime = this.lastMessageTime.get(userId);
    const now = Date.now();
    if (lastTime && now - lastTime < 3000) {
      throw new ForbiddenException('Вы отправляете сообщения слишком часто. Пожалуйста, подождите 3 секунды.');
    }
    this.lastMessageTime.set(userId, now);
  }

  private async checkBan(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { chatBannedUntil: true } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (user.chatBannedUntil && user.chatBannedUntil.getTime() > Date.now()) {
      throw new ForbiddenException(`Вы заблокированы в чате до ${user.chatBannedUntil.toLocaleString('ru-RU')}`);
    }
  }

  // === GLOBAL CHAT ===
  async sendGlobalMessage(userId: string, message: string) {
    await this.checkBan(userId);
    this.checkCooldown(userId);
    let trimmed = message.trim();
    if (!trimmed) throw new ForbiddenException('Сообщение не может быть пустым');
    
    // Модерация контента
    trimmed = filterProfanity(trimmed);

    return this.prisma.chatMessage.create({
      data: {
        userId,
        message: trimmed,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            ownedItems: {
              where: { isEquipped: true },
              include: { item: true }
            }
          },
        },
      },
    });
  }

  async getGlobalMessages() {
    return this.prisma.chatMessage.findMany({
      take: 100,
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            ownedItems: {
              where: { isEquipped: true },
              include: { item: true }
            }
          },
        },
      },
    });
  }

  async deleteGlobalMessage(userId: string, userRole: string, messageId: string) {
    const msg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Сообщение не найдено');

    if (userRole !== 'ADMIN') {
      if (msg.userId !== userId) throw new ForbiddenException('Вы не можете удалить чужое сообщение');
      const ageMs = Date.now() - msg.createdAt.getTime();
      if (ageMs > 3 * 60 * 1000) throw new ForbiddenException('Вы можете удалить сообщение только в течение 3-х минут после отправки');
    }

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });
  }

  async editGlobalMessageAdmin(adminRole: string, messageId: string, newMessage: string) {
    if (adminRole !== 'ADMIN') throw new ForbiddenException('Только администратор может редактировать сообщения');
    
    let trimmed = newMessage.trim();
    if (!trimmed) throw new ForbiddenException('Сообщение не может быть пустым');
    trimmed = filterProfanity(trimmed);

    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        message: trimmed,
        isEdited: true,
        editedByAdmin: true,
      },
    });
  }

  async banUserChat(adminRole: string, targetUserId: string, durationHours: number) {
    if (adminRole !== 'ADMIN') throw new ForbiddenException('Только администратор может банить пользователей');
    if (durationHours <= 0) throw new ForbiddenException('Некорректная длительность бана');

    const banUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { chatBannedUntil: banUntil },
    });
  }

  // === DIRECT MESSAGES ===
  async sendDirectMessage(senderId: string, recipientId: string, message: string) {
    await this.checkBan(senderId);
    this.checkCooldown(senderId);
    let trimmed = message.trim();
    if (!trimmed) throw new ForbiddenException('Сообщение не может быть пустым');

    // Модерация контента
    trimmed = filterProfanity(trimmed);

    const recipient = await this.prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) throw new NotFoundException('Получатель не найден');

    return this.prisma.directMessage.create({
      data: {
        senderId,
        recipientId,
        message: trimmed,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            ownedItems: {
              where: { isEquipped: true },
              include: { item: true }
            }
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            ownedItems: {
              where: { isEquipped: true },
              include: { item: true }
            }
          },
        },
      },
    });
  }

  async getDirectMessagesHistory(userId: string, otherUserId: string) {
    // Получаем историю
    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            ownedItems: {
              where: { isEquipped: true },
              include: { item: true }
            }
          },
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            ownedItems: {
              where: { isEquipped: true },
              include: { item: true }
            }
          },
        },
      },
    });

    // Помечаем входящие от собеседника как прочитанные
    await this.prisma.directMessage.updateMany({
      where: {
        senderId: otherUserId,
        recipientId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return messages;
  }

  async getConversations(userId: string) {
    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            ownedItems: {
              where: { isEquipped: true },
              include: { item: true }
            }
          }
        },
        recipient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            ownedItems: {
              where: { isEquipped: true },
              include: { item: true }
            }
          }
        }
      }
    });

    const conversationMap = new Map<string, any>();
    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.recipient : msg.sender;
      if (!conversationMap.has(otherUser.id)) {
        // Считаем количество непрочитанных сообщений от этого пользователя
        const unreadCount = await this.prisma.directMessage.count({
          where: {
            senderId: otherUser.id,
            recipientId: userId,
            isRead: false,
          }
        });

        conversationMap.set(otherUser.id, {
          user: otherUser,
          unreadCount,
          lastMessage: {
            id: msg.id,
            message: msg.message,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
            recipientId: msg.recipientId,
            isRead: msg.isRead
          }
        });
      }
    }

    return Array.from(conversationMap.values());
  }

  async markAsRead(userId: string, senderId: string) {
    await this.prisma.directMessage.updateMany({
      where: {
        senderId,
        recipientId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
    return { success: true };
  }
}
