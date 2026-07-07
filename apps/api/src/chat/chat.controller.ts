import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@ApiTags('Chat (Чат)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('global')
  @ApiOperation({ summary: 'Отправить сообщение в общий чат' })
  async sendGlobalMessage(@Request() req: any, @Body('message') message: string) {
    return this.chatService.sendGlobalMessage(req.user.id, message);
  }

  @Get('global')
  @ApiOperation({ summary: 'Получить историю общего чата' })
  async getGlobalMessages() {
    return this.chatService.getGlobalMessages();
  }

  @Post('dm')
  @ApiOperation({ summary: 'Отправить личное сообщение (DM)' })
  async sendDirectMessage(
    @Request() req: any,
    @Body('recipientId') recipientId: string,
    @Body('message') message: string
  ) {
    return this.chatService.sendDirectMessage(req.user.id, recipientId, message);
  }

  @Get('dm/conversations')
  @ApiOperation({ summary: 'Получить список личных диалогов' })
  async getConversations(@Request() req: any) {
    return this.chatService.getConversations(req.user.id);
  }

  @Get('dm/:userId')
  @ApiOperation({ summary: 'Получить историю личной переписки с пользователем' })
  async getDirectMessagesHistory(@Request() req: any, @Param('userId') userId: string) {
    return this.chatService.getDirectMessagesHistory(req.user.id, userId);
  }

  @Patch('dm/:userId/read')
  @ApiOperation({ summary: 'Пометить сообщения от пользователя как прочитанные' })
  async markAsRead(@Request() req: any, @Param('userId') userId: string) {
    return this.chatService.markAsRead(req.user.id, userId);
  }
}
