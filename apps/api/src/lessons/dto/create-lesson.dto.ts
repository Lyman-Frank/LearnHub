import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ example: 'Урок 1: Синтаксис Pascal', description: 'Название урока' })
  @IsString()
  @IsNotEmpty({ message: 'Название урока не должно быть пустым' })
  title: string;

  @ApiProperty({ example: 1, description: 'Позиция урока в модуле (сортировка)' })
  @IsInt()
  @Min(1)
  position: number;

  @ApiProperty({ example: 'module-cuid', description: 'ID связанного модуля' })
  @IsString()
  @IsNotEmpty()
  moduleId: string;
}
