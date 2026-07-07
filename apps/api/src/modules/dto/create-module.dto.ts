import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ example: 'Раздел 1: Введение', description: 'Название модуля' })
  @IsString()
  @IsNotEmpty({ message: 'Название модуля не должно быть пустым' })
  title: string;

  @ApiProperty({ example: 1, description: 'Позиция модуля в курсе (сортировка)' })
  @IsInt()
  @Min(1)
  position: number;

  @ApiProperty({ example: 'course-cuid', description: 'ID связанного курса' })
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
