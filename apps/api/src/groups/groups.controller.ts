import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@repo/database';

@ApiTags('Groups (Группы/Классы)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Создать новую учебную группу/класс' })
  async create(@Body() dto: CreateGroupDto, @Request() req: any) {
    return this.groupsService.create(dto, req.user.id);
  }

  @Post('join')
  @ApiOperation({ summary: 'Присоединиться к группе по инвайт-коду' })
  async join(@Body() dto: JoinGroupDto, @Request() req: any) {
    return this.groupsService.join(dto.code, req.user.id);
  }

  @Get('teacher')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить список всех классов преподавателя' })
  async findAllForTeacher(@Request() req: any) {
    return this.groupsService.findAllForTeacher(req.user.id);
  }

  @Get('teacher/:id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить подробную статистику класса и его учеников' })
  async findOneForTeacher(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.findOneForTeacher(id, req.user.id);
  }

  @Get('teacher/:id/realtime')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить активность учеников класса в реальном времени' })
  async getRealtimeActivity(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.getRealtimeActivity(id, req.user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Получить лидерборд групп/классов' })
  async getGroupsLeaderboard() {
    return this.groupsService.getGroupsLeaderboard();
  }

  @Get('student')
  @ApiOperation({ summary: 'Получить список групп, в которых состоит студент' })
  async findAllForStudent(@Request() req: any) {
    return this.groupsService.findAllForStudent(req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить группу/класс' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.groupsService.delete(id, req.user.id);
  }
}
