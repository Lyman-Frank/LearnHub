import { IsString, IsOptional, IsInt, Min, IsObject, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStepDto {
  @ApiPropertyOptional({ example: 'Шаг 1: Теория (Изменено)', description: 'Заголовок шага' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'TEXT', description: 'Тип шага' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 2, description: 'Позиция шага в уроке (сортировка)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ example: { body: 'Обновленный текст теории...' }, description: 'Контент шага (структура зависит от типа)' })
  @IsOptional()
  @IsObject()
  content?: any;

  @ApiPropertyOptional({ example: 50, description: 'Очки опыта (XP) за решение этого шага' })
  @IsInt()
  @Min(0)
  @IsOptional()
  xp?: number | null;

  @ApiPropertyOptional({ example: false, description: 'Архивирован ли шаг' })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
