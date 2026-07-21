import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MinigamesService } from './minigames.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Minigames')
@ApiBearerAuth()
@Controller('minigames')
export class MinigamesController {
  constructor(private readonly minigamesService: MinigamesService) {}

  @Get('progress/:gameType')
  @ApiOperation({ summary: 'Get user progress for a specific minigame' })
  async getProgress(
    @Param('gameType') gameType: string,
    @Req() req: any,
  ) {
    return this.minigamesService.getProgress(req.user.id, gameType);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Mark a minigame level as completed' })
  async completeLevel(
    @Body() body: { gameType: string; levelId: string; stars?: number },
    @Req() req: any,
  ) {
    return this.minigamesService.completeLevel(
      req.user.id,
      body.gameType,
      body.levelId,
      body.stars || 0,
    );
  }

  @Get('config')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get XP configuration for minigames (admin only)' })
  async getXpConfig() {
    return this.minigamesService.getXpConfig();
  }

  @Post('config')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update XP configuration for minigames (admin only)' })
  async updateXpConfig(@Body() body: { config: Record<string, number> }) {
    return this.minigamesService.updateXpConfig(body.config);
  }
}
