import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiPropertyOptional({ example: 5, description: 'Максимальное количество использований инвайта' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number = 1;

  @ApiPropertyOptional({ example: 30, description: 'Срок действия в днях' })
  @IsOptional()
  @IsInt()
  @Min(1)
  expiresInDays?: number;

  @ApiPropertyOptional({ example: 30, description: 'Срок службы ключа в днях (доступ после активации)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number = 30;
}
