import { Controller, Post, Get, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AiService } from './ai.service';

@ApiTags('AI (ИИ-помощник)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  @ApiOperation({ summary: 'Проверить доступность ИИ-помощника' })
  async getAiStatus() {
    return { enabled: this.aiService.isApiConfigured() };
  }

  @Post('steps/:stepId/hint')
  @ApiOperation({ summary: 'Получить наводящую ИИ-подсказку для кодового шага' })
  async getAiHint(
    @Param('stepId') stepId: string,
    @Body() body: { code: string },
    @Req() req: any
  ) {
    return this.aiService.getAiHintForStep(req.user.id, stepId, body.code);
  }
}
