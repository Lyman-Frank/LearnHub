import { IsString, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Продвинутый Pascal', description: 'Название курса' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Новое описание курса', description: 'Описание курса' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-cover.png', description: 'Ссылка на обложку курса' })
  @IsString()
  @IsOptional()
  coverUrl?: string;

  @ApiPropertyOptional({ example: 'PUBLISHED', description: 'Статус курса' })
  @IsString()
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED'])
  status?: string;

  @ApiPropertyOptional({ example: 500, description: 'Бонусные очки опыта (XP) за полное завершение курса' })
  @IsInt()
  @Min(0)
  @IsOptional()
  xp?: number | null;

  @ApiPropertyOptional({ example: 'secret123', description: 'Пароль для доступа к курсу (если приватный)' })
  @IsString()
  @IsOptional()
  password?: string | null;
}
