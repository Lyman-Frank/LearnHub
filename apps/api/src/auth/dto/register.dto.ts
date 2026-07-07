import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@repo/database';

export class RegisterDto {
  @ApiProperty({ example: 'student@example.com', description: 'Электронная почта' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Пароль (мин. 6 символов)' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'Иван', description: 'Имя' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Иванов', description: 'Фамилия' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.STUDENT, description: 'Роль пользователя' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'TEACH-ABCD-1234', description: 'Инвайт-код (обязательно для TEACHER)' })
  @IsOptional()
  @IsString()
  inviteCode?: string;

  @ApiPropertyOptional({ example: 'Колледж', description: 'Тип учебного заведения' })
  @IsOptional()
  @IsString()
  institutionType?: string;

  @ApiPropertyOptional({ example: 'Колледж связи №54', description: 'Название учебного заведения' })
  @IsOptional()
  @IsString()
  institutionName?: string;
}
