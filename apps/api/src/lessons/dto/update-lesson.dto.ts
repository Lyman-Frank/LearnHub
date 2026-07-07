import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 'Урок 1: Синтаксис Pascal (Изменено)', description: 'Название урока' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 2, description: 'Позиция урока в модуле (сортировка)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  position?: number;

  @ApiPropertyOptional({ example: false, description: 'Архивирован ли урок' })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiPropertyOptional({ example: '2026-07-08T00:00:00.000Z', description: 'Дата доступности урока' })
  @IsString()
  @IsOptional()
  availableAt?: string | null;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Дедлайн для урока' })
  @IsString()
  @IsOptional()
  deadlineAt?: string | null;
}
