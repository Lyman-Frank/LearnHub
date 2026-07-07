import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: '9Б класс', description: 'Название группы/класса' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'course-cuid', description: 'ID назначенного курса' })
  @IsString()
  @IsOptional()
  courseId?: string;
}
