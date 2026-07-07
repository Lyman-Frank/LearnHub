import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

  // === GLOBAL CHAT ===
  async sendGlobalMessage(userId: string, message: string) {
    this.checkCooldown(userId);
    const trimmed = message.trim();
    if (!trimmed) throw new ForbiddenException('Сообщение не может быть пустым');

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

  // === DIRECT MESSAGES ===
  async sendDirectMessage(senderId: string, recipientId: string, message: string) {
    this.checkCooldown(senderId);
    const trimmed = message.trim();
    if (!trimmed) throw new ForbiddenException('Сообщение не может быть пустым');

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
