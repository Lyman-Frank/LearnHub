import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesQueryDto } from './dto/courses-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@repo/database';

@ApiTags('Courses (Курсы)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('catalog')
  @Public()
  @ApiOperation({ summary: 'Публичный каталог опубликованных курсов' })
  async findPublished(@Query() query: CoursesQueryDto) {
    return this.coursesService.findPublished(query.search, query.page, query.limit);
  }

  @Get('student/my')
  @ApiOperation({ summary: 'Курсы, на которые записан текущий студент' })
  async getStudentCourses(@Request() req: any) {
    return this.coursesService.getStudentCourses(req.user.id);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Записаться на курс' })
  async enroll(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.enroll(id, req.user.id);
  }

  @Get(':id/enrollment')
  @ApiOperation({ summary: 'Проверить запись студента на курс' })
  async checkEnrollment(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.getEnrollment(id, req.user.id);
  }

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Создать новый курс (только для TEACHER/ADMIN)' })
  async create(@Body() dto: CreateCourseDto, @Request() req: any) {
    return this.coursesService.create(dto, req.user.id);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Список всех курсов для модерации' })
  async findAllForAdmin() {
    return this.coursesService.findAllForAdmin();
  }

  @Patch('admin/:id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Изменить статус курса' })
  async adminUpdateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.coursesService.adminUpdateStatus(id, status);
  }

  @Post('admin/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Отклонить публикацию курса с указанием причины' })
  async adminRejectCourse(
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    return this.coursesService.adminRejectCourse(id, reason);
  }

  @Get('author')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить список курсов автора (только для TEACHER/ADMIN)' })
  async findAllByAuthor(@Request() req: any) {
    return this.coursesService.findAllByAuthor(req.user.id);
  }

  @Get(':id/teacher/students')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить список студентов курса с их прогрессом' })
  async getCourseStudents(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.getCourseStudents(id, req.user.id);
  }

  @Get(':id/teacher/students/:studentId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Получить детальный прогресс студента по шагам' })
  async getStudentProgressDetails(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Request() req: any
  ) {
    return this.coursesService.getStudentProgressDetails(id, studentId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить детальную информацию о курсе' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.findOne(id, req.user.id, req.user.role);
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: 'Разблокировать частный курс паролем' })
  async unlockCourse(
    @Param('id') id: string,
    @Body('password') password: string,
    @Request() req: any
  ) {
    return this.coursesService.unlockCourse(id, password, req.user.id);
  }

  @Post('modules/:moduleId/unlock')
  @ApiOperation({ summary: 'Разблокировать раздел паролем' })
  async unlockModule(
    @Param('moduleId') moduleId: string,
    @Body('password') password: string,
    @Request() req: any
  ) {
    return this.coursesService.unlockModule(moduleId, password, req.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Обновить курс' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @Request() req: any
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.coursesService.update(id, dto, req.user.id, isAdmin);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить курс' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.coursesService.remove(id, req.user.id, isAdmin);
  }
}
