import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModuleDto {
  @ApiPropertyOptional({ example: 'Раздел 1: Введение (Изменено)', description: 'Название модуля' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 2, description: 'Позиция модуля в курсе (сортировка)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ example: 100, description: 'Бонусные очки опыта (XP) за завершение модуля' })
  @IsInt()
  @Min(0)
  @IsOptional()
  xp?: number | null;

  @ApiPropertyOptional({ example: 'secret123', description: 'Пароль для доступа к разделу' })
  @IsString()
  @IsOptional()
  password?: string | null;

  @ApiPropertyOptional({ example: false, description: 'Архивирован ли модуль' })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional({ example: '2026-07-08T00:00:00.000Z', description: 'Дата доступности модуля' })
  @IsString()
  @IsOptional()
  availableAt?: string | null;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Дедлайн для модуля' })
  @IsString()
  @IsOptional()
  deadlineAt?: string | null;
}
