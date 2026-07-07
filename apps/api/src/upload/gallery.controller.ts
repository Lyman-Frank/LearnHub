import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@repo/database';
import { GalleryService } from './gallery.service';

@ApiTags('Gallery (Галерея изображений)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  /** Получить всю галерею (доступно всем авторизованным) */
  @Get()
  @ApiOperation({ summary: 'Получить всю галерею' })
  getAll() {
    return this.galleryService.getAll();
  }

  /** Добавить изображение в категорию (только ADMIN) */
  @Post('image')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Добавить изображение в галерею (только Admin)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  addImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { category: string; label: string },
  ) {
    if (!file) {
      throw new BadRequestException('Файл не был загружен');
    }
    if (!body.category) {
      throw new BadRequestException('Не указана категория');
    }
    const url = `http://localhost:3001/uploads/${file.filename}`;
    return this.galleryService.addImage(
      body.category,
      url,
      body.label || file.originalname,
    );
  }

  /** Добавить изображение по URL в категорию (только ADMIN) */
  @Post('image/url')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Добавить изображение по URL (только Admin)' })
  addImageByUrl(@Body() body: { category: string; label: string; url: string }) {
    if (!body.url || !body.category) {
      throw new BadRequestException('Не указан URL или категория');
    }
    return this.galleryService.addImage(body.category, body.url, body.label || 'Без названия');
  }

  /** Удалить изображение (только ADMIN) */
  @Delete('image/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить изображение из галереи (только Admin)' })
  deleteImage(@Param('id') id: string) {
    const ok = this.galleryService.deleteImage(id);
    if (!ok) throw new BadRequestException('Изображение не найдено');
    return { success: true };
  }

  /** Добавить новую категорию (только ADMIN) */
  @Post('category')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Добавить категорию (только Admin)' })
  addCategory(@Body() body: { name: string }) {
    if (!body.name) throw new BadRequestException('Название категории не указано');
    this.galleryService.addCategory(body.name);
    return { success: true, name: body.name };
  }

  /** Удалить категорию (только ADMIN) */
  @Delete('category/:name')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить категорию (только Admin)' })
  deleteCategory(@Param('name') name: string) {
    this.galleryService.deleteCategory(name);
    return { success: true };
  }
}
