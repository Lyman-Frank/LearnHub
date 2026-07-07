import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinGroupDto {
  @ApiProperty({ example: 'GRP-1234-5678', description: 'Инвайт-код группы' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
