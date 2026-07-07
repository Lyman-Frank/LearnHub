import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStepDto {
  @ApiProperty({ example: 'Шаг 1: Теория синтаксиса', description: 'Заголовок шага' })
  @IsString()
  @IsNotEmpty({ message: 'Заголовок шага не должен быть пустым' })
  title: string;

  @ApiProperty({ example: 'TEXT', description: 'Тип шага' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 1, description: 'Позиция шага в уроке (сортировка)' })
  @IsInt()
  @Min(1)
  position: number;

  @ApiProperty({ example: 'lesson-cuid', description: 'ID связанного урока' })
  @IsString()
  @IsNotEmpty()
  lessonId: string;

  @ApiPropertyOptional({ example: { body: 'Текст теории...' }, description: 'Контент шага (структура зависит от типа)' })
  @IsOptional()
  @IsObject()
  content?: any;

  @ApiPropertyOptional({ example: 50, description: 'Очки опыта (XP) за решение этого шага' })
  @IsInt()
  @Min(0)
  @IsOptional()
  xp?: number | null;
}
