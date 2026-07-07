import { Controller, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@repo/database';

@ApiTags('Steps (Шаги уроков)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.ADMIN)
@Controller('steps')
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @Post()
  @ApiOperation({ summary: 'Добавить шаг в урок' })
  async create(@Body() dto: CreateStepDto, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.stepsService.create(dto, req.user.id, isAdmin);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить шаг' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStepDto,
    @Request() req: any
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.stepsService.update(id, dto, req.user.id, isAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить шаг' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.stepsService.remove(id, req.user.id, isAdmin);
  }
}
