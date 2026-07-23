import { Controller, Post, Get, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProgressService } from './progress.service';

@ApiTags('Progress (Прогресс)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('steps/:stepId/complete')
  @ApiOperation({ summary: 'Отметить шаг как пройденный' })
  async completeStep(
    @Param('stepId') stepId: string,
    @Body() body: { answer?: string; isCorrect?: boolean; timeSpent?: number },
    @Request() req: any
  ) {
    return this.progressService.completeStep(req.user.id, stepId, body.answer, body.isCorrect, body.timeSpent);
  }

  @Post('steps/:stepId/run-code')
  @ApiOperation({ summary: 'Запустить код в песочнице' })
  async runCode(
    @Param('stepId') stepId: string,
    @Body() body: { code: string; stdin?: string }
  ) {
    return this.progressService.runCodeForStep(stepId, body.code, body.stdin);
  }

  @Get('courses/:courseId')
  @ApiOperation({ summary: 'Получить прогресс по курсу' })
  async getCourseProgress(@Param('courseId') courseId: string, @Request() req: any) {
    return this.progressService.getCourseProgress(req.user.id, courseId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Получить статистику пользователя' })
  async getUserStats(@Request() req: any) {
    return this.progressService.getUserStats(req.user.id, req.user.role);
  }

  @Get('users/:userId/profile')
  @ApiOperation({ summary: 'Получить профиль и статистику любого пользователя' })
  async getUserProfile(@Param('userId') userId: string, @Request() req: any) {
    return this.progressService.getUserProfile(userId, req.user?.id, req.user?.role);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Получить таблицу лидеров (топ студентов)' })
  async getLeaderboard() {
    return this.progressService.getLeaderboard();
  }
}

