import { Controller, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@repo/database';

@ApiTags('Lessons (Уроки)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.ADMIN)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @ApiOperation({ summary: 'Добавить урок в модуль' })
  async create(@Body() dto: CreateLessonDto, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.lessonsService.create(dto, req.user.id, isAdmin);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить урок' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @Request() req: any
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.lessonsService.update(id, dto, req.user.id, isAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить урок' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.lessonsService.remove(id, req.user.id, isAdmin);
  }
}
