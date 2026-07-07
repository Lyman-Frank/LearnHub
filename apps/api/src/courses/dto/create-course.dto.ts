import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'Основы программирования на Pascal', description: 'Название курса' })
  @IsString()
  @IsNotEmpty({ message: 'Название курса не должно быть пустым' })
  title: string;

  @ApiPropertyOptional({ example: 'Изучение базовых концепций программирования', description: 'Описание курса' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.png', description: 'Ссылка на обложку курса' })
  @IsString()
  @IsOptional()
  coverUrl?: string;
}
