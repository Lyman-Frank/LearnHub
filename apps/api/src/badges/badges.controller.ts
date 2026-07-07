import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('badges')
@Controller('badges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get all badges earned by the current user' })
  async getMyBadges(@Req() req) {
    return this.badgesService.getUserBadges(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all available badges' })
  async getAllBadges() {
    return this.badgesService.getAllBadges();
  }
}
