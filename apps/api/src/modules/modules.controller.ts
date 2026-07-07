import { Controller, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModulesService } from './modules.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@repo/database';

@ApiTags('Modules (Модули курсов)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.ADMIN)
@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @ApiOperation({ summary: 'Добавить новый модуль в курс' })
  async create(@Body() dto: CreateModuleDto, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.modulesService.create(dto, req.user.id, isAdmin);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить информацию модуля' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateModuleDto,
    @Request() req: any
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.modulesService.update(id, dto, req.user.id, isAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить модуль из курса' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.modulesService.remove(id, req.user.id, isAdmin);
  }
}
