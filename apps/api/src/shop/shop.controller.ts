import { Controller, Get, Post, Param, UseGuards, Request, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@repo/database';

@ApiTags('Shop (Магазин геймификации)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все предметы магазина с указанием владения' })
  async findAll(@Request() req: any) {
    return this.shopService.findAll(req.user.id);
  }

  @Post('buy/:id')
  @ApiOperation({ summary: 'Купить предмет в магазине за очки XP' })
  async buy(@Param('id') id: string, @Request() req: any) {
    return this.shopService.buyItem(id, req.user.id);
  }

  @Post('equip/:id')
  @ApiOperation({ summary: 'Экипировать предмет кастомизации' })
  async equip(@Param('id') id: string, @Request() req: any) {
    return this.shopService.equipItem(id, req.user.id);
  }

  @Post('unequip/:id')
  @ApiOperation({ summary: 'Снять предмет кастомизации' })
  async unequip(@Param('id') id: string, @Request() req: any) {
    return this.shopService.unequipItem(id, req.user.id);
  }

  @Post('admin/create')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Добавить новый товар в магазин (только для администраторов)' })
  async create(@Body() dto: any) {
    return this.shopService.createItem(dto);
  }

  @Delete('admin/delete/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить товар из магазина (только для администраторов)' })
  async delete(@Param('id') id: string) {
    return this.shopService.deleteItem(id);
  }
}
